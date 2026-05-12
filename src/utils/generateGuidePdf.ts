import { jsPDF } from "jspdf";

type Day = {
  day_number: number;
  title?: string;
  description?: string;
  activities?: string[];
  accommodation?: string;
};

export interface GuidePdfInput {
  title: string;
  destination: string;
  duration_days: number;
  description?: string | null;
  days: Day[];
  creatorName?: string | null;
}

export function generateGuidePdf(guide: GuidePdfInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text: string, fontSize: number, lineGap = 4, style: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = fontSize * 1.25;
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += lineGap;
  };

  // Header band
  doc.setFillColor(12, 77, 71);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("GOLDSAINTE · ITINERARY GUIDE", margin, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${guide.destination} · ${guide.duration_days} days`, margin, 58);
  if (guide.creatorName) {
    doc.text(`By ${guide.creatorName}`, margin, 74);
  }

  y = 130;
  doc.setTextColor(10, 34, 37);
  writeWrapped(guide.title, 22, 8, "bold");

  if (guide.description) {
    doc.setTextColor(60, 60, 60);
    writeWrapped(guide.description, 11, 12);
  }

  doc.setDrawColor(199, 169, 98);
  ensureSpace(20);
  doc.line(margin, y, margin + 40, y);
  y += 18;

  doc.setTextColor(10, 34, 37);
  writeWrapped("Day by Day", 16, 10, "bold");

  for (const d of guide.days || []) {
    ensureSpace(40);
    doc.setTextColor(12, 77, 71);
    writeWrapped(`Day ${d.day_number}${d.title ? ` — ${d.title}` : ""}`, 13, 4, "bold");

    if (d.description) {
      doc.setTextColor(60, 60, 60);
      writeWrapped(d.description, 11, 6);
    }
    if (d.activities && d.activities.length) {
      doc.setTextColor(10, 34, 37);
      for (const a of d.activities) {
        writeWrapped(`•  ${a}`, 11, 2);
      }
      y += 4;
    }
    if (d.accommodation) {
      doc.setTextColor(107, 114, 128);
      writeWrapped(`Stay: ${d.accommodation}`, 10, 10);
    }
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Goldsainte · ${guide.title}`,
      margin,
      pageHeight - 24,
    );
    doc.text(`${i} / ${pageCount}`, pageWidth - margin, pageHeight - 24, { align: "right" });
  }

  const safeName = guide.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "guide";
  doc.save(`${safeName}.pdf`);
}