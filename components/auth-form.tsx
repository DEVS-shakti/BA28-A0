"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from "@firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { Notice } from "@/components/ui";

type AuthMode = "signin" | "signup" | "recovery";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export function AuthForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!firebaseConfigured || !auth) throw new Error("Firebase Authentication is not configured.");
      if (mode === "recovery") {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage("If an account matches that address, a recovery email has been sent.");
        return;
      }
      const credential = mode === "signup"
        ? await createUserWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithEmailAndPassword(auth, email.trim(), password);
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await credential.user.getIdToken(true) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Unable to create a secure session.");
      const destination = safeNext(nextPath ?? null) ?? (result.role === "admin" ? "/admin" : result.needsEnrollment ? "/join" : "/student");
      router.replace(destination);
      router.refresh();
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "";
      if (detail === "Firebase Authentication is not configured." || detail === "Authentication service is not configured.") setError(detail);
      else if (mode === "recovery") setMessage("If an account matches that address, a recovery email has been sent.");
      else setError(detail || (mode === "signup" ? "Unable to create that account. Check the details and try again." : "Unable to sign in with those credentials."));
    } finally {
      setBusy(false);
    }
  }

  const recovery = mode === "recovery";
  return <form onSubmit={submit}>
    <div className="field" style={{ marginTop: 25 }}>
      <label htmlFor="auth-email">Email address</label>
      <div className="search" style={{ width: "100%" }}><Mail size={16} /><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
    </div>
    {!recovery && <div className="field" style={{ marginTop: 14 }}>
      <label htmlFor="auth-password">Password</label>
      <div className="search" style={{ width: "100%" }}><KeyRound size={16} /><input id="auth-password" type="password" minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></div>
    </div>}
    {error && <Notice tone="warning">{error}</Notice>}
    {message && <Notice>{message}</Notice>}
    {!firebaseConfigured && <Notice tone="warning">Firebase Authentication is not configured for this environment. No workspace access is available.</Notice>}
    <div className="auth-actions"><button className="btn btn-primary" disabled={busy || !firebaseConfigured} type="submit">{busy ? "Working…" : recovery ? "Send recovery email" : mode === "signup" ? <><UserRound size={15} />Create account</> : <><ShieldCheck size={15} />Sign in securely</>}</button></div>
    <div className="section-head" style={{ marginTop: 19, marginBottom: 0 }}>
      {recovery ? <button type="button" className="section-link" onClick={() => setMode("signin")}>Back to sign in</button> : <button type="button" className="section-link" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create a student account" : "I already have an account"}</button>}
      {!recovery && <button type="button" className="section-link" onClick={() => setMode("recovery")}>Forgot password?</button>}
    </div>
  </form>;
}
