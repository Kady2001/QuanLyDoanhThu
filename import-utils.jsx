// Shared Excel import flow for Inventory + Dashboard

const { useState: useStateImp } = React;

const IMPORT_SCHEMA = [
  { key: 'name', label: 'ten_san_pham', required: true, note: 'Tên sản phẩm' },
  { key: 'cat', label: 'danh_muc', required: true, note: 'keyboard, keycap, phone, mouse, cable, monitor, accessory' },
  { key: 'variant', label: 'variant', required: false, note: 'Phiên bản / màu sắc' },
  { key: 'buy', label: 'gia_mua', required: true, note: 'Đơn vị nghìn đồng' },
  { key: 'expectedSell', label: 'gia_ban_du_kien', required: false, note: 'Thiếu sẽ lấy bằng giá mua' },
  { key: 'status', label: 'trang_thai', required: false, note: 'in_stock hoặc sold; thiếu sẽ suy luận' },
  { key: 'arrived', label: 'ngay_nhap', required: false, note: 'YYYY-MM-DD hoặc DD/MM/YYYY; thiếu = ngày upload' },
  { key: 'sell', label: 'gia_ban_thuc_te', required: false, note: 'Chỉ dùng cho hàng đã bán' },
  { key: 'sold', label: 'ngay_ban', required: false, note: 'Thiếu ở dòng sold = ngày upload' },
  { key: 'quantity', label: 'so_luong', required: false, note: 'Thiếu = 1; mỗi dòng sẽ bung thành từng món' },
  { key: 'note', label: 'ghi_chu', required: false, note: 'Tuỳ chọn' },
];

const HEADER_ALIASES = {
  name: ['ten_san_pham', 'ten san pham', 'tensanpham', 'name', 'product', 'san_pham', 'san pham'],
  cat: ['danh_muc', 'danh muc', 'danhmuc', 'cat', 'category', 'loai'],
  variant: ['variant', 'phien_ban', 'phien ban', 'mau', 'color'],
  buy: ['gia_mua', 'gia mua', 'giamua', 'buy', 'cost', 'gia_von', 'gia von'],
  expectedSell: ['gia_ban_du_kien', 'gia ban du kien', 'giabandukkien', 'expected_sell', 'expected sell', 'gia_ban_dk', 'gia ban dk'],
  status: ['trang_thai', 'trang thai', 'trangthai', 'status'],
  arrived: ['ngay_nhap', 'ngay nhap', 'ngaynhap', 'arrived', 'arrival_date', 'ngay_ve', 'ngay ve'],
  sell: ['gia_ban_thuc_te', 'gia ban thuc te', 'giabanthucte', 'sell', 'sale_price', 'gia_ban', 'gia ban'],
  sold: ['ngay_ban', 'ngay ban', 'ngayban', 'sold', 'sold_date'],
  quantity: ['so_luong', 'so luong', 'soluong', 'quantity', 'qty', 'sl'],
  note: ['ghi_chu', 'ghi chu', 'ghichu', 'note', 'notes'],
};

const STATUS_ALIASES = {
  in_stock: ['in_stock', 'in stock', 'ton_kho', 'ton kho', 'con_hang', 'con hang', 'available', 'stock'],
  sold: ['sold', 'da_ban', 'da ban', 'ban_roi', 'ban roi', 'completed'],
};

function categoryAliasMap() {
  const map = {};
  window.CATEGORIES.forEach(c => {
    map[normalizeText(c.id)] = c.id;
    map[normalizeText(c.name)] = c.id;
  });
  return map;
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeHeader(value) {
  return normalizeText(value).replace(/[\s-]+/g, '_');
}

function canonicalFieldFromHeader(header) {
  const normalized = normalizeHeader(header);
  return Object.keys(HEADER_ALIASES).find(key =>
    HEADER_ALIASES[key].some(alias => normalizeHeader(alias) === normalized)
  );
}

function getTodayIso(today) {
  return today || new Date().toISOString().slice(0, 10);
}

function formatIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateValue(value, fallback, warnings, label) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatIsoDate(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (!Number.isNaN(date.getTime())) return formatIsoDate(date);
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    warnings.push(`${label} trống → dùng ${fallback}`);
    return fallback;
  }

  const dmy = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const parsed = new Date(+y, +m - 1, +d);
    if (!Number.isNaN(parsed.getTime())) return formatIsoDate(parsed);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return formatIsoDate(parsed);

  warnings.push(`${label} không đọc được "${raw}" → dùng ${fallback}`);
  return fallback;
}

