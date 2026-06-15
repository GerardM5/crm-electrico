import {
	AlertTriangle,
	Building2,
	FileArchive,
	Home,
	ListChecks,
	Settings,
	ShieldCheck,
	Zap,
} from "lucide-react";

export const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: Home },
	{ href: "/customers", label: "Clientes", icon: Building2 },
	{ href: "/renewals", label: "Renovaciones", icon: ShieldCheck },
	{ href: "/incidents", label: "Incidencias", icon: AlertTriangle },
	{ href: "/tasks", label: "Tareas", icon: ListChecks },
	{ href: "/documents", label: "Documentos", icon: FileArchive },
	{ href: "/settings", label: "Ajustes", icon: Settings },
];

export const appBrand = {
	name: "OPTIENERGIA CRM",
	description: "Panel de administración",
	icon: Zap,
};
