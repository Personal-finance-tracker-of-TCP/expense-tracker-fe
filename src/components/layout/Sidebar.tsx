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
	UserRound,
	Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebarStore";

type SidebarProps = {
	className?: string;
};

const navigationItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tone: "bg-teal-400" },
	{ href: "/transactions", label: "Transactions", icon: ArrowLeftRight, tone: "bg-sky-400" },
	{ href: "/categories", label: "Categories", icon: Tag, tone: "bg-amber-400" },
	{ href: "/budget", label: "Budget", icon: PiggyBank, tone: "bg-emerald-400" },
	{ href: "/reports", label: "Reports", icon: BarChart2, tone: "bg-indigo-400" },
	{ href: "/ai-advisor", label: "AI Advisor", icon: Sparkles, tone: "bg-fuchsia-400" },
	{ href: "/profile", label: "Profile", icon: UserRound, tone: "bg-rose-400" },
];

export function Sidebar({ className }: SidebarProps) {
	const pathname = usePathname();
	const isOpen = useSidebarStore((state) => state.isOpen);
	const close = useSidebarStore((state) => state.close);
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

	const shouldShowBackdrop = !isDesktop && isOpen;

	return (
		<>
			{shouldShowBackdrop ? (
				<button
					type="button"
					aria-label="Close sidebar"
					className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm md:hidden"
					onClick={close}
				/>
			) : null}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-40 flex h-dvh w-[18rem] flex-col overflow-hidden border-r border-white/10 bg-[#0d231f] text-white shadow-2xl shadow-teal-950/25 transition-transform duration-300 ease-out md:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
					className,
				)}
			>
				<div className="absolute inset-0 bg-[linear-gradient(155deg,rgba(45,212,191,0.18),transparent_36%),linear-gradient(25deg,rgba(251,191,36,0.13),transparent_42%)]" />
				<div
					aria-hidden="true"
					className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:26px_26px]"
				/>

			<div className="relative flex items-center gap-3 border-b border-white/10 px-6 py-6">
				<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-lg shadow-teal-950/20">
					<Wallet className="h-6 w-6" />
				</div>
				<div className="min-w-0">
					<p className="text-base font-black tracking-[0.18em] text-white">
						FINTRACK
					</p>
					<p className="mt-0.5 text-xs font-medium text-teal-100/75">
						Smart finance hub
					</p>
				</div>
			</div>

			<nav className="relative flex-1 px-4 py-5">
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
										"group relative flex items-center gap-3 rounded-3xl px-3 py-3 text-sm font-semibold transition-all duration-200",
										isActive
											? "bg-white text-[#12312b] shadow-lg shadow-teal-950/20"
											: "text-teal-50/76 hover:bg-white/10 hover:text-white",
									)}
								>
									<span
										className={cn(
											"flex h-9 w-9 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
											isActive ? "bg-[#12312b] text-white" : "bg-white/10 text-teal-100",
										)}
									>
										<Icon className="h-4 w-4 shrink-0" />
									</span>
									<span className="min-w-0 flex-1 truncate">{item.label}</span>
									<span
										aria-hidden="true"
										className={cn(
											"h-2 w-2 rounded-full opacity-60 transition-opacity",
											item.tone,
											isActive ? "opacity-100" : "group-hover:opacity-100",
										)}
									/>
								</Link>
							</li>
						);
					})}
				</ul>

			</nav>
			</aside>
		</>
	);
}
