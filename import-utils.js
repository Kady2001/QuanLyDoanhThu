(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  const { useState: useStateImp } = React;
  const IMPORT_SCHEMA = [
    { key: "name", label: "ten_san_pham", required: true, note: "T\xEAn s\u1EA3n ph\u1EA9m" },
    { key: "cat", label: "danh_muc", required: true, note: "keyboard, keycap, phone, mouse, cable, monitor, accessory" },
    { key: "variant", label: "variant", required: false, note: "Phi\xEAn b\u1EA3n / m\xE0u s\u1EAFc" },
    { key: "buy", label: "gia_mua", required: true, note: "\u0110\u01A1n v\u1ECB ngh\xECn \u0111\u1ED3ng" },
    { key: "expectedSell", label: "gia_ban_du_kien", required: false, note: "Thi\u1EBFu s\u1EBD l\u1EA5y b\u1EB1ng gi\xE1 mua" },
    { key: "status", label: "trang_thai", required: false, note: "in_stock ho\u1EB7c sold; thi\u1EBFu s\u1EBD suy lu\u1EADn" },
    { key: "arrived", label: "ngay_nhap", required: false, note: "YYYY-MM-DD ho\u1EB7c DD/MM/YYYY; thi\u1EBFu = ng\xE0y upload" },
    { key: "sell", label: "gia_ban_thuc_te", required: false, note: "Ch\u1EC9 d\xF9ng cho h\xE0ng \u0111\xE3 b\xE1n" },
    { key: "sold", label: "ngay_ban", required: false, note: "Thi\u1EBFu \u1EDF d\xF2ng sold = ng\xE0y upload" },
    { key: "quantity", label: "so_luong", required: false, note: "Thi\u1EBFu = 1; m\u1ED7i d\xF2ng s\u1EBD bung th\xE0nh t\u1EEBng m\xF3n" },
    { key: "note", label: "ghi_chu", required: false, note: "Tu\u1EF3 ch\u1ECDn" }
  ];
  const HEADER_ALIASES = {
    name: ["ten_san_pham", "ten san pham", "tensanpham", "name", "product", "san_pham", "san pham"],
    cat: ["danh_muc", "danh muc", "danhmuc", "cat", "category", "loai"],
    variant: ["variant", "phien_ban", "phien ban", "mau", "color"],
    buy: ["gia_mua", "gia mua", "giamua", "buy", "cost", "gia_von", "gia von"],
    expectedSell: ["gia_ban_du_kien", "gia ban du kien", "giabandukkien", "expected_sell", "expected sell", "gia_ban_dk", "gia ban dk"],
    status: ["trang_thai", "trang thai", "trangthai", "status"],
    arrived: ["ngay_nhap", "ngay nhap", "ngaynhap", "arrived", "arrival_date", "ngay_ve", "ngay ve"],
    sell: ["gia_ban_thuc_te", "gia ban thuc te", "giabanthucte", "sell", "sale_price", "gia_ban", "gia ban"],
    sold: ["ngay_ban", "ngay ban", "ngayban", "sold", "sold_date"],
    quantity: ["so_luong", "so luong", "soluong", "quantity", "qty", "sl"],
    note: ["ghi_chu", "ghi chu", "ghichu", "note", "notes"]
  };
  const STATUS_ALIASES = {
    in_stock: ["in_stock", "in stock", "ton_kho", "ton kho", "con_hang", "con hang", "available", "stock"],
    sold: ["sold", "da_ban", "da ban", "ban_roi", "ban roi", "completed"]
  };
  function categoryAliasMap() {
    const map = {};
    window.CATEGORIES.forEach((c) => {
      map[normalizeText(c.id)] = c.id;
      map[normalizeText(c.name)] = c.id;
    });
    return map;
  }
  function normalizeText(value) {
    return String(value != null ? value : "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, "").replace(/\s+/g, " ");
  }
  function normalizeHeader(value) {
    return normalizeText(value).replace(/[\s-]+/g, "_");
  }
  function canonicalFieldFromHeader(header) {
    const normalized = normalizeHeader(header);
    return Object.keys(HEADER_ALIASES).find(
      (key) => HEADER_ALIASES[key].some((alias) => normalizeHeader(alias) === normalized)
    );
  }
  function getTodayIso(today) {
    return today || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  }
  function formatIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function parseDateValue(value, fallback, warnings, label) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return formatIsoDate(value);
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + value * 864e5);
      if (!Number.isNaN(date.getTime())) return formatIsoDate(date);
    }
    const raw = String(value != null ? value : "").trim();
    if (!raw) {
      warnings.push(`${label} tr\u1ED1ng \u2192 d\xF9ng ${fallback}`);
      return fallback;
    }
    const dmy = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (dmy) {
      const [, d, m, y] = dmy;
      const parsed2 = new Date(+y, +m - 1, +d);
      if (!Number.isNaN(parsed2.getTime())) return formatIsoDate(parsed2);
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return formatIsoDate(parsed);
    warnings.push(`${label} kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c "${raw}" \u2192 d\xF9ng ${fallback}`);
    return fallback;
  }
  function parseMoneyValue(value, warnings, label) {
    if (value === null || value === void 0 || String(value).trim() === "") return null;
    let raw = String(value).trim().toLowerCase();
    raw = raw.replace(/vnd|vnđ|đ|k/g, "").replace(/\s+/g, "");
    raw = raw.replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".");
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    if (parsed >= 1e5) {
      const normalized = Math.round(parsed / 1e3);
      warnings.push(`${label} c\xF3 v\u1EBB nh\u1EADp theo \u0111\u1ED3ng \u2192 chu\u1EA9n ho\xE1 th\xE0nh ${normalized} (ngh\xECn \u0111\u1ED3ng)`);
      return normalized;
    }
    return Math.round(parsed);
  }
  function parseQuantityValue(value, warnings) {
    if (value === null || value === void 0 || String(value).trim() === "") return 1;
    const parsed = Math.floor(Number(String(value).replace(",", ".")));
    if (!Number.isFinite(parsed) || parsed < 1) {
      warnings.push("s\u1ED1 l\u01B0\u1EE3ng kh\xF4ng h\u1EE3p l\u1EC7 \u2192 d\xF9ng 1");
      return 1;
    }
    return parsed;
  }
  function normalizeCategory(value) {
    return categoryAliasMap()[normalizeText(value)] || null;
  }
  function normalizeStatus(value, row) {
    const raw = normalizeText(value);
    if (!raw) return row.sold || row.sell ? "sold" : "in_stock";
    return Object.keys(STATUS_ALIASES).find(
      (key) => STATUS_ALIASES[key].some((alias) => normalizeText(alias) === raw)
    ) || null;
  }
  function workbookRowsToObjects(workbook) {
    const preferredSheet = workbook.Sheets.Du_lieu ? "Du_lieu" : workbook.SheetNames[0];
    const sheet = workbook.Sheets[preferredSheet];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
    return rawRows.map((raw) => {
      const canonical = {};
      Object.keys(raw).forEach((header) => {
        const field = canonicalFieldFromHeader(header);
        if (field) canonical[field] = raw[header];
      });
      return canonical;
    });
  }
  function normalizeImportedRows(rawRows, today) {
    const fallbackDate = getTodayIso(today);
    const validRows = [];
    const warnings = [];
    const errors = [];
    rawRows.forEach((raw, index) => {
      var _a, _b, _c;
      const rowNumber = index + 2;
      const rowWarnings = [];
      const hasAnyValue = Object.values(raw).some((v) => String(v != null ? v : "").trim() !== "");
      if (!hasAnyValue) return;
      const name = String((_a = raw.name) != null ? _a : "").trim();
      const cat = normalizeCategory(raw.cat);
      const buy = parseMoneyValue(raw.buy, rowWarnings, "gi\xE1 mua");
      const status = normalizeStatus(raw.status, raw);
      const quantity = parseQuantityValue(raw.quantity, rowWarnings);
      if (!name) errors.push(`D\xF2ng ${rowNumber}: thi\u1EBFu ten_san_pham`);
      if (!cat) errors.push(`D\xF2ng ${rowNumber}: danh_muc kh\xF4ng h\u1EE3p l\u1EC7`);
      if (buy === null) errors.push(`D\xF2ng ${rowNumber}: thi\u1EBFu ho\u1EB7c sai gia_mua`);
      if (!status) errors.push(`D\xF2ng ${rowNumber}: trang_thai kh\xF4ng h\u1EE3p l\u1EC7`);
      if (!name || !cat || buy === null || !status) return;
      const arrived = parseDateValue(raw.arrived, fallbackDate, rowWarnings, "ng\xE0y nh\u1EADp");
      let expectedSell = parseMoneyValue(raw.expectedSell, rowWarnings, "gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn");
      if (expectedSell === null) {
        expectedSell = buy;
        rowWarnings.push("thi\u1EBFu gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn \u2192 d\xF9ng b\u1EB1ng gi\xE1 mua");
      }
      let sold;
      let sell;
      if (status === "sold") {
        sold = parseDateValue(raw.sold, fallbackDate, rowWarnings, "ng\xE0y b\xE1n");
        sell = parseMoneyValue(raw.sell, rowWarnings, "gi\xE1 b\xE1n th\u1EF1c t\u1EBF");
        if (sell === null) {
          sell = expectedSell || buy;
          rowWarnings.push("thi\u1EBFu gi\xE1 b\xE1n th\u1EF1c t\u1EBF \u2192 d\xF9ng gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn");
        }
        if (new Date(sold) < new Date(arrived)) {
          sold = arrived;
          rowWarnings.push("ng\xE0y b\xE1n s\u1EDBm h\u01A1n ng\xE0y nh\u1EADp \u2192 chu\u1EA9n ho\xE1 b\u1EB1ng ng\xE0y nh\u1EADp");
        }
      }
      for (let i = 0; i < quantity; i++) {
        validRows.push(__spreadValues({
          name,
          cat,
          variant: String((_b = raw.variant) != null ? _b : "").trim(),
          buy,
          expectedSell,
          arrived,
          note: String((_c = raw.note) != null ? _c : "").trim(),
          status
        }, status === "sold" ? { sell, sold } : {}));
      }
      rowWarnings.forEach((w) => warnings.push(`D\xF2ng ${rowNumber}: ${w}`));
    });
    return {
      units: validRows,
      warnings,
      errors,
      sourceRows: rawRows.length
    };
  }
  function downloadImportTemplate(today) {
    if (!window.XLSX) {
      alert("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c b\u1ED9 t\u1EA1o file Excel. Vui l\xF2ng th\u1EED t\u1EA3i l\u1EA1i trang.");
      return;
    }
    const headers = IMPORT_SCHEMA.map((col) => col.label);
    const rows = [
      ["F75", "keyboard", "\u0110\u1ECF FR4", 580, 720, "in_stock", getTodayIso(today), "", "", 1, "V\xED d\u1EE5 h\xE0ng c\xF2n trong kho"],
      ["Mini60he Pro", "keyboard", "\u0110en", 370, 430, "sold", "2026-05-10", 430, "2026-05-15", 1, "V\xED d\u1EE5 h\xE0ng \u0111\xE3 b\xE1n"],
      ["C\xE1p USB-C Baseus 100W", "cable", "1m", 95, "", "", "", "", "", 2, "V\xED d\u1EE5 c\u1ED1 \xFD \u0111\u1EC3 tr\u1ED1ng v\xE0i \xF4 \u0111\u1EC3 h\u1EC7 th\u1ED1ng t\u1EF1 chu\u1EA9n ho\xE1"]
    ];
    const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const guideSheet = XLSX.utils.aoa_to_sheet([
      ["H\u01AF\u1EDANG D\u1EAAN NH\u1EACP FILE NEXUS GEAR"],
      ["File n\xE0y d\xF9ng chung cho c\u1EA3 Kho h\xE0ng v\xE0 T\u1ED5ng quan. D\xF2ng in_stock s\u1EBD v\xE0o Kho h\xE0ng; d\xF2ng sold s\u1EBD v\xE0o T\u1ED5ng quan."],
      [],
      ["C\u1ED9t", "B\u1EAFt bu\u1ED9c", "\u0110\u1ECBnh d\u1EA1ng / gi\xE1 tr\u1ECB h\u1EE3p l\u1EC7", "N\u1EBFu \u0111\u1EC3 tr\u1ED1ng th\xEC h\u1EC7 th\u1ED1ng l\xE0m g\xEC?", "V\xED d\u1EE5"],
      ["ten_san_pham", "C\xF3", "Text", "Kh\xF4ng cho nh\u1EADp; d\xF2ng b\u1ECB b\xE1o l\u1ED7i", "F75"],
      ["danh_muc", "C\xF3", "keyboard, keycap, phone, mouse, cable, monitor, accessory ho\u1EB7c t\xEAn ti\u1EBFng Vi\u1EC7t t\u01B0\u01A1ng \u1EE9ng", "Kh\xF4ng cho nh\u1EADp; d\xF2ng b\u1ECB b\xE1o l\u1ED7i", "keyboard"],
      ["variant", "Kh\xF4ng", "Text", "\u0110\u1EC3 tr\u1ED1ng", "\u0110\u1ECF FR4"],
      ["gia_mua", "C\xF3", "S\u1ED1, \u0111\u01A1n v\u1ECB ngh\xECn \u0111\u1ED3ng", "Kh\xF4ng cho nh\u1EADp; d\xF2ng b\u1ECB b\xE1o l\u1ED7i", "580"],
      ["gia_ban_du_kien", "Kh\xF4ng", "S\u1ED1, \u0111\u01A1n v\u1ECB ngh\xECn \u0111\u1ED3ng", "M\u1EB7c \u0111\u1ECBnh = gia_mua", "720"],
      ["trang_thai", "Kh\xF4ng", "in_stock ho\u1EB7c sold", "N\u1EBFu c\xF3 ngay_ban / gia_ban_thuc_te \u2192 sold; n\u1EBFu kh\xF4ng \u2192 in_stock", "in_stock"],
      ["ngay_nhap", "Kh\xF4ng", "YYYY-MM-DD ho\u1EB7c DD/MM/YYYY", `M\u1EB7c \u0111\u1ECBnh = ng\xE0y upload file (${getTodayIso(today)})`, getTodayIso(today)],
      ["gia_ban_thuc_te", "Kh\xF4ng", "S\u1ED1, \u0111\u01A1n v\u1ECB ngh\xECn \u0111\u1ED3ng; ch\u1EC9 d\xF9ng khi sold", "N\u1EBFu l\xE0 sold v\xE0 \u0111\u1EC3 tr\u1ED1ng \u2192 m\u1EB7c \u0111\u1ECBnh = gia_ban_du_kien; n\u1EBFu \xF4 \u0111\xF3 c\u0169ng tr\u1ED1ng \u2192 = gia_mua", "430"],
      ["ngay_ban", "Kh\xF4ng", "YYYY-MM-DD ho\u1EB7c DD/MM/YYYY; d\xF9ng khi sold", `N\u1EBFu l\xE0 sold v\xE0 \u0111\u1EC3 tr\u1ED1ng \u2192 m\u1EB7c \u0111\u1ECBnh = ng\xE0y upload file (${getTodayIso(today)})`, "2026-05-15"],
      ["so_luong", "Kh\xF4ng", "S\u1ED1 nguy\xEAn >= 1", "M\u1EB7c \u0111\u1ECBnh = 1; n\u1EBFu nh\u1EADp >1 h\u1EC7 th\u1ED1ng t\u1EF1 t\xE1ch th\xE0nh nhi\u1EC1u m\xF3n, m\u1ED7i m\xF3n m\u1ED9t m\xE3 giao d\u1ECBch ri\xEAng", "2"],
      ["ghi_chu", "Kh\xF4ng", "Text, kh\xF4ng gi\u1EDBi h\u1EA1n k\xFD t\u1EF1", "\u0110\u1EC3 tr\u1ED1ng", "KH H\xE0 N\u1ED9i c\u1ECDc 200K"],
      [],
      ["QUY CHU\u1EA8N T\u1EF0 L\xC0M S\u1EA0CH D\u1EEE LI\u1EC6U"],
      ["1. Gi\xE1 chu\u1EA9n trong h\u1EC7 th\u1ED1ng l\xE0 ngh\xECn \u0111\u1ED3ng. N\u1EBFu nh\u1EADp 580000, h\u1EC7 th\u1ED1ng nh\u1EADn di\u1EC7n v\xE0 t\u1EF1 \u0111\u1ED5i th\xE0nh 580."],
      ["2. C\xF3 th\u1EC3 nh\u1EADp ng\xE0y d\u1EA1ng YYYY-MM-DD ho\u1EB7c DD/MM/YYYY. N\u1EBFu kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c ng\xE0y, h\u1EC7 th\u1ED1ng d\xF9ng ng\xE0y upload file v\xE0 b\xE1o l\u1EA1i trong ph\u1EA7n chu\u1EA9n ho\xE1."],
      ["3. N\u1EBFu ngay_ban s\u1EDBm h\u01A1n ngay_nhap, h\u1EC7 th\u1ED1ng t\u1EF1 s\u1EEDa ngay_ban = ngay_nhap."],
      ["4. N\u1EBFu so_luong > 1, h\u1EC7 th\u1ED1ng t\u1EA1o nhi\u1EC1u d\xF2ng h\xE0ng gi\u1ED1ng th\xF4ng tin nh\u01B0ng m\u1ED7i d\xF2ng c\xF3 m\xE3 giao d\u1ECBch duy nh\u1EA5t."],
      ["5. M\xE3 giao d\u1ECBch kh\xF4ng c\u1EA7n nh\u1EADp trong file; h\u1EC7 th\u1ED1ng t\u1EF1 sinh khi nh\u1EADn d\u1EEF li\u1EC7u."],
      ['6. C\xF3 th\u1EC3 d\xF9ng t\xEAn danh m\u1EE5c ti\u1EBFng Vi\u1EC7t nh\u01B0 "B\xE0n ph\xEDm", "Chu\u1ED9t", "S\u1EA1c & C\xE1p", "M\xE0n h\xECnh"; h\u1EC7 th\u1ED1ng s\u1EBD chu\u1EA9n ho\xE1 v\u1EC1 m\xE3 chu\u1EA9n.'],
      [],
      ["V\xCD D\u1EE4 D\xD2NG TH\u1EE8 3 \u1EDE SHEET Du_lieu"],
      ["gia_ban_du_kien tr\u1ED1ng \u2192 d\xF9ng b\u1EB1ng gia_mua (95)."],
      ["trang_thai tr\u1ED1ng, kh\xF4ng c\xF3 ng\xE0y b\xE1n / gi\xE1 b\xE1n th\u1EF1c t\u1EBF \u2192 hi\u1EC3u l\xE0 in_stock."],
      [`ngay_nhap tr\u1ED1ng \u2192 d\xF9ng ng\xE0y upload file (${getTodayIso(today)}).`],
      ["so_luong = 2 \u2192 t\u1EA1o 2 m\xF3n ri\xEAng v\u1EDBi 2 m\xE3 giao d\u1ECBch kh\xE1c nhau."]
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataSheet, "Du_lieu");
    XLSX.utils.book_append_sheet(workbook, guideSheet, "Huong_dan");
    dataSheet["!cols"] = [
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 12 },
      { wch: 44 }
    ];
    guideSheet["!cols"] = [
      { wch: 28 },
      { wch: 12 },
      { wch: 34 },
      { wch: 62 },
      { wch: 24 }
    ];
    guideSheet["!freeze"] = { xSplit: 0, ySplit: 4 };
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "E11D48" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true }
    };
    const sectionStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "111827" } }
    };
    const wrapStyle = { alignment: { vertical: "top", wrapText: true } };
    headers.forEach((_, i) => {
      const cell = dataSheet[XLSX.utils.encode_cell({ r: 0, c: i })];
      if (cell) cell.s = headerStyle;
    });
    for (let r = 0; r <= 11; r++) {
      for (let c = 0; c <= 4; c++) {
        const cell = guideSheet[XLSX.utils.encode_cell({ r, c })];
        if (cell) cell.s = wrapStyle;
      }
    }
    ["A1", "A4", "A16", "A24"].forEach((ref) => {
      if (guideSheet[ref]) guideSheet[ref].s = sectionStyle;
    });
    for (let c = 0; c <= 4; c++) {
      const cell = guideSheet[XLSX.utils.encode_cell({ r: 3, c })];
      if (cell) cell.s = headerStyle;
    }
    XLSX.writeFile(workbook, "mau_nhap_hang_nexus_gear.xlsx");
  }
  function ImportDataButton({ today, onImport, disabled = false }) {
    const [open, setOpen] = useStateImp(false);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "ctl", onClick: () => setOpen(true), disabled }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15, lineHeight: 1 } }, "\u21EA"), " NH\u1EACP FILE EXCEL"), open && /* @__PURE__ */ React.createElement(ImportDataModal, { today, onClose: () => setOpen(false), onImport }));
  }
  function ImportDataModal({ today, onClose, onImport }) {
    const [fileName, setFileName] = useStateImp("");
    const [result, setResult] = useStateImp(null);
    const [busy, setBusy] = useStateImp(false);
    const [fatalError, setFatalError] = useStateImp("");
    const [replaceExisting, setReplaceExisting] = useStateImp(false);
    const handleFile = async (file) => {
      if (!file) return;
      setBusy(true);
      setFatalError("");
      setFileName(file.name);
      try {
        if (!window.XLSX) throw new Error("Kh\xF4ng t\u1EA3i \u0111\u01B0\u1EE3c b\u1ED9 \u0111\u1ECDc Excel.");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const rawRows = workbookRowsToObjects(workbook);
        if (rawRows.length === 0 || rawRows.every((row) => Object.keys(row).length === 0)) {
          throw new Error("Kh\xF4ng t\xECm th\u1EA5y c\u1ED9t h\u1EE3p l\u1EC7. H\xE3y d\xF9ng file m\u1EABu ho\u1EB7c ki\u1EC3m tra l\u1EA1i h\xE0ng ti\xEAu \u0111\u1EC1.");
        }
        setResult(normalizeImportedRows(rawRows, today));
      } catch (error) {
        setResult(null);
        setFatalError(error.message || "Kh\xF4ng \u0111\u1ECDc \u0111\u01B0\u1EE3c file.");
      } finally {
        setBusy(false);
      }
    };
    const canImport = result && result.units.length > 0 && result.errors.length === 0;
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal import-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "NH\u1EACP D\u1EEE LI\u1EC6U T\u1EEA EXCEL"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body import-body" }, /* @__PURE__ */ React.createElement("div", { className: "import-top" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "import-title" }, "M\u1ED9t file, hai n\u01A1i t\u1EF1 c\u1EADp nh\u1EADt"), /* @__PURE__ */ React.createElement("div", { className: "import-sub" }, "D\xF2ng ", /* @__PURE__ */ React.createElement("strong", null, "in_stock"), " \u0111i v\xE0o Kho h\xE0ng; d\xF2ng ", /* @__PURE__ */ React.createElement("strong", null, "sold"), " \u0111i v\xE0o T\u1ED5ng quan. H\u1EC7 th\u1ED1ng s\u1EBD chu\u1EA9n ho\xE1 ng\xE0y, gi\xE1 v\xE0 tr\u1EA1ng th\xE1i tr\u01B0\u1EDBc khi l\u01B0u.")), /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: () => downloadImportTemplate(today) }, "\u2193 T\u1EA2I FILE M\u1EAAU .XLSX")), /* @__PURE__ */ React.createElement("label", { className: "import-dropzone" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "file",
        accept: ".xlsx,.xls,.csv",
        onChange: (e) => {
          var _a;
          return handleFile((_a = e.target.files) == null ? void 0 : _a[0]);
        }
      }
    ), /* @__PURE__ */ React.createElement("span", { className: "import-drop-main" }, busy ? "\u0110ang \u0111\u1ECDc file..." : "Ch\u1ECDn file Excel / CSV \u0111\u1EC3 nh\u1EADp"), /* @__PURE__ */ React.createElement("span", { className: "import-drop-sub" }, fileName || "H\u1ED7 tr\u1EE3 .xlsx, .xls, .csv")), /* @__PURE__ */ React.createElement("label", { className: `import-replace-option ${replaceExisting ? "active" : ""}` }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        checked: replaceExisting,
        onChange: (e) => setReplaceExisting(e.target.checked)
      }
    ), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, "X\xF3a to\xE0n b\u1ED9 d\u1EEF li\u1EC7u hi\u1EC7n t\u1EA1i tr\u01B0\u1EDBc khi nh\u1EADp"), /* @__PURE__ */ React.createElement("small", null, "M\u1EB7c \u0111\u1ECBnh kh\xF4ng ch\u1ECDn. N\u1EBFu b\u1EADt, file m\u1EDBi s\u1EBD thay th\u1EBF to\xE0n b\u1ED9 Kho h\xE0ng v\xE0 \u0110\u01A1n \u0111\xE3 b\xE1n \u0111ang c\xF3."))), replaceExisting && /* @__PURE__ */ React.createElement("div", { className: "import-alert warn" }, "Ch\u1EBF \u0111\u1ED9 thay th\u1EBF \u0111ang b\u1EADt: sau khi nh\u1EADp, ch\u1EC9 d\u1EEF li\u1EC7u trong file m\u1EDBi c\xF2n l\u1EA1i tr\xEAn h\u1EC7 th\u1ED1ng."), /* @__PURE__ */ React.createElement("div", { className: "import-format" }, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "Format y\xEAu c\u1EA7u"), /* @__PURE__ */ React.createElement("div", { className: "import-schema-grid" }, IMPORT_SCHEMA.map((col) => /* @__PURE__ */ React.createElement("div", { key: col.key, className: "import-schema-row" }, /* @__PURE__ */ React.createElement("span", { className: "mono" }, col.label), /* @__PURE__ */ React.createElement("span", { className: col.required ? "req" : "opt" }, col.required ? "b\u1EAFt bu\u1ED9c" : "tu\u1EF3 ch\u1ECDn"), /* @__PURE__ */ React.createElement("span", null, col.note))))), fatalError && /* @__PURE__ */ React.createElement("div", { className: "import-alert error" }, fatalError), result && /* @__PURE__ */ React.createElement("div", { className: "import-review" }, /* @__PURE__ */ React.createElement("div", { className: "import-stats" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, result.sourceRows), /* @__PURE__ */ React.createElement("span", null, "d\xF2ng ngu\u1ED3n")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, result.units.length), /* @__PURE__ */ React.createElement("span", null, "m\xF3n h\u1EE3p l\u1EC7")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, result.errors.length), /* @__PURE__ */ React.createElement("span", null, "l\u1ED7i ch\u1EB7n nh\u1EADp")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, result.warnings.length), /* @__PURE__ */ React.createElement("span", null, "chu\u1EA9n ho\xE1 t\u1EF1 \u0111\u1ED9ng"))), result.errors.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "import-alert error" }, result.errors.slice(0, 5).map((msg, i) => /* @__PURE__ */ React.createElement("div", { key: i }, msg))), result.warnings.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "import-alert warn" }, result.warnings.slice(0, 6).map((msg, i) => /* @__PURE__ */ React.createElement("div", { key: i }, msg)), result.warnings.length > 6 && /* @__PURE__ */ React.createElement("div", null, "... v\xE0 ", result.warnings.length - 6, " chu\u1EA9n ho\xE1 kh\xE1c")), result.units.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap import-preview" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "S\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("th", null, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("th", null, "Tr\u1EA1ng th\xE1i"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Gi\xE1 mua"), /* @__PURE__ */ React.createElement("th", null, "Ng\xE0y nh\u1EADp"), /* @__PURE__ */ React.createElement("th", null, "Ng\xE0y b\xE1n"))), /* @__PURE__ */ React.createElement("tbody", null, result.units.slice(0, 5).map((u, i) => /* @__PURE__ */ React.createElement("tr", { key: `${u.name}-${i}` }, /* @__PURE__ */ React.createElement("td", null, u.name, u.variant ? ` \xB7 ${u.variant}` : ""), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(CatPill, { cat: u.cat })), /* @__PURE__ */ React.createElement("td", null, u.status === "sold" ? "\u0110\xE3 b\xE1n" : "T\u1ED3n kho"), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, u.buy.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "mono" }, new Date(u.arrived).toLocaleDateString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "mono" }, u.sold ? new Date(u.sold).toLocaleDateString("vi-VN") : "\u2014")))))))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl primary",
        disabled: !canImport,
        onClick: () => {
          if (!canImport) return;
          onImport(result.units, { replaceExisting });
          onClose();
        },
        style: { opacity: canImport ? 1 : 0.5, cursor: canImport ? "pointer" : "not-allowed" }
      },
      "NH\u1EACP ",
      (result == null ? void 0 : result.units.length) || 0,
      " M\xD3N"
    ))));
  }
  Object.assign(window, {
    ImportDataButton,
    normalizeImportedRows,
    downloadImportTemplate
  });
})();
