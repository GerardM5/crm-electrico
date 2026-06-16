import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { safeStorageFileName } from "../lib/storage";
import { supabase } from "../lib/supabase";
import type { Tables } from "../types/database.types";
import { queryKeys } from "./query-keys";

export type DocumentRow = Tables<"documents">;

/** Documents for a single customer (customer-detail) — returns full array, bounded by customer */
export function useDocuments(filterOrId?: string | { customerId?: string }) {
	const customerId =
		typeof filterOrId === "string" ? filterOrId : filterOrId?.customerId;
	return useQuery<DocumentRow[]>({
		queryKey: queryKeys.documents({ customerId }),
		queryFn: async () => {
			let q = supabase
				.from("documents")
				.select("*")
				.order("created_at", { ascending: false });
			if (customerId) q = q.eq("customer_id", customerId);
			const { data, error } = await q;
			if (error) throw error;
			return data as DocumentRow[];
		},
	});
}

export interface AllDocumentsFilter {
	search?: string;
	type?: string;
	page?: number;
	pageSize?: number;
}

/** All documents (global page) — server-side pagination, search by file_name, type filter */
export function useAllDocuments(filter: AllDocumentsFilter = {}) {
	const { search, type, page = 0, pageSize = 25 } = filter;
	return useQuery<{ data: DocumentRow[]; count: number }>({
		queryKey: queryKeys.documents({ ...filter, global: true }),
		queryFn: async () => {
			let q = supabase
				.from("documents")
				.select("*", { count: "exact" })
				.order("created_at", { ascending: false });
			if (type && type !== "all") q = q.eq("type", type as never);
			if (search) q = q.ilike("file_name", `%${search}%`);
			q = q.range(page * pageSize, (page + 1) * pageSize - 1);
			const { data, error, count } = await q;
			if (error) throw error;
			return { data: data as DocumentRow[], count: count ?? 0 };
		},
	});
}

export type UploadStep = "uploading" | "saving";

function uploadErrorMessage(error: { message?: string }): string {
	const raw = error.message ?? "";
	if (/exists|duplicate|409/i.test(raw))
		return "Ya existe un archivo con ese nombre. Renómbralo e inténtalo de nuevo.";
	if (/invalid key/i.test(raw))
		return "El nombre del archivo contiene caracteres no válidos. Renómbralo e inténtalo de nuevo.";
	if (/exceeded|too large|413|maximum/i.test(raw))
		return "El archivo supera el tamaño máximo permitido.";
	return "No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.";
}

export function useDeleteDocument() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			bucket,
			file_path,
		}: { id: string; bucket: string; file_path: string }) => {
			const { error: storageError } = await supabase.storage
				.from(bucket)
				.remove([file_path]);
			if (storageError)
				throw new Error("No se pudo eliminar el archivo del almacenamiento.");
			const { error } = await supabase.from("documents").delete().eq("id", id);
			if (error)
				throw new Error("No se pudo eliminar el registro del documento.");
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ["documents"] });
		},
	});
}

export function useUploadDocument() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			file,
			customerId,
			type,
			uploadedBy,
			onProgress,
		}: {
			file: File;
			customerId: string;
			type: DocumentRow["type"];
			uploadedBy?: string;
			onProgress?: (step: UploadStep) => void;
		}) => {
			const bucket = "documents";
			const filePath = `${customerId}/${Date.now()}-${safeStorageFileName(file.name)}`;

			onProgress?.("uploading");
			const { error: uploadError } = await supabase.storage
				.from(bucket)
				.upload(filePath, file);
			if (uploadError) throw new Error(uploadErrorMessage(uploadError));

			onProgress?.("saving");
			const { data, error } = await supabase
				.from("documents")
				.insert({
					customer_id: customerId,
					type,
					bucket,
					file_path: filePath,
					file_name: file.name,
					mime_type: file.type,
					size_bytes: file.size,
					uploaded_by: uploadedBy,
				} as never)
				.select()
				.single();
			if (error)
				throw new Error(
					"El archivo se subió pero no se pudo guardar el registro. Inténtalo de nuevo.",
				);
			return data as DocumentRow;
		},
		onSuccess: () => {
			// Invalidate all document queries regardless of filters
			void qc.invalidateQueries({ queryKey: ["documents"] });
		},
	});
}
