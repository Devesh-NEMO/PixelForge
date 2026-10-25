import { describe, expect, it } from "vitest";
import { buildPdf, pdfPageSize } from "../lib/pdf";

const JPEG = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff,
  0xd9,
]);

const text = (bytes: Uint8Array, start = 0, end?: number) =>
  new TextDecoder("latin1").decode(bytes.slice(start, end));

function startXref(bytes: Uint8Array) {
  const tail = text(bytes).slice(-240);
  const match = tail.match(/startxref\n(\d+)\n%%EOF/);
  return match ? Number(match[1]) : -1;
}

describe("pdfPageSize", () => {
  it("scales the long edge to an A4-ish size", () => {
    expect(pdfPageSize(1400, 900)).toEqual({ width: 842, height: 541.29 });
    expect(pdfPageSize(900, 1400)).toEqual({ width: 541.29, height: 842 });
  });

  it("falls back for degenerate sizes", () => {
    expect(pdfPageSize(0, 0)).toEqual({ width: 842, height: 842 });
  });
});

describe("buildPdf", () => {
  const bytes = buildPdf(
    [
      { jpeg: JPEG, width: 1400, height: 900 },
      { jpeg: JPEG, width: 900, height: 1400 },
    ],
    { title: "My (test)" }
  );
  const document = text(bytes);

  it("has a header and an EOF marker", () => {
    expect(text(bytes, 0, 8)).toBe("%PDF-1.7");
    expect(document.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("points startxref at the cross-reference table", () => {
    const offset = startXref(bytes);
    expect(offset).toBeGreaterThan(0);
    expect(text(bytes, offset, offset + 4)).toBe("xref");
  });

  it("writes a correct offset for every object", () => {
    const xrefStart = startXref(bytes);
    const table = document.slice(xrefStart);
    const header = table.match(/^xref\n0 (\d+)\n/);

    expect(header).not.toBeNull();
    const size = Number(header?.[1]);
    const body = table.slice(header?.[0].length ?? 0);

    for (let id = 1; id < size; id += 1) {
      // Entry 0 is the free-list head, so object `id` sits at index `id`.
      const entry = body.slice(id * 20, (id + 1) * 20);
      const offset = Number(entry.slice(0, 10));

      expect(entry.slice(10)).toBe(" 00000 n \n");
      expect(text(bytes, offset)).toMatch(new RegExp(`^${id} 0 obj`));
    }
  });

  it("embeds one JPEG per page", () => {
    expect(document).toContain("/Count 2");
    expect(document).toContain("/MediaBox [0 0 842 541.29]");
    expect(document).toContain("/MediaBox [0 0 541.29 842]");
    expect(document.match(/\/Subtype \/Image/g)).toHaveLength(2);
    expect(document.match(/\/Filter \/DCTDecode/g)).toHaveLength(2);
  });

  it("escapes parentheses in the title", () => {
    expect(document).toContain("/Title (My \\(test\\))");
  });

  it("refuses empty documents and empty pages", () => {
    expect(() => buildPdf([])).toThrow();
    expect(() =>
      buildPdf([{ jpeg: new Uint8Array(), width: 10, height: 10 }])
    ).toThrow();
  });
});
