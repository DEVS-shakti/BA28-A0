import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AuthShell } from "@/components/app-shell";
import { AuthForm } from "@/components/auth-form";

export default async function SecureLoginPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
  const resolvedSearchParams = await searchParams;
  return <AuthShell><div className="auth-card" style={{ margin: "0 auto" }}><div className="brand logo-center"><span className="brand-mark"><Sparkles size={18} /></span><span className="brand-copy"><div className="brand-title">ClassRank</div><div className="brand-sub">BA-28A0 · Ranchi</div></span></div><p className="eyebrow">Secure authentication</p><h1>Welcome back.</h1><p className="subtitle">Sign in to your verified ClassRank account. Workspace access is checked again on the server.</p><AuthForm nextPath={resolvedSearchParams?.next} /><div className="section-head" style={{ marginTop: 19, marginBottom: 0 }}><Link className="section-link" href="/pending">Need account help?</Link></div><p className="footer-note">Your account role and student identity are never accepted from the browser.</p></div></AuthShell>;
}
