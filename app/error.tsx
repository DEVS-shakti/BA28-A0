"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <div className="public-wrap"><div className="public-card auth-card" style={{ textAlign: "center" }}><p className="eyebrow">Request unavailable</p><h1>We couldn&apos;t open that record.</h1><p className="subtitle">The requested academic record is unavailable or you do not have permission to view it.</p><button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => reset()}>Try again</button></div></div>;
}
