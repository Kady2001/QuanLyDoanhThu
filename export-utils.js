function exportCategoryName(cat) {
  return window.CATEGORIES.find((category) => category.id === cat)?.name || cat || "";
}
function exportSafeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}
function exportSafeIsoDate(value) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : "";
}
function exportDateCell(value) {
  const iso = exportSafeIsoDate(value);
  if (!iso) return "";
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function exportDaysInStock(arrived, today) {
  const start = exportDateCell(arrived);
  const end = exportDateCell(today);
  if (!(start instanceof Date) || !(end instanceof Date)) return "";
  return Math.max(0, Math.floor((end - start) / 864e5));
}
function normalizeUnitsForExport(units, today) {
  return window.ensureTransactionCodes(units).map((unit) => {
    const buy = exportSafeNumber(unit.buy);
    const expectedSell = exportSafeNumber(unit.expectedSell, buy);
    const status = unit.status === "sold" ? "sold" : "in_stock";
    const arrived = exportSafeIsoDate(unit.arrived);
    const sell = status === "sold" ? exportSafeNumber(unit.sell, expectedSell || buy) : null;
    const sold = status === "sold" ? exportSafeIsoDate(unit.sold || unit.arrived) : "";
    const profit = status === "sold" ? sell - buy : expectedSell - buy;
    return {
      ...unit,
      status,
      buy,
      expectedSell,
      sell,
      arrived,
      sold,
      profit,
      ratio: buy > 0 ? (status === "sold" ? sell : expectedSell) / buy : null,
      categoryName: exportCategoryName(unit.cat),
      daysInStock: status === "in_stock" ? exportDaysInStock(arrived, today) : ""
    };
  });
}
function exportTimestamp(date = /* @__PURE__ */ new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}-${String(date.getMinutes()).padStart(2, "0")}-${String(date.getSeconds()).padStart(2, "0")}`;
}
function applyCellStyle(sheet, ref, style) {
  if (sheet[ref]) sheet[ref].s = style;
}
function applyRangeStyle(sheet, startRow, endRow, startCol, endCol, style) {
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      if (sheet[ref]) sheet[ref].s = style;
    }
  }
}
function applyNumberFormat(sheet, rows, columns, format = "#,##0") {
  rows.forEach((row) => {
    columns.forEach((col) => {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      if (sheet[ref]) sheet[ref].z = format;
    });
  });
}
function styleWorkbookSheet(sheet, options) {
  const {
    title,
    subtitle,
    headerRow,
    footerRow,
    lastCol,
    tableRows,
    moneyCols,
    percentCols = [],
    dateCols = [],
    widths
  } = options;
  const titleStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
    fill: { fgColor: { rgb: "111827" } },
    alignment: { horizontal: "left", vertical: "center" }
  };
  const subtitleStyle = {
    font: { italic: true, color: { rgb: "475569" } },
    fill: { fgColor: { rgb: "F8FAFC" } }
  };
  const metricLabelStyle = {
    font: { bold: true, color: { rgb: "64748B" } },
    fill: { fgColor: { rgb: "F8FAFC" } }
  };
  const metricValueStyle = {
    font: { bold: true, color: { rgb: "111827" } },
    fill: { fgColor: { rgb: "F8FAFC" } },
    alignment: { horizontal: "right" }
  };
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "E11D48" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true }
  };
  const bodyStyle = {
    alignment: { vertical: "top", wrapText: true }
  };
  const stripeStyle = {
    fill: { fgColor: { rgb: "F8FAFC" } },
    alignment: { vertical: "top", wrapText: true }
  };
  const footerStyle = {
    font: { bold: true, color: { rgb: "111827" } },
    fill: { fgColor: { rgb: "E2E8F0" } }
  };
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } }
  ];
  sheet["!cols"] = widths.map((wch) => ({ wch }));
  sheet["!rows"] = [
    { hpt: 26 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 8 },
    { hpt: 24 }
  ];
  sheet["!freeze"] = { xSplit: 0, ySplit: headerRow + 1 };
  sheet["!autofilter"] = {
    ref: `${XLSX.utils.encode_col(0)}${headerRow + 1}:${XLSX.utils.encode_col(lastCol)}${Math.max(headerRow + 1, footerRow - 1)}`
  };
  applyRangeStyle(sheet, 0, 0, 0, lastCol, titleStyle);
  applyRangeStyle(sheet, 1, 1, 0, lastCol, subtitleStyle);
  applyRangeStyle(sheet, 2, 3, 0, lastCol, metricLabelStyle);
  [1, 3, 5, 7].forEach((col) => {
    if (col <= lastCol) {
      applyCellStyle(sheet, XLSX.utils.encode_cell({ r: 2, c: col }), metricValueStyle);
      applyCellStyle(sheet, XLSX.utils.encode_cell({ r: 3, c: col }), metricValueStyle);
    }
  });
  applyRangeStyle(sheet, headerRow, headerRow, 0, lastCol, headerStyle);
  applyRangeStyle(sheet, headerRow + 1, Math.max(headerRow + 1, footerRow - 1), 0, lastCol, bodyStyle);
  tableRows.forEach((row, index) => {
    if (index % 2 === 1) applyRangeStyle(sheet, row, row, 0, lastCol, stripeStyle);
  });
  applyRangeStyle(sheet, footerRow, footerRow, 0, lastCol, footerStyle);
  applyNumberFormat(sheet, [2, 3, footerRow, ...tableRows], moneyCols, "#,##0");
  applyNumberFormat(sheet, tableRows, percentCols, "0.0%");
  applyNumberFormat(sheet, tableRows, dateCols, "dd/mm/yyyy");
  applyCellStyle(sheet, "A1", titleStyle);
  applyCellStyle(sheet, "A2", subtitleStyle);
  sheet.A1.v = title;
  sheet.A2.v = subtitle;
}
function buildInventoryExportSheet(inStock, today) {
  const rows = inStock.slice().sort((a, b) => new Date(b.arrived) - new Date(a.arrived));
  const totalBuy = rows.reduce((sum, unit) => sum + unit.buy, 0);
  const totalExpectedSell = rows.reduce((sum, unit) => sum + unit.expectedSell, 0);
  const totalExpectedProfit = rows.reduce((sum, unit) => sum + unit.profit, 0);
  const aoa = [
    ["KHO H\xC0NG"],
    [`Xu\u1EA5t l\xFAc ${(/* @__PURE__ */ new Date()).toLocaleString("vi-VN")} \xB7 \u0110\u01A1n v\u1ECB ti\u1EC1n: ngh\xECn VND`],
    ["S\u1ED1 m\xF3n", rows.length, "V\u1ED1n t\u1ED3n", totalBuy, "Gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn", totalExpectedSell, "L\u1EE3i nhu\u1EADn d\u1EF1 ki\u1EBFn", totalExpectedProfit],
    ["Ng\xE0y d\u1EEF li\u1EC7u", exportDateCell(today), "", "", "", "", "", ""],
    [],
    ["M\xE3 giao d\u1ECBch", "D\xF2ng s\u1EA3n ph\u1EA9m", "Ph\xE2n lo\u1EA1i", "Danh m\u1EE5c", "Gi\xE1 mua (ngh\xECn VND)", "Gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn (ngh\xECn VND)", "L\u1EE3i nhu\u1EADn d\u1EF1 ki\u1EBFn (ngh\xECn VND)", "Ng\xE0y nh\u1EADp", "S\u1ED1 ng\xE0y t\u1ED3n", "Ghi ch\xFA"],
    ...rows.map((unit) => [
      unit.transactionCode,
      unit.name || "",
      unit.variant || "",
      unit.categoryName,
      unit.buy,
      unit.expectedSell,
      unit.profit,
      exportDateCell(unit.arrived),
      unit.daysInStock,
      unit.note || ""
    ]),
    ["T\u1ED4NG", "", "", "", totalBuy, totalExpectedSell, totalExpectedProfit, "", "", ""]
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const headerRow = 5;
  const footerRow = aoa.length - 1;
  const tableRows = rows.map((_, index) => headerRow + 1 + index);
  styleWorkbookSheet(sheet, {
    title: "KHO H\xC0NG",
    subtitle: `Xu\u1EA5t l\xFAc ${(/* @__PURE__ */ new Date()).toLocaleString("vi-VN")} \xB7 \u0110\u01A1n v\u1ECB ti\u1EC1n: ngh\xECn VND`,
    headerRow,
    footerRow,
    lastCol: 9,
    tableRows,
    moneyCols: [4, 5, 6],
    dateCols: [7],
    widths: [20, 28, 30, 16, 18, 24, 26, 14, 14, 42]
  });
  return sheet;
}
function buildSoldExportSheet(soldRows, today) {
  const rows = soldRows.slice().sort((a, b) => new Date(b.sold) - new Date(a.sold));
  const totalBuy = rows.reduce((sum, unit) => sum + unit.buy, 0);
  const totalSell = rows.reduce((sum, unit) => sum + unit.sell, 0);
  const totalProfit = rows.reduce((sum, unit) => sum + unit.profit, 0);
  const avgRatio = totalBuy > 0 ? totalSell / totalBuy : 0;
  const aoa = [
    ["\u0110\u01A0N \u0110\xC3 B\xC1N"],
    [`Xu\u1EA5t l\xFAc ${(/* @__PURE__ */ new Date()).toLocaleString("vi-VN")} \xB7 \u0110\u01A1n v\u1ECB ti\u1EC1n: ngh\xECn VND`],
    ["S\u1ED1 \u0111\u01A1n", rows.length, "T\u1ED5ng v\u1ED1n", totalBuy, "Doanh thu", totalSell, "L\u1EE3i nhu\u1EADn", totalProfit],
    ["T\u1EC9 l\u1EC7 b\xE1n/mua", avgRatio, "Ng\xE0y d\u1EEF li\u1EC7u", exportDateCell(today), "", "", "", ""],
    [],
    ["M\xE3 giao d\u1ECBch", "D\xF2ng s\u1EA3n ph\u1EA9m", "Ph\xE2n lo\u1EA1i", "Danh m\u1EE5c", "Gi\xE1 mua (ngh\xECn VND)", "Gi\xE1 b\xE1n (ngh\xECn VND)", "L\u1EE3i nhu\u1EADn (ngh\xECn VND)", "T\u1EC9 l\u1EC7 b\xE1n/mua", "Ng\xE0y nh\u1EADp", "Ng\xE0y b\xE1n", "Ghi ch\xFA"],
    ...rows.map((unit) => [
      unit.transactionCode,
      unit.name || "",
      unit.variant || "",
      unit.categoryName,
      unit.buy,
      unit.sell,
      unit.profit,
      unit.ratio || 0,
      exportDateCell(unit.arrived),
      exportDateCell(unit.sold),
      unit.note || ""
    ]),
    ["T\u1ED4NG", "", "", "", totalBuy, totalSell, totalProfit, avgRatio, "", "", ""]
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const headerRow = 5;
  const footerRow = aoa.length - 1;
  const tableRows = rows.map((_, index) => headerRow + 1 + index);
  styleWorkbookSheet(sheet, {
    title: "\u0110\u01A0N \u0110\xC3 B\xC1N",
    subtitle: `Xu\u1EA5t l\xFAc ${(/* @__PURE__ */ new Date()).toLocaleString("vi-VN")} \xB7 \u0110\u01A1n v\u1ECB ti\u1EC1n: ngh\xECn VND`,
    headerRow,
    footerRow,
    lastCol: 10,
    tableRows,
    moneyCols: [4, 5, 6],
    percentCols: [7],
    dateCols: [8, 9],
    widths: [20, 28, 30, 16, 18, 18, 20, 16, 14, 14, 42]
  });
  applyNumberFormat(sheet, [3, footerRow], [1, 7], "0.0%");
  return sheet;
}
function buildSalesWorkbook(units, today) {
  const normalized = normalizeUnitsForExport(units, today);
  const inStock = normalized.filter((unit) => unit.status === "in_stock");
  const sold = normalized.filter((unit) => unit.status === "sold");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildInventoryExportSheet(inStock, today), "Kho_hang");
  XLSX.utils.book_append_sheet(workbook, buildSoldExportSheet(sold, today), "Don_da_ban");
  return { workbook, inStock, sold };
}
function exportSalesWorkbook(units, today) {
  if (!window.XLSX) {
    alert("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c b\u1ED9 t\u1EA1o file Excel. Vui l\xF2ng t\u1EA3i l\u1EA1i trang r\u1ED3i th\u1EED l\u1EA1i.");
    return;
  }
  const { workbook } = buildSalesWorkbook(units, today);
  XLSX.writeFile(workbook, `nexus_gear_xuat_du_lieu_${exportTimestamp()}.xlsx`, {
    cellStyles: true
  });
}
function ExportDataButton({ units, today }) {
  return /* @__PURE__ */ React.createElement("button", { className: "ctl", onClick: () => exportSalesWorkbook(units, today) }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, lineHeight: 1 } }, "\u21E9"), " XU\u1EA4T EXCEL");
}
Object.assign(window, {
  ExportDataButton,
  buildSalesWorkbook,
  exportSalesWorkbook,
  normalizeUnitsForExport
});
