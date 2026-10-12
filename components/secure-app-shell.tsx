"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpen, BrainCircuit, ClipboardList, FileCheck2, FileText, Gauge, History, KeyRound, LayoutDashboard, ListChecks, LogOut, ScrollText, Settings, SlidersHorizontal, Sparkles, Trophy, UploadCloud, Users } from "lucide-react";
import { signOut } from "@firebase/auth";
import { auth } from "@/lib/firebase";
import { Initials } from "./ui";

const studentNav = [
  { label: "Overview", href: "/student", icon: LayoutDashboard },
  { label: "All tests", href: "/student/tests", icon: ClipboardList },
  { label: "Test leaderboard", href: "/student/leaderboard/test-wise", icon: Trophy },
  { label: "Cumulative ranking", href: "/student/leaderboard/cumulative", icon: ListChecks },
  { label: "Class analytics", href: "/student/analytics", icon: BarChart3 },
  { label: "Subject analytics", href: "/student/analytics/subjects", icon: BookOpen },
  { label: "My history", href: "/student/history", icon: History },
  { label: "Question analysis", href: "/student/questions", icon: BrainCircuit },
];
const adminNav = [
  { label: "Admin overview", href: "/admin", icon: Gauge },
  { label: "Student directory", href: "/admin/students", icon: Users },
  { label: "Test management", href: "/admin/tests", icon: ClipboardList },
  { label: "Import center", href: "/admin/imports", icon: UploadCloud },
  { label: "Result review", href: "/admin/results", icon: FileCheck2 },
  { label: "Test analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Ranking management", href: "/admin/rankings", icon: Trophy },
  { label: "Enrollment & codes", href: "/admin/enrollment", icon: KeyRound },
  { label: "Audit logs", href: "/admin/audit", icon: ScrollText },
];

export function SecureAppShell({ role, children }: { role: "student" | "admin"; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "admin" ? adminNav : studentNav;
  const bottom = role === "admin" ? [{ label: "Export & settings", href: "/admin/settings", icon: SlidersHorizontal }] : [{ label: "My report", href: "/student/report", icon: FileText }, { label: "Profile & settings", href: "/student/settings", icon: Settings }];

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    if (auth) await signOut(auth);
    router.push("/");
  }

  return <div className="app-bg"><div className="shell"><aside className="sidebar"><Link href={role === "admin" ? "/admin" : "/student"} className="brand"><span className="brand-mark"><Sparkles size={18} /></span><span className="brand-copy"><div className="brand-title">ClassRank</div><div className="brand-sub">BA-28A0 · Ranchi</div></span></Link><div className="nav-label">Workspace</div><nav>{nav.map((item) => { const Icon = item.icon; const active = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href)); return <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}><Icon /><span>{item.label}</span></Link>; })}</nav><div className="nav-label" style={{ marginTop: "auto" }}>Account</div>{bottom.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}><Icon /><span>{item.label}</span></Link>; })}<button type="button" className="nav-item" onClick={handleSignOut}><LogOut /><span>Sign out</span></button></aside><main className="main"><header className="topbar"><div className="crumb"><strong>{role === "admin" ? "Admin workspace" : "Student workspace"}</strong><span> / </span> BA-28A0</div><div className="top-actions"><div className="mode-pill"><span className="mode-dot" /> Authorized workspace</div><Initials name={role === "admin" ? "Admin" : "Student"} size="large" /></div></header>{children}</main></div></div>;
}
