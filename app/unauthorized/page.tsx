import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/app-shell";
export default function UnauthorizedPage() { return <AuthShell><div className="auth-card" style={{ margin: "0 auto", textAlign: "center" }}><LockKeyhole size={38} color="#ff7a86" style={{ marginBottom: 18 }} /><h1>Access restricted.</h1><p className="subtitle">This workspace is only available to an approved BA-28A0 account with the right permissions.</p><Link className="btn btn-primary" style={{ marginTop: 23 }} href="/login">Return to sign in</Link></div></AuthShell>; }
