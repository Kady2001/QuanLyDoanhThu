// Storefront — list, with internal navigation to detail / shop info

const { useState: useStateS, useMemo: useMemoS, useEffect: useEffectS } = React;

// Floating contact widget
function FloatingContact() {
  const [expanded, setExpanded] = useStateS(false);
  const contacts = [
    { name: 'Messenger', icon: '👤', color: '#0084FF', url: 'https://m.me/nexusgear' },
    { name: 'Zalo', icon: '💬', color: '#0084FF', url: 'https://zalo.me/0901234567' },
    { name: 'Telegram', icon: '✈️', color: '#0088cc', url: 'https://t.me/nexusgear' },
  ];

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, fontFamily: 'inherit' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        alignItems: 'flex-end',
        marginBottom: expanded ? 16 : 0,
      }}>
        {expanded && contacts.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            title={c.name}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: c.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            {c.icon}
          </a>
        ))}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'var(--red)',
          border: 'none',
          color: '#fff',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        title="Liên hệ"
      >
        💬
      </button>
    </div>
  );
}

function Storefront({ inStock }) {
  // view: 'list' | 'detail' | 'info'
  const [view, setView] = useStateS('list');
  const [selectedProduct, setSelectedProduct] = useStateS(null);

  // Keep storefront navigation in browser history so Back behaves naturally.
  useEffectS(() => {
    const currentState = window.history.state;

    // Ensure there is always a storefront fallback entry for first load / direct access.
    if (!currentState || currentState.scope !== 'storefront') {
      window.history.replaceState(
        { scope: 'storefront', view: 'list', productName: null },
        '',
        window.location.href
      );
    }

    const handlePopState = (event) => {
      const nextState = event.state;

      if (!nextState || nextState.scope !== 'storefront') {
        setView('list');
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: 'instant' });
        return;
      }

      setView(nextState.view || 'list');
      setSelectedProduct(nextState.productName || null);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // When user navigates via card / related / footer, reset scroll
  const goDetail = (name) => {
    setSelectedProduct(name);
    setView('detail');
    window.history.pushState(
      { scope: 'storefront', view: 'detail', productName: name },
      '',
      window.location.href
    );
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const goList = () => {
    setView('list');
    setSelectedProduct(null);
    window.history.pushState(
      { scope: 'storefront', view: 'list', productName: null },
      '',
      window.location.href
    );
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const goInfo = () => {
    setView('info');
    setSelectedProduct(null);
    window.history.pushState(
      { scope: 'storefront', view: 'info', productName: null },
      '',
      window.location.href
    );
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (view === 'detail' && selectedProduct) {
    return (
      <div>
        <ProductDetail
          productName={selectedProduct}
          inStock={inStock}
          onBack={goList}
          onSelectProduct={goDetail}
        />
        <StoreFooter onInfo={goInfo} />
        <FloatingContact />
      </div>
    );
  }
  if (view === 'info') {
    return (
      <div>
        <ShopInfo onBack={goList} />
        <StoreFooter onInfo={goInfo} />
        <FloatingContact />
      </div>
    );
  }
  return (
    <div>
      <StoreList inStock={inStock} onSelectProduct={goDetail} onInfo={goInfo} />
      <StoreFooter onInfo={goInfo} />
      <FloatingContact />
    </div>
  );
}

function StoreList({ inStock, onSelectProduct, onInfo }) {
  const [search, setSearch] = useStateS('');
  const [cat, setCat] = useStateS('all');
  const [sort, setSort] = useStateS('newest');

  // Group units by product name
  const products = useMemoS(() => {
    const map = {};
    inStock.forEach(u => {
      const key = u.name;
      if (!map[key]) {
        map[key] = {
          name: u.name, cat: u.cat,
          minPrice: u.expectedSell, maxPrice: u.expectedSell,
          stock: 0, variants: [], newestArrived: u.arrived,
        };
      }
      const g = map[key];
      g.minPrice = Math.min(g.minPrice, u.expectedSell);
      g.maxPrice = Math.max(g.maxPrice, u.expectedSell);
      g.stock += 1;
      g.variants.push(u.variant || '—');
      if (new Date(u.arrived) > new Date(g.newestArrived)) g.newestArrived = u.arrived;
    });
    return Object.values(map);
  }, [inStock]);

  const filtered = useMemoS(() => {
    let r = products.filter(p => {
      const ms = p.name.toLowerCase().includes(search.toLowerCase());
      const mc = cat === 'all' || p.cat === cat;
      return ms && mc;
    });
    r = r.slice().sort((a, b) => {
      if (sort === 'price_asc') return a.minPrice - b.minPrice;
      if (sort === 'price_desc') return b.maxPrice - a.maxPrice;
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'newest') return new Date(b.newestArrived) - new Date(a.newestArrived);
      return 0;
    });
    return r;
  }, [products, search, cat, sort]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title"><span className="accent"></span>Cửa hàng</h1>
          <div className="page-sub">Gear chính hãng · Giao hàng toàn quốc · {products.length} sản phẩm có sẵn</div>
        </div>
        <div className="page-controls">
          <button className="ctl ghost" onClick={onInfo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            VỀ CỬA HÀNG
          </button>
          <div className="search">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input type="text" placeholder="Tìm theo tên..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="ctl" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">MỚI VỀ NHẤT</option>
            <option value="price_asc">GIÁ TĂNG DẦN</option>
            <option value="price_desc">GIÁ GIẢM DẦN</option>
            <option value="name">TÊN A-Z</option>
          </select>
        </div>
      </div>

      <div className="chips">
        <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
          TẤT CẢ
        </button>
        {window.CATEGORIES.map(c => (
          <button key={c.id} className={`chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
            <i style={{ width: 7, height: 7, background: c.color, display: 'inline-block' }}></i>
            {c.name.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="store-grid">
        {filtered.map(p => {
          const status = p.stock <= 2 ? 'warn' : 'ok';
          const cName = window.CATEGORIES.find(c => c.id === p.cat)?.name;
          const priceTxt = p.minPrice === p.maxPrice
            ? p.minPrice.toLocaleString('vi-VN')
            : `${p.minPrice.toLocaleString('vi-VN')}–${p.maxPrice.toLocaleString('vi-VN')}`;
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
                {p.variants.length > 1 && (
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {[...new Set(p.variants)].slice(0, 3).join(' · ')}
                  </div>
                )}
                <div className="prod-price">
                  <span className="sell mono">{priceTxt}<span className="unit"> .000đ</span></span>
                </div>
                <button className="ctl primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
                  onClick={(e) => { e.stopPropagation(); onSelectProduct(p.name); }}>
                  XEM CHI TIẾT
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>Không có sản phẩm phù hợp</div>
        )}
      </div>
    </div>
  );
}

function StoreFooter({ onInfo }) {
  return (
    <footer className="sf-footer">
      <div className="sf-footer-grid">
        <div className="sf-footer-brand">
          <div className="logo">
            <div className="logo-mark">N</div>
            <div className="logo-name">NEXUS<span>GEAR</span></div>
          </div>
          <p className="sf-footer-p">Gear chính hãng cho người yêu công nghệ. Bàn phím custom, chuột flagship, điện thoại đỉnh nhất.</p>
        </div>
        <div>
          <div className="sf-footer-h">Cửa hàng</div>
          <ul>
            <li><a onClick={onInfo}>Về Nexus Gear</a></li>
            <li><a onClick={onInfo}>Chính sách bảo hành</a></li>
            <li><a onClick={onInfo}>Vận chuyển</a></li>
            <li><a onClick={onInfo}>Thanh toán</a></li>
          </ul>
        </div>
        <div>
          <div className="sf-footer-h">Hỗ trợ</div>
          <ul>
            <li><a onClick={onInfo}>Liên hệ</a></li>
            <li><a onClick={onInfo}>FAQ</a></li>
            <li><a onClick={onInfo}>Đổi trả</a></li>
            <li><a onClick={onInfo}>Hướng dẫn mua hàng</a></li>
          </ul>
        </div>
        <div>
          <div className="sf-footer-h">Liên hệ</div>
          <ul>
            <li>12 Trần Đại Nghĩa, Hà Nội</li>
            <li className="mono">0901 234 567</li>
            <li className="mono">hello@nexusgear.vn</li>
          </ul>
        </div>
      </div>
      <div className="sf-footer-bot">
        <span>© 2026 Nexus Gear. All rights reserved.</span>
        <span>Made with passion in Hanoi.</span>
      </div>
    </footer>
  );
}

window.Storefront = Storefront;
