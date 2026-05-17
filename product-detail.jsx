// Product detail page — full info for a product, plus related items

const { useMemo: useMemoPD } = React;

// Static category metadata for the storefront — specs templates, descriptions
const PRODUCT_META = {
  keyboard: {
    tagline: 'Bàn phím cơ tuỳ biến — gõ đã, dùng bền',
    specs: [
      { label: 'Loại switch', value: 'HE / Magnetic / Tactile' },
      { label: 'Kết nối', value: 'USB-C / Bluetooth 5.0 / 2.4GHz' },
      { label: 'Layout', value: '75% / 60% / Full-size' },
      { label: 'Plate', value: 'FR4 / Polycarbonate / Aluminum' },
      { label: 'Pin', value: '4000mAh (bản wireless)' },
      { label: 'Phụ kiện', value: 'Hộp, cáp, keypuller, vít' },
    ],
    desc: 'Bàn phím cơ với cảm giác gõ premium, có hot-swap socket, RGB south-facing, được build kỹ tại xưởng. Phù hợp cho cả gaming và làm việc lâu dài.',
  },
  keycap: {
    tagline: 'Keycap PBT chất lượng cao, đa profile',
    specs: [
      { label: 'Chất liệu', value: 'PBT dye-sub / Doubleshot' },
      { label: 'Profile', value: 'XDA / Cherry / SA' },
      { label: 'Số phím', value: '132 phím (đủ layout)' },
      { label: 'Thickness', value: '1.5mm' },
      { label: 'Tương thích', value: 'MX-style switch (Cherry, Gateron, Kailh)' },
      { label: 'Phụ kiện', value: 'Keypuller, hộp đựng' },
    ],
    desc: 'Set keycap PBT in chìm bằng công nghệ dye-sublimation, màu sắc bền không phai, font in sắc nét. Hỗ trợ đầy đủ layout từ 60% đến full-size.',
  },
  phone: {
    tagline: 'Điện thoại chính hãng — nguyên seal, bảo hành VN',
    specs: [
      { label: 'Tình trạng', value: 'New 100% — nguyên seal' },
      { label: 'Bảo hành', value: '12 tháng chính hãng' },
      { label: 'Phụ kiện', value: 'Đầy đủ trong hộp (cáp, tài liệu)' },
      { label: 'Phiên bản', value: 'Quốc tế / Việt Nam' },
      { label: 'Khả năng kết nối', value: '5G / Wi-Fi 6 / Bluetooth 5.3' },
      { label: 'Hỗ trợ trả góp', value: '0% qua thẻ tín dụng' },
    ],
    desc: 'Máy mới 100% nguyên seal, kích hoạt bảo hành chính hãng tại trung tâm uỷ quyền. Đầy đủ phụ kiện, hộp seal cứng. Hỗ trợ đổi mới trong 7 ngày nếu phát hiện lỗi nhà sản xuất.',
  },
  mouse: {
    tagline: 'Chuột gaming siêu nhẹ, sensor flagship',
    specs: [
      { label: 'Sensor', value: 'PixArt PAW3950 / Razer Focus Pro 35K' },
      { label: 'DPI', value: '50–32000 DPI' },
      { label: 'Polling rate', value: '8000Hz wireless' },
      { label: 'Trọng lượng', value: '49–65g' },
      { label: 'Pin', value: '95 giờ' },
      { label: 'Switch', value: 'Optical, 90 triệu lần click' },
    ],
    desc: 'Chuột wireless siêu nhẹ với sensor flagship, polling rate 8K, switch quang học bền bỉ. Dáng ergonomic cho phép cầm thoải mái cả ngày, latency cực thấp cho gaming competitive.',
  },
  cable: {
    tagline: 'Sạc nhanh & cáp chuẩn chất, đi kèm bảo hành',
    specs: [
      { label: 'Công nghệ', value: 'GaN II / PD 3.0 / PPS' },
      { label: 'Công suất', value: '65W / 100W' },
      { label: 'Cổng', value: 'USB-C × 2, USB-A × 1' },
      { label: 'Chất liệu cáp', value: 'Nylon braided, lõi đồng nguyên chất' },
      { label: 'Chiều dài', value: '1m / 2m / Coiled' },
      { label: 'Chứng nhận', value: 'CE, FCC, ROHS' },
    ],
    desc: 'Củ sạc nhanh sử dụng chip GaN II giúp giảm 50% kích thước. Hỗ trợ đầy đủ chuẩn PD 3.0, PPS, sạc nhanh cho hầu hết thiết bị từ iPhone, Samsung tới MacBook.',
  },
  monitor: {
    tagline: 'Màn hình sắc nét cho gaming, đồ hoạ và làm việc',
    specs: [
      { label: 'Kích thước', value: '24 / 27 / 32 inch' },
      { label: 'Độ phân giải', value: 'Full HD / 2K / 4K' },
      { label: 'Tần số quét', value: '75Hz / 144Hz / 165Hz' },
      { label: 'Tấm nền', value: 'IPS / VA / OLED' },
      { label: 'Cổng kết nối', value: 'HDMI / DisplayPort / USB-C' },
      { label: 'Bảo hành', value: '12–36 tháng chính hãng' },
    ],
    desc: 'Màn hình chính hãng với màu sắc cân bằng, tần số quét mượt và nhiều lựa chọn theo nhu cầu gaming, thiết kế hoặc văn phòng. Dễ phối vào setup hiện đại và có đầy đủ cổng kết nối phổ biến.',
  },
  accessory: {
    tagline: 'Phụ kiện tăng trải nghiệm bàn làm việc',
    specs: [
      { label: 'Chất liệu', value: 'Vải / Kim loại / Gỗ tự nhiên' },
      { label: 'Kích thước', value: 'Đa kích thước (xem variant)' },
      { label: 'Hoàn thiện', value: 'Premium handmade / CNC' },
      { label: 'Phù hợp', value: 'Setup gaming / Office / Stream' },
      { label: 'Bảo hành', value: '6 tháng đổi mới 1-1' },
    ],
    desc: 'Phụ kiện được chọn lọc kỹ — chất liệu cao cấp, hoàn thiện tỉ mỉ. Nâng tầm setup desk của bạn cả về thẩm mỹ lẫn trải nghiệm sử dụng hàng ngày.',
  },
};

