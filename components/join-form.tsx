"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { Notice } from "@/components/ui";

export function JoinForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/class/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const result = await response.json().catch(() => ({}));
      if (response.status === 401) { router.replace("/login?next=/join"); return; }
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to submit the enrollment request.");
      router.replace("/pending");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit the enrollment request.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit}>
    <div className="field" style={{ marginTop: 25 }}><label htmlFor="class-code">BA-28A0 class access code</label><div className="search" style={{ width: "100%" }}><KeyRound size={16} /><input id="class-code" required minLength={6} maxLength={128} autoComplete="off" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter the code shared by your administrator" /></div></div>
    <Notice>A code validates class membership only. It does not select or claim a student record; an administrator must approve identity matching separately.</Notice>
    {error && <Notice tone="warning">{error}</Notice>}
    <div className="auth-actions"><button className="btn btn-primary" disabled={busy} type="submit">{busy ? "Validating…" : <>Submit securely <ArrowRight size={15} /></>}</button></div>
    <div className="footer-note"><ShieldCheck size={13} style={{ verticalAlign: -2, marginRight: 4 }} />Identity claims stay private from other students.</div>
  </form>;
}
