import Link from "next/link";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/app-shell";
import { JoinForm } from "@/components/join-form";

export default function SecureJoinPage() {
  return <AuthShell><div className="auth-card" style={{ margin: "0 auto" }}><Link href="/login" className="section-link"><ArrowLeft size={13} style={{ verticalAlign: -2 }} /> Back to sign in</Link><div className="brand logo-center" style={{ marginTop: 26 }}><span className="brand-mark"><KeyRound size={18} /></span><span className="brand-copy"><div className="brand-title">ClassRank</div><div className="brand-sub">BA-28A0 enrollment</div></span></div><p className="eyebrow" style={{ marginTop: 31 }}>Enrollment verification</p><h1>Join your class.</h1><p className="subtitle">Enter the code shared by your administrator. A code validates class membership only and never claims a student identity.</p><JoinForm /><div className="footer-note"><ShieldCheck size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Identity claims remain private from classmates.</div></div></AuthShell>;
}
