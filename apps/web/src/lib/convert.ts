import { extractText, getDocumentProxy } from "unpdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import mammoth from "mammoth";
import PDFDocument from "pdfkit";

/**
 * Extract plain text from a PDF buffer using unpdf (pure-JS).
 * Returns one string per page, joined with double newlines.
 */
async function pdfBufferToText(pdfBuffer: Buffer): Promise<string[]> {
  const uint8 = new Uint8Array(pdfBuffer.buffer, pdfBuffer.byteOffset, pdfBuffer.byteLength);
  const pdf = await getDocumentProxy(uint8);
  const { text } = await extractText(pdf, { mergePages: false });
  const pages = Array.isArray(text) ? text : [text];
  return pages.map((p) => (typeof p === "string" ? p : String(p)));
}

/**
 * Convert a PDF buffer into a DOCX buffer.
 * Preserves only plain text — one paragraph per non-empty line, one page break between PDF pages.
 */
export async function pdfToDocx(pdfBuffer: Buffer): Promise<Buffer> {
  const pages = await pdfBufferToText(pdfBuffer);

  const children: Paragraph[] = [];
  pages.forEach((pageText, pageIndex) => {
    const lines = pageText.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      children.push(
        new Paragraph({
          children: [new TextRun(trimmed.length === 0 ? "" : line)],
        }),
      );
    }
    if (pageIndex < pages.length - 1) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: "", break: 1 })], pageBreakBefore: true }),
      );
    }
  });

  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Convert a DOCX buffer into a PDF buffer.
 * Preserves only plain text (via mammoth's raw text extraction) rendered with pdfkit.
 */
export async function docxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const { value: rawText } = await mammoth.extractRawText({ buffer: docxBuffer });

  return await new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.font("Helvetica").fontSize(11);

      const lines = rawText.split(/\r?\n/);
      for (const line of lines) {
        if (line.trim().length === 0) {
          doc.moveDown();
        } else {
          doc.text(line);
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
