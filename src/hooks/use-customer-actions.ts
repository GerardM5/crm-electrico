import { addMonths } from "date-fns";
import { toast } from "sonner";
import { formatDate } from "../lib/formatters";
import { useLogActivity } from "../services/activity.service";
import {
	type CustomerRow,
	useUpdateCustomer,
} from "../services/customers.service";
import { useToastError } from "./use-toast-error";

const RENEWAL_MONTHS = 12;

function toDateColumn(date: Date) {
	return date.toISOString().slice(0, 10);
}

/**
 * Centralizes the customer renewal/contact business rules so every entry point
 * (renewals queue, customer detail) shares the exact same side effects.
 */
export function useCustomerActions() {
	const updateCustomer = useUpdateCustomer();
	const logActivity = useLogActivity();
	const onError = useToastError();

	function renewCustomer(customer: Pick<CustomerRow, "id" | "name">) {
		const today = new Date();
		const renewalDate = addMonths(today, RENEWAL_MONTHS);
		updateCustomer.mutate(
			{
				id: customer.id,
				status: "renewed",
				contract_signed_at: toDateColumn(today),
				renewal_date: toDateColumn(renewalDate),
			},
			{
				onSuccess: () => {
					logActivity.mutate({
						entityType: "customer",
						entityId: customer.id,
						action: "renewed",
						metadata: {
							label: `Contrato renovado hasta ${formatDate(renewalDate.toISOString())}`,
						},
					});
					toast.success(`${customer.name} renovado`, {
						description: `Próxima renovación: ${formatDate(renewalDate.toISOString())}`,
					});
				},
				onError,
			},
		);
	}

	return { renewCustomer, isPending: updateCustomer.isPending };
}