function parseMoneyValue(value, warnings, label) {
  if (value === null || value === undefined || String(value).trim() === '') return null;

  let raw = String(value).trim().toLowerCase();
  raw = raw.replace(/vnd|vnđ|đ|k/g, '').replace(/\s+/g, '');
  raw = raw.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.');

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  if (parsed >= 100000) {
    const normalized = Math.round(parsed / 1000);
    warnings.push(`${label} có vẻ nhập theo đồng → chuẩn hoá thành ${normalized} (nghìn đồng)`);
    return normalized;
  }

  return Math.round(parsed);
}

function parseQuantityValue(value, warnings) {
  if (value === null || value === undefined || String(value).trim() === '') return 1;
  const parsed = Math.floor(Number(String(value).replace(',', '.')));
  if (!Number.isFinite(parsed) || parsed < 1) {
    warnings.push('số lượng không hợp lệ → dùng 1');
    return 1;
  }
  return parsed;
}

function normalizeCategory(value) {
  return categoryAliasMap()[normalizeText(value)] || null;
}

function normalizeStatus(value, row) {
  const raw = normalizeText(value);
  if (!raw) return row.sold || row.sell ? 'sold' : 'in_stock';
  return Object.keys(STATUS_ALIASES).find(key =>
    STATUS_ALIASES[key].some(alias => normalizeText(alias) === raw)
  ) || null;
}

