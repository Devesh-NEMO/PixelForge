/**
 * A tiny, dependency-free PDF writer for image documents.
 *
 * Every page holds one JPEG (DCTDecode) sized so the image fills the page
 * without distortion. No fonts, no scripts, no compression filters beyond the
 * JPEG payload itself, which keeps the file small and the writer auditable.
 */

export type PdfImagePage = {
  /** JPEG bytes, as produced by `canvas.toBlob("image/jpeg")`. */
  jpeg: Uint8Array;
  width: number;
  height: number;
};

export type PdfOptions = {
  title?: string;
};

/** A4 long edge, in PostScript points (1/72 inch). */
const PAGE_LONG_EDGE = 842;

/** Page proportions follow the image, scaled to an A4-ish long edge. */
export function pdfPageSize(width: number, height: number) {
  const longEdge = Math.max(width, height);

  if (!Number.isFinite(longEdge) || longEdge <= 0) {
    return { width: PAGE_LONG_EDGE, height: PAGE_LONG_EDGE };
  }

  const scale = PAGE_LONG_EDGE / longEdge;

  return {
    width: Math.round(width * scale * 100) / 100,
    height: Math.round(height * scale * 100) / 100,
  };
}

/** PDF strings are Latin-1-ish; drop anything unprintable and escape delimiters. */
function escapePdfText(value: string) {
  return value.replace(/[^\x20-\x7e]/g, "").replace(/([\\()])/g, "\\$1");
}

export function buildPdf(
  pages: PdfImagePage[],
  options: PdfOptions = {}
): Uint8Array {
  if (pages.length === 0) {
    throw new Error("A PDF needs at least one page.");
  }

  for (const page of pages) {
    if (!page.jpeg.length) {
      throw new Error("An embedded page has no image data.");
    }
  }

  const count = pages.length;
  const totalObjects = 3 + count * 3;
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  const encoder = new TextEncoder();
  let cursor = 0;

  const write = (data: string | Uint8Array) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    chunks.push(bytes);
    cursor += bytes.length;
  };

  const openObject = (id: number) => {
    offsets[id] = cursor;
    write(`${id} 0 obj\n`);
  };
  const closeObject = () => write("endobj\n");

  const pageId = (index: number) => 4 + index * 3;
  const contentId = (index: number) => 5 + index * 3;
  const imageId = (index: number) => 6 + index * 3;

  write("%PDF-1.7\n");
  // Binary marker so transfer tools treat the file as binary.
  write(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  openObject(1);
  write("<< /Type /Catalog /Pages 2 0 R >>\n");
  closeObject();

  const kids = pages.map((_, index) => `${pageId(index)} 0 R`).join(" ");
  openObject(2);
  write(`<< /Type /Pages /Count ${count} /Kids [${kids}] >>\n`);
  closeObject();

  openObject(3);
  write(
    `<< /Producer (PixelForge) /Title (${escapePdfText(
      options.title ?? "PixelForge"
    )}) >>\n`
  );
  closeObject();

  pages.forEach((page, index) => {
    const { width: pageWidth, height: pageHeight } = pdfPageSize(
      page.width,
      page.height
    );

    openObject(pageId(index));
    write(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
        `/Resources << /XObject << /Im0 ${imageId(index)} 0 R >> >> ` +
        `/Contents ${contentId(index)} 0 R >>\n`
    );
    closeObject();

    const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
    openObject(contentId(index));
    write(`<< /Length ${content.length} >>\nstream\n${content}endstream\n`);
    closeObject();

    openObject(imageId(index));
    write(
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ` +
        `/Length ${page.jpeg.length} >>\nstream\n`
    );
    write(page.jpeg);
    write("\nendstream\n");
    closeObject();
  });

  const xrefStart = cursor;
  write(`xref\n0 ${totalObjects + 1}\n`);
  write("0000000000 65535 f \n");

  for (let id = 1; id <= totalObjects; id += 1) {
    write(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }

  write(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R /Info 3 0 R >>\n` +
      `startxref\n${xrefStart}\n%%EOF\n`
  );

  const output = new Uint8Array(cursor);
  let position = 0;

  for (const chunk of chunks) {
    output.set(chunk, position);
    position += chunk.length;
  }

  return output;
}
