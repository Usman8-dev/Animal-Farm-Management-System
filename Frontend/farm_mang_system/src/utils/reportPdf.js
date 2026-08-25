import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Shared helpers ------------------------------------------------------------

const BRAND = "Herdwell";
const PRIMARY = [31, 61, 46]; // #1f3d2e
const ACCENT = [227, 197, 92]; // #e3c55c
const MUTED = [102, 113, 106];

const money = (n) => {
  const v = Number(n);
  return Number.isNaN(v)
    ? "—"
    : `Rs. ${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const num = (n, d = 2) => {
  const v = Number(n);
  return Number.isNaN(v)
    ? "—"
    : v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
};

const dateStr = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString();
};

// Draws the branded header band + title and returns the vertical position.
function drawHeader(doc, title, subtitle) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 34, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 34, pageW, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(BRAND, 14, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(220, 226, 220);
  doc.text(title, 14, 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY);
  doc.text(subtitle, 14, 48);
}

// Draws a summary "card" box; returns nothing (caller tracks layout).
function drawStatCard(doc, x, y, w, h, label, value) {
  doc.setFillColor(244, 241, 233);
  doc.setDrawColor(230, 226, 214);
  doc.roundedRect(x, y, w, h, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x + 8, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PRIMARY);
  doc.text(value, x + 8, y + 25);
}

// Applies the shared table theme and prints a footer with page number.
function themedTable(doc, options) {
  autoTable(doc, {
    margin: { left: 14, right: 14 },
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
      textColor: [27, 36, 29],
      lineColor: [230, 226, 214],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: PRIMARY,
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: { fillColor: [244, 241, 233] },
    didDrawPage: (data) => {
      const pageH = doc.internal.pageSize.getHeight();
      const pageW = doc.internal.pageSize.getWidth();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(`${BRAND} • Farm Management System`, 14, pageH - 8);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageW - 14, pageH - 8, {
        align: "right",
      });
    },
    ...options,
  });
}

const finalize = (doc, fileName) => {
  doc.save(fileName);
};

// Report 1: Weight growth trend (per animal) -------------------------------

export function generateGrowthTrendPdf({ animal, rows, generatedBy = "" }) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const label = animal
    ? `${animal.tag_number}${animal.name ? ` — ${animal.name}` : ""}`
    : "";
  drawHeader(
    doc,
    `Generated ${new Date().toLocaleString()}${generatedBy ? ` • by ${generatedBy}` : ""}`,
    "Animal Growth Trend"
  );

  let y = 56;
  if (label) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text(`Animal: ${label}`, 14, y);
    y += 6;
  }

  const data = Array.isArray(rows) ? rows : [];
  const fmtRows = data.map((r) => [
    dateStr(r.effective_from),
    `${num(r.weight_kg, 1)} kg`,
    r.source || "—",
  ]);
  const hasData = fmtRows.length > 0;


  if (hasData) {
    // Simple line chart of weight over time
    const cx = 14, cw = pageW - 28;
    const chartTop = y + 18, chartH = 60;
    const vals = data.map((r) => Number(r.weight_kg));
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY);
    doc.text("Weight progression (kg)", cx, y + 2);

    doc.setDrawColor(220, 220, 215);
    doc.line(cx, chartTop + chartH, cx + cw, chartTop + chartH);
    doc.line(cx, chartTop, cx, chartTop + chartH);

    const step = data.length > 1 ? cw / (data.length - 1) : 0;
    let px = cx, py = chartTop + chartH - ((vals[0] - min) / range) * chartH;
    data.forEach((r, i) => {
      const x = cx + step * i;
      const v = Number(r.weight_kg);
      const yy = chartTop + chartH - ((v - min) / range) * chartH;
      if (i > 0) {
        doc.setDrawColor(...PRIMARY);
        doc.setLineWidth(0.6);
        doc.line(px, py, x, yy);
      }
      doc.setFillColor(...ACCENT);
      doc.circle(x, yy, 1.3, "F");
      px = x;
      py = yy;
    });

    y = chartTop + chartH + 14;
    themedTable(doc, {
      startY: y,
      head: [["Date", "Weight (kg)", "Source"]],
      body: fmtRows,
    });
  } else {
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text("No weight records found for this animal.", 14, y);
  }

  finalize(doc, `growth-trend-${animal?.tag_number || "animal"}.pdf`);
}


// Report 2: Total herd value -----------------------------------------------

export function generateTotalHerdValuePdf({ data, generatedBy = "" }) {
  const doc = new jsPDF();
  drawHeader(
    doc,
    `Generated ${new Date().toLocaleString()}${generatedBy ? ` • by ${generatedBy}` : ""}`,
    "Total Herd Value"
  );

  const total = Number(data?.total ?? 0);
  const count = Number(data?.count ?? 0);
  const animals = data?.animals || [];

  const pageW = doc.internal.pageSize.getWidth();
  const cardW = (pageW - 42) / 2;
  drawStatCard(doc, 14, 56, cardW, 34, "Total Value", money(total));
  drawStatCard(doc, 14 + cardW + 14, 56, cardW, 34, "Animals Valued", `${count}`);

  const y = 100;
  themedTable(doc, {
    startY: y,
    head: [["Tag", "Name", "Value", "Date", "Basis"]],
    body: animals.map((a) => [
      a.tag_number || "—",
      a.name || "—",
      money(a.value_amount),
      dateStr(a.effective_from),
      a.basis || "—",
    ]),
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY);
  doc.text(`Grand Total: ${money(total)}`, 14, (doc.lastAutoTable?.finalY || y) + 10);

  finalize(doc, "total-herd-value.pdf");
}

// Report 3: Herd overview ---------------------------------------------------

export function generateHerdOverviewPdf({ data, generatedBy = "" }) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  drawHeader(
    doc,
    `Generated ${new Date().toLocaleString()}${generatedBy ? ` • by ${generatedBy}` : ""}`,
    "Herd Overview"
  );

  const totalAnimals = Number(data?.totalAnimals ?? 0);
  const totalValue = Number(data?.totalHerdValue ?? 0);
  const valued = Number(data?.valuedAnimals ?? 0);
  const weighted = Number(data?.weightedAnimals ?? 0);
  const avg = data?.avgLatestWeight != null ? Number(data.avgLatestWeight) : null;
  const animals = data?.animals || [];

  const cardW = (pageW - 14 * 2 - 10 * 3) / 4;
  drawStatCard(doc, 14, 56, cardW, 32, "Total Value", money(totalValue));
  drawStatCard(doc, 14 + (cardW + 10), 56, cardW, 32, "Valued", `${valued}/${totalAnimals}`);
  drawStatCard(doc, 14 + 2 * (cardW + 10), 56, cardW, 32, "Weighted", `${weighted}/${totalAnimals}`);
  drawStatCard(doc, 14 + 3 * (cardW + 10), 56, cardW, 32, "Avg Weight", avg != null ? `${num(avg, 1)} kg` : "—");

  themedTable(doc, {
    startY: 100,
    head: [["Tag", "Name", "Latest Weight", "Weight Date", "Latest Value", "Value Date"]],
    body: animals.map((a) => [
      a.tag_number || "—",
      a.name || "—",
      a.latest_weight != null ? `${num(a.latest_weight, 1)} kg` : "—",
      dateStr(a.latest_weight_date),
      a.latest_value != null ? money(a.latest_value) : "—",
      dateStr(a.latest_value_date),
    ]),
  });

  finalize(doc, "herd-overview.pdf");
}