function workbookRowsToObjects(workbook) {
  const preferredSheet = workbook.Sheets.Du_lieu ? 'Du_lieu' : workbook.SheetNames[0];
  const sheet = workbook.Sheets[preferredSheet];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });

  return rawRows.map(raw => {
    const canonical = {};
    Object.keys(raw).forEach(header => {
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
    const rowNumber = index + 2;
    const rowWarnings = [];
    const hasAnyValue = Object.values(raw).some(v => String(v ?? '').trim() !== '');
    if (!hasAnyValue) return;

    const name = String(raw.name ?? '').trim();
    const cat = normalizeCategory(raw.cat);
    const buy = parseMoneyValue(raw.buy, rowWarnings, 'giá mua');
    const status = normalizeStatus(raw.status, raw);
    const quantity = parseQuantityValue(raw.quantity, rowWarnings);

    if (!name) errors.push(`Dòng ${rowNumber}: thiếu ten_san_pham`);
    if (!cat) errors.push(`Dòng ${rowNumber}: danh_muc không hợp lệ`);
    if (buy === null) errors.push(`Dòng ${rowNumber}: thiếu hoặc sai gia_mua`);
    if (!status) errors.push(`Dòng ${rowNumber}: trang_thai không hợp lệ`);
    if (!name || !cat || buy === null || !status) return;

    const arrived = parseDateValue(raw.arrived, fallbackDate, rowWarnings, 'ngày nhập');
    let expectedSell = parseMoneyValue(raw.expectedSell, rowWarnings, 'giá bán dự kiến');
    if (expectedSell === null) {
      expectedSell = buy;
      rowWarnings.push('thiếu giá bán dự kiến → dùng bằng giá mua');
    }

    let sold;
    let sell;
    if (status === 'sold') {
      sold = parseDateValue(raw.sold, fallbackDate, rowWarnings, 'ngày bán');
      sell = parseMoneyValue(raw.sell, rowWarnings, 'giá bán thực tế');
      if (sell === null) {
        sell = expectedSell || buy;
        rowWarnings.push('thiếu giá bán thực tế → dùng giá bán dự kiến');
      }
      if (new Date(sold) < new Date(arrived)) {
        sold = arrived;
        rowWarnings.push('ngày bán sớm hơn ngày nhập → chuẩn hoá bằng ngày nhập');
      }
    }

    for (let i = 0; i < quantity; i++) {
      validRows.push({
        name,
        cat,
        variant: String(raw.variant ?? '').trim(),
        buy,
        expectedSell,
        arrived,
        note: String(raw.note ?? '').trim(),
        status,
        ...(status === 'sold' ? { sell, sold } : {}),
      });
    }

    rowWarnings.forEach(w => warnings.push(`Dòng ${rowNumber}: ${w}`));
  });

  return {
    units: validRows,
    warnings,
    errors,
    sourceRows: rawRows.length,
  };
}

function downloadImportTemplate(today) {
  if (!window.XLSX) {
    alert('Không tải được bộ tạo file Excel. Vui lòng thử tải lại trang.');
    return;
  }
  const headers = IMPORT_SCHEMA.map(col => col.label);
  const rows = [
    ['F75', 'keyboard', 'Đỏ FR4', 580, 720, 'in_stock', getTodayIso(today), '', '', 1, 'Ví dụ hàng còn trong kho'],
    ['Mini60he Pro', 'keyboard', 'Đen', 370, 430, 'sold', '2026-05-10', 430, '2026-05-15', 1, 'Ví dụ hàng đã bán'],
    ['Cáp USB-C Baseus 100W', 'cable', '1m', 95, '', '', '', '', '', 2, 'Ví dụ cố ý để trống vài ô để hệ thống tự chuẩn hoá'],
  ];
  const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const guideSheet = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN NHẬP FILE NEXUS GEAR'],
    ['File này dùng chung cho cả Kho hàng và Tổng quan. Dòng in_stock sẽ vào Kho hàng; dòng sold sẽ vào Tổng quan.'],
    [],
    ['Cột', 'Bắt buộc', 'Định dạng / giá trị hợp lệ', 'Nếu để trống thì hệ thống làm gì?', 'Ví dụ'],
    ['ten_san_pham', 'Có', 'Text', 'Không cho nhập; dòng bị báo lỗi', 'F75'],
    ['danh_muc', 'Có', 'keyboard, keycap, phone, mouse, cable, monitor, accessory hoặc tên tiếng Việt tương ứng', 'Không cho nhập; dòng bị báo lỗi', 'keyboard'],
    ['variant', 'Không', 'Text', 'Để trống', 'Đỏ FR4'],
    ['gia_mua', 'Có', 'Số, đơn vị nghìn đồng', 'Không cho nhập; dòng bị báo lỗi', '580'],
    ['gia_ban_du_kien', 'Không', 'Số, đơn vị nghìn đồng', 'Mặc định = gia_mua', '720'],
    ['trang_thai', 'Không', 'in_stock hoặc sold', 'Nếu có ngay_ban / gia_ban_thuc_te → sold; nếu không → in_stock', 'in_stock'],
    ['ngay_nhap', 'Không', 'YYYY-MM-DD hoặc DD/MM/YYYY', `Mặc định = ngày upload file (${getTodayIso(today)})`, getTodayIso(today)],
    ['gia_ban_thuc_te', 'Không', 'Số, đơn vị nghìn đồng; chỉ dùng khi sold', 'Nếu là sold và để trống → mặc định = gia_ban_du_kien; nếu ô đó cũng trống → = gia_mua', '430'],
    ['ngay_ban', 'Không', 'YYYY-MM-DD hoặc DD/MM/YYYY; dùng khi sold', `Nếu là sold và để trống → mặc định = ngày upload file (${getTodayIso(today)})`, '2026-05-15'],
    ['so_luong', 'Không', 'Số nguyên >= 1', 'Mặc định = 1; nếu nhập >1 hệ thống tự tách thành nhiều món, mỗi món một mã giao dịch riêng', '2'],
    ['ghi_chu', 'Không', 'Text, không giới hạn ký tự', 'Để trống', 'KH Hà Nội cọc 200K'],
    [],
    ['QUY CHUẨN TỰ LÀM SẠCH DỮ LIỆU'],
    ['1. Giá chuẩn trong hệ thống là nghìn đồng. Nếu nhập 580000, hệ thống nhận diện và tự đổi thành 580.'],
    ['2. Có thể nhập ngày dạng YYYY-MM-DD hoặc DD/MM/YYYY. Nếu không đọc được ngày, hệ thống dùng ngày upload file và báo lại trong phần chuẩn hoá.'],
    ['3. Nếu ngay_ban sớm hơn ngay_nhap, hệ thống tự sửa ngay_ban = ngay_nhap.'],
    ['4. Nếu so_luong > 1, hệ thống tạo nhiều dòng hàng giống thông tin nhưng mỗi dòng có mã giao dịch duy nhất.'],
    ['5. Mã giao dịch không cần nhập trong file; hệ thống tự sinh khi nhận dữ liệu.'],
    ['6. Có thể dùng tên danh mục tiếng Việt như "Bàn phím", "Chuột", "Sạc & Cáp", "Màn hình"; hệ thống sẽ chuẩn hoá về mã chuẩn.'],
    [],
    ['VÍ DỤ DÒNG THỨ 3 Ở SHEET Du_lieu'],
    ['gia_ban_du_kien trống → dùng bằng gia_mua (95).'],
    ['trang_thai trống, không có ngày bán / giá bán thực tế → hiểu là in_stock.'],
    [`ngay_nhap trống → dùng ngày upload file (${getTodayIso(today)}).`],
    ['so_luong = 2 → tạo 2 món riêng với 2 mã giao dịch khác nhau.'],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Du_lieu');
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Huong_dan');

  dataSheet['!cols'] = [
    { wch: 24 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 44 },
  ];
  guideSheet['!cols'] = [
    { wch: 28 }, { wch: 12 }, { wch: 34 }, { wch: 62 }, { wch: 24 },
  ];
  guideSheet['!freeze'] = { xSplit: 0, ySplit: 4 };

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: 'E11D48' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  };
  const sectionStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '111827' } },
  };
  const wrapStyle = { alignment: { vertical: 'top', wrapText: true } };

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
  ['A1', 'A4', 'A16', 'A24'].forEach(ref => {
    if (guideSheet[ref]) guideSheet[ref].s = sectionStyle;
  });
  for (let c = 0; c <= 4; c++) {
    const cell = guideSheet[XLSX.utils.encode_cell({ r: 3, c })];
    if (cell) cell.s = headerStyle;
  }

  XLSX.writeFile(workbook, 'mau_nhap_hang_nexus_gear.xlsx');
}

