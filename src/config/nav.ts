import {
	Building2,
	CheckSquare,
	FileArchive,
	Home,
	Settings,
	ShieldCheck,
	UserPlus,
	Zap,
} from "lucide-react";

export const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: Home },
	{ href: "/leads", label: "Leads", icon: UserPlus },
	{ href: "/customers", label: "Clientes", icon: Building2 },
	{ href: "/renewals", label: "Renovaciones", icon: ShieldCheck },
	{ href: "/tasks", label: "Tareas", icon: CheckSquare },
	{ href: "/documents", label: "Documentos", icon: FileArchive },
	{ href: "/settings", label: "Ajustes", icon: Settings },
];

export const appBrand = {
	name: "Renovaciones CRM",
	description: "Cartera, contratos y avisos",
	icon: Zap,
};
