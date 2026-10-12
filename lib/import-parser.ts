import { createHash } from "node:crypto";
import readXlsxFile from "read-excel-file/node";
import { z } from "zod";

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const rawRowSchema = z.record(z.unknown());

export type ImportPreviewRow = {
  rowNumber: number;
  studentId: string;
  marks: number | null;
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type ImportPreview = {
  sourceHash: string;
  filename: string;
  rows: ImportPreviewRow[];
  validCount: number;
  warningCount: number;
  errorCount: number;
};

function normalizedKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function getValue(row: Record<string, unknown>, keys: string[]) {
  const entries = Object.entries(row).map(([key, value]) => [normalizedKey(key), value] as const);
  return entries.find(([key]) => keys.includes(key))?.[1];
}

function parseMarks(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function parseCsv(buffer: Buffer): unknown[][] {
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Pure parser/validator. The server route is the only production caller. */
export async function parseSpreadsheet(buffer: Buffer, filename: string, knownStudentIds: Set<string>, maxMarks: number): Promise<ImportPreview> {
  if (buffer.length > MAX_IMPORT_BYTES) throw new Error("File exceeds the 10 MB import limit.");
  const extension = filename.toLowerCase().split(".").pop();
  if (extension !== "csv" && extension !== "xlsx") throw new Error("Only CSV and XLSX files are supported in this workflow.");
  const sheets = extension === "csv" ? [] : await readXlsxFile(buffer);
  const sheetRows: unknown[][] = extension === "csv" ? parseCsv(buffer) : (sheets[0]?.data ?? []) as unknown[][];
  const [headerRow, ...dataRows] = sheetRows;
  const headers = (headerRow ?? []).map((value) => String(value ?? "").trim());
  const rows = dataRows.map((values) => rawRowSchema.parse(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))));
  if (rows.length === 0) throw new Error("The uploaded sheet contains no data rows.");
  const seen = new Set<string>();
  const previewRows = rows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rawStudentId = getValue(row, ["student_id", "studentid", "id"]);
    const rawMarks = getValue(row, ["marks", "total_marks", "totalmarks", "score"]);
    const studentId = typeof rawStudentId === "string" ? rawStudentId.trim() : String(rawStudentId ?? "").trim();
    const marks = parseMarks(rawMarks);
    if (!studentId) errors.push("Missing stable student_id.");
    else if (!knownStudentIds.has(studentId)) errors.push("Student ID is not in the approved class directory.");
    if (marks === null) errors.push("Marks must be a finite number.");
    else if (marks < 0 || marks > maxMarks) errors.push(`Marks must be between 0 and ${maxMarks}.`);
    if (studentId && seen.has(studentId)) errors.push("Duplicate student ID in this import.");
    if (studentId) seen.add(studentId);
    if (rawStudentId === undefined) warnings.push("No student name matching was attempted; stable IDs are required.");
    return { rowNumber: index + 2, studentId, marks, valid: errors.length === 0, errors, warnings };
  });
  return { sourceHash: createHash("sha256").update(buffer).digest("hex"), filename, rows: previewRows, validCount: previewRows.filter((row) => row.valid).length, warningCount: previewRows.reduce((count, row) => count + row.warnings.length, 0), errorCount: previewRows.reduce((count, row) => count + row.errors.length, 0) };
}
