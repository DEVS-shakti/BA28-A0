import Link from "next/link";
import { CheckCircle2, Clock3, Mail } from "lucide-react";
import { AuthShell } from "@/components/app-shell";
import { Notice } from "@/components/ui";

export default function EnrollmentStatusPage() {
  return <AuthShell><div className="auth-card" style={{ margin: "0 auto", textAlign: "center" }}><div className="avatar" style={{ margin: "0 auto 21px", width: 54, height: 54, background: "rgba(246,189,96,.14)", color: "#f6bd60" }}><Clock3 /></div><p className="eyebrow">Verification in progress</p><h1>Request received.</h1><p className="subtitle">Your authenticated account is waiting for an administrator to match it with an approved BA-28A0 student record.</p><Notice>Your request is private. Access opens only after an administrator approves the identity match.</Notice><div className="list-row" style={{ marginTop: 18, textAlign: "left" }}><span className="student-cell"><Mail size={16} color="#6ea8fe" /><span><b style={{ display: "block", fontSize: 12 }}>Authenticated account</b><small className="muted">Identity claim submitted securely</small></span></span><CheckCircle2 size={17} color="#46d39a" /></div><Link className="btn btn-ghost" style={{ marginTop: 22 }} href="/login">Return to sign in</Link></div></AuthShell>;
}
