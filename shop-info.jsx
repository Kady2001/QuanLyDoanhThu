// Shop info page — about, warranty, shipping, contact

function ShopInfo({ onBack }) {
  return (
    <div>
      {/* Back button */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)' }}>
        <button className="ctl ghost" onClick={onBack} style={{ fontSize: 13, padding: '8px 0' }}>
          ← Quay lại cửa hàng
        </button>
      </div>

      {/* Hero */}
      <div className="si-hero">
        <div className="si-hero-mark">
          <div className="logo-mark" style={{ width: 56, height: 56, fontSize: 24 }}>N</div>
        </div>
        <h1 className="si-hero-title">
          NEXUS<span style={{ color: 'var(--red)' }}>GEAR</span>
        </h1>
        <div className="si-hero-sub">
          Gear chính hãng cho người yêu công nghệ — từ bàn phím custom, chuột flagship đến điện thoại đỉnh nhất.
        </div>
        <div className="si-hero-stats">
          <div><span className="mono">3,200+</span><span>Đơn hàng đã giao</span></div>
          <div><span className="mono">4.9</span><span>Đánh giá trung bình</span></div>
          <div><span className="mono">5</span><span>Năm kinh nghiệm</span></div>
          <div><span className="mono">98%</span><span>Khách hàng quay lại</span></div>
        </div>
      </div>

      {/* About section */}
      <div className="si-section">
        <div className="si-section-h">
          <span className="si-accent"></span>
          <h2>Về Nexus Gear</h2>
        </div>
        <div className="si-grid-2">
          <div>
            <p className="si-p">
              Nexus Gear ra đời từ niềm đam mê với gear công nghệ — từ những đêm gõ phím custom đầu tiên, mod chuột, tới việc trở thành một trong những địa chỉ tin cậy cho cộng đồng MK, gaming và setup desk tại Việt Nam.
            </p>
            <p className="si-p">
              Chúng tôi không chỉ bán sản phẩm — chúng tôi <strong>tư vấn, build, mod và đồng hành</strong> cùng bạn xây dựng setup hoàn hảo. Mỗi món hàng đều được test kỹ trước khi đến tay khách.
            </p>
          </div>
          <div className="si-pillars">
            {[
              { ico: '✦', t: 'Chính hãng 100%', s: 'Nguồn hàng trực tiếp từ nhà phân phối — không hàng nhái, không hàng dựng.' },
              { ico: '⚡', t: 'Test trước khi ship', s: 'Mỗi sản phẩm đều được kiểm tra kỹ lưỡng từ ngoại hình tới chức năng.' },
              { ico: '◈', t: 'Hỗ trợ trọn đời', s: 'Tư vấn miễn phí cả sau bảo hành. Bạn cần — chúng tôi có.' },
            ].map((p, i) => (
              <div key={i} className="si-pillar">
                <div className="si-pillar-ico">{p.ico}</div>
                <div>
                  <div className="si-pillar-t">{p.t}</div>
                  <div className="si-pillar-s">{p.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warranty policy */}
      <div className="si-section si-warranty">
        <div className="si-section-h">
          <span className="si-accent"></span>
          <h2>Chính sách bảo hành</h2>
        </div>
        <div className="si-warranty-grid">
          {[
            { cat: 'Bàn phím & Keycap', months: '12 tháng', extra: '1 đổi 1 trong 7 ngày', color: '#ff6a3d' },
            { cat: 'Điện thoại',         months: '12 tháng', extra: 'BH chính hãng tại TT uỷ quyền', color: '#2563eb' },
            { cat: 'Chuột',              months: '24 tháng', extra: 'BH switch riêng',              color: '#059669' },
            { cat: 'Sạc & Cáp',          months: '12 tháng', extra: 'Đổi mới trong 30 ngày',        color: '#7c3aed' },
            { cat: 'Phụ kiện',           months: '6 tháng',  extra: 'Đổi 1-1 nếu lỗi NSX',           color: '#db2777' },
          ].map((w, i) => (
            <div key={i} className="si-warranty-card" style={{ borderLeftColor: w.color }}>
              <div className="si-w-cat">{w.cat}</div>
              <div className="si-w-time mono">{w.months}</div>
              <div className="si-w-extra">{w.extra}</div>
            </div>
          ))}
        </div>
        <div className="si-callout">
          <div className="si-callout-ico">!</div>
          <div>
            <div className="si-callout-t">Lưu ý bảo hành</div>
            <div className="si-callout-s">
              Sản phẩm cần còn nguyên hộp, phụ kiện và tem bảo hành. Không áp dụng cho lỗi do người dùng (rơi vỡ, vào nước, tự can thiệp). Mang trực tiếp tới shop hoặc gửi qua bưu điện đều được hỗ trợ.
            </div>
          </div>
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="si-section si-grid-2-cards">
        <div className="card si-policy">
          <div className="si-policy-head">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <h3>Vận chuyển</h3>
          </div>
          <ul className="si-list">
            <li><strong>Nội thành HN & HCM:</strong> Giao 1–2 giờ, freeship đơn từ 500K.</li>
            <li><strong>Toàn quốc:</strong> Giao 2–4 ngày qua J&T, GHN — phí từ 25K.</li>
            <li><strong>Đơn từ 2 triệu:</strong> Freeship toàn quốc + bảo hiểm hàng hoá.</li>
            <li><strong>COD:</strong> Hỗ trợ kiểm hàng trước khi thanh toán.</li>
          </ul>
        </div>
        <div className="card si-policy">
          <div className="si-policy-head">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <h3>Thanh toán</h3>
          </div>
          <ul className="si-list">
            <li><strong>Chuyển khoản:</strong> Vietcombank, Techcombank, MB Bank.</li>
            <li><strong>Ví điện tử:</strong> Momo, ZaloPay, ShopeePay.</li>
            <li><strong>Thẻ tín dụng:</strong> Visa, Mastercard, JCB.</li>
            <li><strong>Trả góp 0%:</strong> Qua thẻ tín dụng, đơn từ 3 triệu.</li>
          </ul>
        </div>
      </div>

      {/* FAQ */}
      <div className="si-section">
        <div className="si-section-h">
          <span className="si-accent"></span>
          <h2>Câu hỏi thường gặp</h2>
        </div>
        <div className="si-faq">
          {[
            { q: 'Hàng có bảo hành chính hãng không?', a: 'Toàn bộ sản phẩm bán tại Nexus Gear đều là hàng chính hãng, có hoá đơn VAT và phiếu bảo hành. Riêng điện thoại được kích hoạt bảo hành tại trung tâm uỷ quyền của hãng.' },
            { q: 'Tôi có thể đổi trả nếu không thích sản phẩm không?', a: 'Có. Bạn có thể đổi trả trong 7 ngày kể từ khi nhận hàng, miễn là sản phẩm còn nguyên seal, hộp và phụ kiện. Không cần lý do.' },
            { q: 'Shop có nhận build keyboard custom không?', a: 'Có. Chúng tôi nhận build full theo yêu cầu: switch, plate, foam, keycap, lube switch và stab. Liên hệ trước để được tư vấn cấu hình.' },
            { q: 'Có hỗ trợ mua trả góp không?', a: 'Có, áp dụng cho đơn từ 3 triệu trở lên qua thẻ tín dụng các ngân hàng lớn. Thủ tục đơn giản, lãi suất 0% trong 3–12 tháng.' },
            { q: 'Phương thức liên hệ nhanh nhất?', a: 'Inbox fanpage Facebook hoặc nhắn Zalo theo số hotline. Đội tư vấn online từ 9h–22h mỗi ngày, kể cả cuối tuần.' },
          ].map((f, i) => (
            <details key={i} className="si-faq-item">
              <summary>
                <span>{f.q}</span>
                <span className="si-faq-chev">+</span>
              </summary>
              <div className="si-faq-a">{f.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="si-section">
        <div className="si-section-h">
          <span className="si-accent"></span>
          <h2>Liên hệ với chúng tôi</h2>
        </div>
        <div className="si-contact-grid">
          {[
            { ico: '◉', t: 'Cửa hàng', l1: '12 Trần Đại Nghĩa, Hai Bà Trưng', l2: 'Hà Nội · 9h–22h hàng ngày' },
            { ico: '☎', t: 'Hotline / Zalo', l1: '0901 234 567', l2: 'Hỗ trợ 9h–22h hàng ngày' },
            { ico: '✉', t: 'Email', l1: 'hello@nexusgear.vn', l2: 'Phản hồi trong 24 giờ' },
            { ico: '◈', t: 'Mạng xã hội', l1: 'fb.com/nexusgear', l2: 'instagram.com/nexus.gear' },
          ].map((c, i) => (
            <div key={i} className="si-contact-card">
              <div className="si-contact-ico">{c.ico}</div>
              <div className="si-contact-t">{c.t}</div>
              <div className="si-contact-l1">{c.l1}</div>
              <div className="si-contact-l2">{c.l2}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer cta */}
      <div className="si-footer-cta">
        <div>
          <div className="si-footer-t">Sẵn sàng nâng cấp setup?</div>
          <div className="si-footer-s">Khám phá hơn 40 sản phẩm gear chính hãng đang có sẵn.</div>
        </div>
        <button className="ctl primary" onClick={onBack} style={{ height: 44, padding: '0 24px', fontSize: 13 }}>
          KHÁM PHÁ CỬA HÀNG →
        </button>
      </div>
    </div>
  );
}

window.ShopInfo = ShopInfo;
