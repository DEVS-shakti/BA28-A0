import { z } from "zod";

export const testSchema = z.object({
  name: z.string().min(3, "Add a descriptive test name"),
  date: z.string().min(1, "Choose a test date"),
  category: z.enum(["Subject test", "Combined PCM", "JEE-style mock"]),
  maxMarks: z.coerce.number().positive("Maximum marks must be greater than 0"),
});

export const importRowSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  marks: z.coerce.number().finite("Marks must be a number").min(0, "Marks cannot be negative"),
});
