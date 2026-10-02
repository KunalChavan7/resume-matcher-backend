import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("The uploaded PDF is empty.");
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text?.trim();
    if (!text) {
      throw new Error("No readable text was found in the PDF.");
    }
    return text;
  } finally {
    await parser.destroy();
  }
}