function ImportDataButton({ today, onImport, disabled = false }) {
  const [open, setOpen] = useStateImp(false);
  return (
    <>
      <button className="ctl" onClick={() => setOpen(true)} disabled={disabled}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>⇪</span> NHẬP FILE EXCEL
      </button>
      {open && <ImportDataModal today={today} onClose={() => setOpen(false)} onImport={onImport} />}
    </>
  );
}

function ImportDataModal({ today, onClose, onImport }) {
  const [fileName, setFileName] = useStateImp('');
  const [result, setResult] = useStateImp(null);
  const [busy, setBusy] = useStateImp(false);
  const [fatalError, setFatalError] = useStateImp('');
  const [replaceExisting, setReplaceExisting] = useStateImp(false);

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true);
    setFatalError('');
    setFileName(file.name);
    try {
      if (!window.XLSX) throw new Error('Không tải được bộ đọc Excel.');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const rawRows = workbookRowsToObjects(workbook);
      if (rawRows.length === 0 || rawRows.every(row => Object.keys(row).length === 0)) {
        throw new Error('Không tìm thấy cột hợp lệ. Hãy dùng file mẫu hoặc kiểm tra lại hàng tiêu đề.');
      }
      setResult(normalizeImportedRows(rawRows, today));
    } catch (error) {
      setResult(null);
      setFatalError(error.message || 'Không đọc được file.');
    } finally {
      setBusy(false);
    }
  };

  const canImport = result && result.units.length > 0 && result.errors.length === 0;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>NHẬP DỮ LIỆU TỪ EXCEL</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body import-body">
          <div className="import-top">
            <div>
              <div className="import-title">Một file, hai nơi tự cập nhật</div>
              <div className="import-sub">
                Dòng <strong>in_stock</strong> đi vào Kho hàng; dòng <strong>sold</strong> đi vào Tổng quan.
                Hệ thống sẽ chuẩn hoá ngày, giá và trạng thái trước khi lưu.
              </div>
            </div>
            <button className="ctl ghost" onClick={() => downloadImportTemplate(today)}>
              ↓ TẢI FILE MẪU .XLSX
            </button>
          </div>

          <label className="import-dropzone">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => handleFile(e.target.files?.[0])}
            />
            <span className="import-drop-main">{busy ? 'Đang đọc file...' : 'Chọn file Excel / CSV để nhập'}</span>
            <span className="import-drop-sub">{fileName || 'Hỗ trợ .xlsx, .xls, .csv'}</span>
          </label>

          <label className={`import-replace-option ${replaceExisting ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={e => setReplaceExisting(e.target.checked)}
            />
            <span>
              <strong>Xóa toàn bộ dữ liệu hiện tại trước khi nhập</strong>
              <small>Mặc định không chọn. Nếu bật, file mới sẽ thay thế toàn bộ Kho hàng và Đơn đã bán đang có.</small>
            </span>
          </label>

          {replaceExisting && (
            <div className="import-alert warn">
              Chế độ thay thế đang bật: sau khi nhập, chỉ dữ liệu trong file mới còn lại trên hệ thống.
            </div>
          )}

          <div className="import-format">
            <div className="card-title">Format yêu cầu</div>
            <div className="import-schema-grid">
              {IMPORT_SCHEMA.map(col => (
                <div key={col.key} className="import-schema-row">
                  <span className="mono">{col.label}</span>
                  <span className={col.required ? 'req' : 'opt'}>{col.required ? 'bắt buộc' : 'tuỳ chọn'}</span>
                  <span>{col.note}</span>
                </div>
              ))}
            </div>
          </div>

          {fatalError && <div className="import-alert error">{fatalError}</div>}

          {result && (
            <div className="import-review">
              <div className="import-stats">
                <div><strong>{result.sourceRows}</strong><span>dòng nguồn</span></div>
                <div><strong>{result.units.length}</strong><span>món hợp lệ</span></div>
                <div><strong>{result.errors.length}</strong><span>lỗi chặn nhập</span></div>
                <div><strong>{result.warnings.length}</strong><span>chuẩn hoá tự động</span></div>
              </div>

              {result.errors.length > 0 && (
                <div className="import-alert error">
                  {result.errors.slice(0, 5).map((msg, i) => <div key={i}>{msg}</div>)}
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="import-alert warn">
                  {result.warnings.slice(0, 6).map((msg, i) => <div key={i}>{msg}</div>)}
                  {result.warnings.length > 6 && <div>... và {result.warnings.length - 6} chuẩn hoá khác</div>}
                </div>
              )}

              {result.units.length > 0 && (
                <div className="tbl-wrap import-preview">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Trạng thái</th>
                        <th className="num">Giá mua</th>
                        <th>Ngày nhập</th>
                        <th>Ngày bán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.units.slice(0, 5).map((u, i) => (
                        <tr key={`${u.name}-${i}`}>
                          <td>{u.name}{u.variant ? ` · ${u.variant}` : ''}</td>
                          <td><CatPill cat={u.cat} /></td>
                          <td>{u.status === 'sold' ? 'Đã bán' : 'Tồn kho'}</td>
                          <td className="num mono">{u.buy.toLocaleString('vi-VN')}</td>
                          <td className="mono">{new Date(u.arrived).toLocaleDateString('vi-VN')}</td>
                          <td className="mono">{u.sold ? new Date(u.sold).toLocaleDateString('vi-VN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button
            className="ctl primary"
            disabled={!canImport}
            onClick={() => {
              if (!canImport) return;
              onImport(result.units, { replaceExisting });
              onClose();
            }}
            style={{ opacity: canImport ? 1 : 0.5, cursor: canImport ? 'pointer' : 'not-allowed' }}
          >
            NHẬP {result?.units.length || 0} MÓN
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ImportDataButton,
  normalizeImportedRows,
  downloadImportTemplate,
});
