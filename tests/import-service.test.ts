import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { parseSpreadsheet } from "../lib/import-parser";

test("spreadsheet preview flags unknown IDs, duplicates and score ranges", async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");
  sheet.addRows([["student_id", "marks"], ["BA28A0-001", 82], ["BA28A0-001", 81], ["BA28A0-999", 44], ["BA28A0-002", 101]]);
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const preview = await parseSpreadsheet(buffer, "results.xlsx", new Set(["BA28A0-001", "BA28A0-002"]), 100);
  assert.equal(preview.rows.length, 4);
  assert.equal(preview.validCount, 1);
  assert.equal(preview.errorCount, 3);
  assert.ok(preview.rows[1].errors.some((error) => error.includes("Duplicate")));
  assert.ok(preview.rows[2].errors.some((error) => error.includes("not in the approved")));
  assert.ok(preview.rows[3].errors.some((error) => error.includes("between 0 and 100")));
});
