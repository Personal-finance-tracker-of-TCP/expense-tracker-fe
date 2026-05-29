"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	ArrowLeftRight,
	BarChart2,
	LayoutDashboard,
	PiggyBank,
	Sparkles,
	Tag,
	Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebarStore";

type SidebarProps = {
	className?: string;
};

const navigationItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
	{ href: "/categories", label: "Categories", icon: Tag },
	{ href: "/budget", label: "Budget", icon: PiggyBank },
	{ href: "/reports", label: "Reports", icon: BarChart2 },
	{ href: "/ai-advisor", label: "AI Advisor", icon: Sparkles },
];

export function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();
	const isOpen = useSidebarStore((state) => state.isOpen);
	const close = useSidebarStore((state) => state.close);
	const toggle = useSidebarStore((state) => state.toggle);
	const [isDesktop, setIsDesktop] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(min-width: 768px)");

		const updateBreakpoint = () => {
			setIsDesktop(mediaQuery.matches);
		};

		updateBreakpoint();
		mediaQuery.addEventListener("change", updateBreakpoint);

		return () => mediaQuery.removeEventListener("change", updateBreakpoint);
	}, []);

	useEffect(() => {
		if (!isDesktop || isOpen) {
			return;
		}

		toggle();
	}, [isDesktop, isOpen, toggle]);

	const shouldShowBackdrop = !isDesktop && isOpen;

	return (
		<>
			{shouldShowBackdrop ? (
				<button
					type="button"
					aria-label="Close sidebar"
					className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
					onClick={close}
				/>
			) : null}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-gray-800 bg-gray-900 text-white transition-transform duration-200 ease-out md:static md:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
					className,
				)}
			>
			<div className="flex items-center gap-3 border-b border-gray-800 px-6 py-5">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-400/25">
					<Wallet className="h-5 w-5" />
				</div>
				<div>
					<p className="text-sm font-semibold tracking-[0.2em] text-gray-300 uppercase">
						FinTrack
					</p>
					<p className="text-xs text-gray-400">Expense management</p>
				</div>
			</div>

			<nav className="flex-1 px-3 py-5">
				<ul className="space-y-1">
					{navigationItems.map((item) => {
						const isActive =
							pathname === item.href || pathname.startsWith(`${item.href}/`);
						const Icon = item.icon;

						return (
							<li key={item.href}>
								<Link
									href={item.href}
									aria-current={isActive ? "page" : undefined}
									className={cn(
										"flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
										isActive
											? "bg-white/10 text-white shadow-sm"
											: "text-gray-300 hover:bg-white/5 hover:text-white",
									)}
								>
									<Icon className="h-4 w-4 shrink-0" />
									<span>{item.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			<div className="border-t border-gray-800 px-4 py-5">
				<div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
						ND
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-medium text-white">Người dùng</p>
						<p className="truncate text-xs text-gray-400">user@example.com</p>
					</div>
				</div>
			</div>
			</aside>
		</>
	);
}
