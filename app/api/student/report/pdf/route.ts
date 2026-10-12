import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import { calculateCumulative } from "@/lib/ranking-engine";
import { getAuthorizedStudentOverview, type AuthorizedResultSummary, type AuthorizedTestSummary } from "@/lib/server-academic-repositories";
import { requireApprovedStudent } from "@/lib/server-auth";

export const runtime = "nodejs";

async function renderReport(name: string, tests: AuthorizedTestSummary[], results: AuthorizedResultSummary[]) {
  const document = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });
  document.fontSize(22).fillColor("#14233d").text("ClassRank");
  document.fontSize(10).fillColor("#667085").text("Brother's Academy · BA-28A0");
  document.moveDown(1.2).fontSize(18).fillColor("#14233d").text("Personal academic report");
  document.fontSize(12).fillColor("#344054").text(`Student: ${name}`);
  document.moveDown();
  if (tests.length === 0) document.fontSize(11).fillColor("#667085").text("No published results are available for this account.");
  else {
    document.fontSize(12).fillColor("#14233d").text("Published test history");
    for (const test of tests) {
      const result = results.find((candidate) => candidate.testId === test.id);
      document.fontSize(10).fillColor("#344054").text(`${test.name} · ${test.date ?? "Date unavailable"} · ${result?.status === "completed" && result.percentage !== null ? `${result.percentage}%` : result?.status ?? "Not graded"}`);
    }
    const cumulative = calculateCumulative([{ studentId: "self", results: Object.fromEntries(results.map((result) => [result.testId, { status: result.status, percentage: result.percentage }])) }], tests.map((test) => test.id))[0];
    document.moveDown().fontSize(12).fillColor("#14233d").text("Cumulative eligibility");
    document.fontSize(10).fillColor("#344054").text(`Score: ${cumulative.score}% · Eligible tests: ${cumulative.eligible} · Completed: ${cumulative.completed} · Status: ${cumulative.official ? "Official rank eligible" : "Provisional"}`);
  }
  document.moveDown(2).fontSize(9).fillColor("#667085").text("Generated from currently authorized published Firebase records. This report contains no administrative identity fields.");
  document.end();
  return completed;
}

export async function GET() {
  try {
    const session = await requireApprovedStudent();
    const overview = await getAuthorizedStudentOverview(session.uid, session.profile.studentId!);
    if (!overview) return NextResponse.json({ error: "Report unavailable." }, { status: 404 });
    const pdf = await renderReport(overview.student.name, overview.tests, overview.results);
    return new Response(new Uint8Array(pdf), { status: 200, headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=classrank-personal-report.pdf", "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Approved student access is required." }, { status: 403 });
    return NextResponse.json({ error: "Report service is unavailable." }, { status: 503 });
  }
}