function ProductDetail({ productName, inStock, onBack, onSelectProduct }) {
  // Collect all units of this product
  const variants = useMemoPD(() => inStock.filter(u => u.name === productName), [inStock, productName]);
  const main = variants[0];

  if (!main) {
    return (
      <div style={{ padding: '60px 28px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: 16, marginBottom: 16 }}>Sản phẩm không còn trong kho</div>
        <button className="ctl primary" onClick={onBack}>← Quay lại cửa hàng</button>
      </div>
    );
  }

  const cat = window.CATEGORIES.find(c => c.id === main.cat);
  const meta = PRODUCT_META[main.cat] || PRODUCT_META.accessory;

  const prices = variants.map(v => v.expectedSell);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Newest arrival date
  const newestArrived = variants.map(v => new Date(v.arrived)).sort((a, b) => b - a)[0];

  // Related: same category, different product, top 4
  const related = useMemoPD(() => {
    const map = {};
    inStock.forEach(u => {
      if (u.name === productName || u.cat !== main.cat) return;
      if (!map[u.name]) {
        map[u.name] = { name: u.name, cat: u.cat, minPrice: u.expectedSell, stock: 0, newest: u.arrived };
      }
      map[u.name].minPrice = Math.min(map[u.name].minPrice, u.expectedSell);
      map[u.name].stock += 1;
      if (new Date(u.arrived) > new Date(map[u.name].newest)) map[u.name].newest = u.arrived;
    });
    return Object.values(map).sort((a, b) => new Date(b.newest) - new Date(a.newest)).slice(0, 4);
  }, [inStock, main.cat, productName]);

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ padding: '20px 28px 0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
        <button onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0 }}>
          Cửa hàng
        </button>
        <span>/</span>
        <span style={{ color: cat.color, fontWeight: 700 }}>{cat.name}</span>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{main.name}</span>
      </div>

      {/* Main layout: image left, info right */}
      <div className="pd-main">
        <div className="pd-gallery">
          <div className="pd-thumb-lg">
            <ProductThumbLarge cat={main.cat} />
            <div className="pd-stock-badge">
              {variants.length <= 2 ? `CHỈ CÒN ${variants.length}` : `CÒN ${variants.length} MÓN`}
            </div>
          </div>
          <div className="pd-thumb-row">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`pd-thumb-sm ${i === 0 ? 'active' : ''}`}>
                <ProductThumbLarge cat={main.cat} />
              </div>
            ))}
          </div>
        </div>

        <div className="pd-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <CatPill cat={main.cat} />
            <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
              MỚI VỀ {newestArrived.toLocaleDateString('vi-VN')}
            </span>
          </div>
          <h1 className="pd-name">{main.name}</h1>
          <div className="pd-tagline">{meta.tagline}</div>

          <div className="pd-price-row">
            <div className="pd-price">
              {minPrice === maxPrice
                ? <><span className="mono">{minPrice.toLocaleString('vi-VN')}</span><span className="pd-price-suffix">.000đ</span></>
                : <><span className="mono">{minPrice.toLocaleString('vi-VN')}–{maxPrice.toLocaleString('vi-VN')}</span><span className="pd-price-suffix">.000đ</span></>}
            </div>
            <div className="pd-price-meta">
              <div>Trả góp 0%</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>chỉ từ <span className="mono" style={{ color: 'var(--text)', fontWeight: 700 }}>{Math.round(minPrice / 6).toLocaleString('vi-VN')}K/tháng</span></div>
            </div>
          </div>

          {/* Variant selector */}
          {variants.length > 1 && (
            <div className="pd-variants">
              <div className="pd-section-h">CHỌN PHIÊN BẢN</div>
              <div className="pd-variant-list">
                {variants.map((v, i) => (
                  <button key={v.id} className={`pd-variant ${i === 0 ? 'active' : ''}`}>
                    <span className="v-name">{v.variant || '—'}</span>
                    <span className="v-price mono">{v.expectedSell.toLocaleString('vi-VN')}K</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="pd-cta">
            <button className="ctl primary pd-buy">MUA NGAY</button>
            <button className="ctl pd-cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              THÊM VÀO GIỎ
            </button>
          </div>

          {/* Trust badges */}
          <div className="pd-badges">
            <div className="pd-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div>
                <div className="b-t">Bảo hành 12 tháng</div>
                <div className="b-s">1 đổi 1 trong 7 ngày</div>
              </div>
            </div>
            <div className="pd-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <div>
                <div className="b-t">Giao toàn quốc</div>
                <div className="b-s">Freeship nội thành</div>
              </div>
            </div>
            <div className="pd-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <div>
                <div className="b-t">Đổi trả 7 ngày</div>
                <div className="b-s">Không cần lý do</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description + Specs side-by-side */}
      <div className="pd-secondary">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Giới thiệu sản phẩm</div>
              <div className="card-sub">Mô tả chi tiết · {cat.name}</div>
            </div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)', margin: 0 }}>
              {meta.desc}
            </p>
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[
                { ico: '⚡', t: 'Hiệu năng cao', s: 'Build từ linh kiện cao cấp, tối ưu cho cả gaming và làm việc.' },
                { ico: '✦', t: 'Hoàn thiện tỉ mỉ', s: 'Test kỹ trước khi giao — chỉ ship hàng đạt chuẩn.' },
                { ico: '◈', t: 'Tương thích rộng', s: 'Hoạt động với mọi hệ điều hành phổ biến.' },
                { ico: '↻', t: 'Hỗ trợ trọn đời', s: 'Tư vấn kỹ thuật miễn phí ngay cả khi hết bảo hành.' },
              ].map((f, i) => (
                <div key={i} className="pd-feature">
                  <div className="pd-feature-ico" style={{ color: cat.color }}>{f.ico}</div>
                  <div>
                    <div className="pd-feature-t">{f.t}</div>
                    <div className="pd-feature-s">{f.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Thông số kỹ thuật</div>
              <div className="card-sub">Chi tiết sản phẩm</div>
            </div>
          </div>
          <div className="pd-specs">
            {meta.specs.map((s, i) => (
              <div key={i} className="pd-spec">
                <span className="pd-spec-l">{s.label}</span>
                <span className="pd-spec-v">{s.value}</span>
              </div>
            ))}
            <div className="pd-spec">
              <span className="pd-spec-l">Tình trạng kho</span>
              <span className="pd-spec-v">
                <span className="status-tag status-ok"><span className="d"></span>CÒN {variants.length} MÓN</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="pd-related">
          <div className="pd-related-head">
            <div>
              <div className="card-title" style={{ fontSize: 16 }}>Sản phẩm liên quan</div>
              <div className="card-sub">Cùng danh mục {cat.name.toLowerCase()}</div>
            </div>
            <button className="ctl ghost" onClick={onBack}>XEM TẤT CẢ →</button>
          </div>
          <div className="store-grid" style={{ padding: 0 }}>
            {related.map(p => {
              const status = p.stock <= 2 ? 'warn' : 'ok';
              const cName = window.CATEGORIES.find(c => c.id === p.cat)?.name;
              return (
                <div key={p.name} className="prod-card" onClick={() => onSelectProduct(p.name)}>
                  <div className="prod-thumb">
                    <div className="cat-tag"><CatPill cat={p.cat} /></div>
                    <div className={`stock-tag ${status}`}>
                      {p.stock <= 2 ? `CHỈ CÒN ${p.stock}` : `CÒN ${p.stock}`}
                    </div>
                    <ProductThumbLarge cat={p.cat} />
                  </div>
                  <div className="prod-info">
                    <div className="prod-name">{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{cName}</div>
                    <div className="prod-price">
                      <span className="sell mono">{p.minPrice.toLocaleString('vi-VN')}<span className="unit"> .000đ</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

window.ProductDetail = ProductDetail;
