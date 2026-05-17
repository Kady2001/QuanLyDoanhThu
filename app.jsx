// Main app — owns the units state, passes actions down, handles authentication

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

// Temporary switch for development. Set false to restore login.
const DEV_BYPASS_AUTH = true;
const DEV_SESSION = {
  user: { username: 'dev', role: 'admin', name: 'Dev mode' },
  loginTime: Date.now(),
  expiresAt: Number.MAX_SAFE_INTEGER,
};

function codeDatePart(dateValue) {
  const d = dateValue ? new Date(dateValue) : new Date();
  const safe = Number.isNaN(d.getTime()) ? new Date() : d;
  return `${safe.getFullYear()}${String(safe.getMonth() + 1).padStart(2, '0')}${String(safe.getDate()).padStart(2, '0')}`;
}

function nextTransactionCode(existingCodes, dateValue) {
  const prefix = `NG-${codeDatePart(dateValue)}-`;
  const maxSeq = [...existingCodes].reduce((max, code) => {
    if (!String(code || '').startsWith(prefix)) return max;
    const seq = Number(String(code).slice(prefix.length));
    return Number.isFinite(seq) ? Math.max(max, seq) : max;
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

function ensureTransactionCodes(rows) {
  const usedCodes = new Set();
  return rows.map(unit => {
    const current = unit.transactionCode;
    const transactionCode = current && !usedCodes.has(current)
      ? current
      : nextTransactionCode(usedCodes, unit.arrived);
    usedCodes.add(transactionCode);
    return { ...unit, transactionCode };
  });
}

function buildUnitsWithCodes(rows, existingUnits, idPrefix) {
  const usedCodes = new Set(existingUnits.map(u => u.transactionCode).filter(Boolean));
  const stamp = Date.now();
  return rows.map((unit, index) => {
    const transactionCode = nextTransactionCode(usedCodes, unit.arrived);
    usedCodes.add(transactionCode);
    return {
      ...unit,
      id: `${idPrefix}_${stamp}_${index}`,
      transactionCode,
    };
  });
}

function loadSnapshots() {
  try {
    const saved = localStorage.getItem('nexus_gear_snapshots');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load snapshots from localStorage:', e);
    return [];
  }
}

function loadAffiliateIncomes() {
  try {
    const saved = localStorage.getItem('nexus_gear_affiliate_incomes');
    const parsed = saved ? JSON.parse(saved) : [];
    return normalizeAffiliateIncomes(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    console.error('Failed to load affiliate incomes from localStorage:', e);
    return [];
  }
}

function normalizeAffiliateStatus(value) {
  return value === 'pending' ? 'pending' : 'paid';
}

function normalizeAffiliateIncomes(entries) {
  return (entries || []).map(entry => ({
    ...entry,
    amount: Math.max(0, Math.round(+entry.amount || 0)),
    status: normalizeAffiliateStatus(entry.status),
  }));
}

function loadDashboardSettings() {
  try {
    const saved = localStorage.getItem('nexus_gear_dashboard_settings');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      includePendingAffiliateInProfit: Boolean(parsed?.includePendingAffiliateInProfit),
    };
  } catch (e) {
    console.error('Failed to load dashboard settings from localStorage:', e);
    return { includePendingAffiliateInProfit: false };
  }
}

function loadProductLines() {
  try {
    const saved = localStorage.getItem('nexus_gear_product_lines');
    const parsed = saved ? JSON.parse(saved) : [];
    const existing = Array.isArray(parsed) ? parsed : [];
    const byId = new Map(existing.map(line => [line.id, line]));
    window.INITIAL_PRODUCT_LINES.forEach(line => {
      if (!byId.has(line.id)) {
        byId.set(line.id, {
          ...line,
          variants: (line.variants || []).map(variant => ({ ...variant })),
        });
      }
    });
    return [...byId.values()];
  } catch (e) {
    console.error('Failed to load product lines from localStorage:', e);
    return window.INITIAL_PRODUCT_LINES;
  }
}

function loadCategories() {
  try {
    const initial = (window.INITIAL_CATEGORIES || window.CATEGORIES || []).map(category => ({ ...category }));
    const saved = localStorage.getItem('nexus_gear_categories');
    const parsed = saved ? JSON.parse(saved) : [];
    const existing = Array.isArray(parsed) ? parsed : [];
    const byId = new Map(initial.map(category => [category.id, category]));
    existing.forEach(category => {
      if (category?.id && category?.name) {
        byId.set(category.id, { ...category });
      }
    });
    return [...byId.values()];
  } catch (e) {
    console.error('Failed to load categories from localStorage:', e);
    return (window.INITIAL_CATEGORIES || window.CATEGORIES || []).map(category => ({ ...category }));
  }
}

function loadUnits() {
  try {
    const saved = localStorage.getItem('nexus_gear_units');
    const parsed = saved ? JSON.parse(saved) : window.INITIAL_UNITS;
    const rows = Array.isArray(parsed) ? parsed : window.INITIAL_UNITS;
    const seededMonitorSamples = localStorage.getItem('nexus_gear_monitor_seed_v1') === '1';
    const monitorSamples = window.INITIAL_UNITS.filter(unit => unit.cat === 'monitor');
    const alreadyHasMonitorUnits = rows.some(unit => unit.cat === 'monitor');

    if (saved && !seededMonitorSamples) {
      localStorage.setItem('nexus_gear_monitor_seed_v1', '1');
      if (!alreadyHasMonitorUnits) {
        return ensureTransactionCodes([
          ...rows,
          ...monitorSamples.map(unit => ({ ...unit })),
        ]);
      }
    }

    return ensureTransactionCodes(rows);
  } catch (e) {
    console.error('Failed to load units from localStorage:', e);
    return ensureTransactionCodes(window.INITIAL_UNITS);
  }
}

function createSnapshot(units, productLines, categories, affiliateIncomes, dashboardSettings, tab, name, kind = 'manual') {
  const createdAt = new Date().toISOString();
  return {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || `Bản lưu ${new Date(createdAt).toLocaleString('vi-VN')}`,
    kind,
    createdAt,
    tab,
    units: ensureTransactionCodes(units).map(u => ({ ...u })),
    productLines: productLines.map(line => ({ ...line, variants: (line.variants || []).map(v => ({ ...v })) })),
    categories: categories.map(category => ({ ...category })),
    affiliateIncomes: normalizeAffiliateIncomes(affiliateIncomes).map(entry => ({ ...entry })),
    dashboardSettings: {
      includePendingAffiliateInProfit: Boolean(dashboardSettings?.includePendingAffiliateInProfit),
    },
    summary: window.summarizeUnits(units),
  };
}

function formatSnapshotStamp(dateValue = new Date()) {
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}_${String(d.getHours()).padStart(2, '0')}-${String(d.getMinutes()).padStart(2, '0')}-${String(d.getSeconds()).padStart(2, '0')}`;
}

function makeAutoSnapshotName(sourceName) {
  const now = new Date();
  return `${now.getTime()}_${sourceName}_sao-luu_${formatSnapshotStamp(now)}`;
}

function catalogEntitySlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeUniqueCatalogId(base, existingIds, fallback) {
  const safeBase = base || fallback;
  if (!existingIds.has(safeBase)) return safeBase;
  let index = 2;
  while (existingIds.has(`${safeBase}-${index}`)) index += 1;
  return `${safeBase}-${index}`;
}

const EXTRA_CATEGORY_COLORS = [
  '#0ea5e9',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#6366f1',
];

const SHARED_POLL_MS = 2500;
const LOCK_HEARTBEAT_MS = 10000;

function getOrCreateClientId() {
  try {
    const saved = localStorage.getItem('nexus_gear_client_id');
    if (saved) return saved;
    const generated = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem('nexus_gear_client_id', generated);
    return generated;
  } catch {
    return `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

function makeClientName(clientId) {
  const shortId = clientId.slice(-4).toUpperCase();
  return `Thiết bị ${shortId}`;
}

function buildSharedState(units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots) {
  return {
    units: ensureTransactionCodes(units).map(unit => ({ ...unit })),
    productLines: productLines.map(line => cloneProductLine(line)),
    categories: categories.map(category => ({ ...category })),
    affiliateIncomes: normalizeAffiliateIncomes(affiliateIncomes).map(entry => ({ ...entry })),
    dashboardSettings: {
      includePendingAffiliateInProfit: Boolean(dashboardSettings?.includePendingAffiliateInProfit),
    },
    snapshots: snapshots.map(snapshot => ({
      ...snapshot,
      units: ensureTransactionCodes(snapshot.units || []).map(unit => ({ ...unit })),
      productLines: (snapshot.productLines || []).map(line => cloneProductLine(line)),
      categories: (snapshot.categories || []).map(category => ({ ...category })),
      affiliateIncomes: normalizeAffiliateIncomes(snapshot.affiliateIncomes || []).map(entry => ({ ...entry })),
      dashboardSettings: {
        includePendingAffiliateInProfit: Boolean(snapshot.dashboardSettings?.includePendingAffiliateInProfit),
      },
    })),
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cloneProductLine(line) {
  return {
    ...line,
    variants: (line.variants || []).map(variant => ({ ...variant })),
  };
}

function upsertProductLine(lines, line) {
  const cleanLine = cloneProductLine(line);
  return lines.some(item => item.id === cleanLine.id)
    ? lines.map(item => item.id === cleanLine.id ? cleanLine : item)
    : [...lines, cleanLine];
}

function App() {
  // Session and authentication state
  const [session, setSession] = useStateA(DEV_BYPASS_AUTH ? DEV_SESSION : null);
  const [initialized, setInitialized] = useStateA(false);

  const [tab, setTab] = useStateA(DEV_BYPASS_AUTH ? 'dashboard' : 'storefront');
  const [snapshots, setSnapshots] = useStateA(() => loadSnapshots());
  const [toasts, setToasts] = useStateA([]);
  const [categories, setCategories] = useStateA(() => loadCategories());
  const [productLines, setProductLines] = useStateA(() => loadProductLines());
  const [affiliateIncomes, setAffiliateIncomes] = useStateA(() => loadAffiliateIncomes());
  const [dashboardSettings, setDashboardSettings] = useStateA(() => loadDashboardSettings());
  
  // Initialize units from localStorage, fallback to INITIAL_UNITS
  const [units, setUnits] = useStateA(() => loadUnits());
  const [syncMode, setSyncMode] = useStateA('probing'); // probing | shared | offline
  const [syncReady, setSyncReady] = useStateA(false);
  const [serverVersion, setServerVersion] = useStateA(0);
  const [editLock, setEditLock] = useStateA({ owned: false, lock: null });
  const clientIdRef = useRefA(getOrCreateClientId());
  const clientNameRef = useRefA(makeClientName(clientIdRef.current));
  const suppressRemoteSaveRef = useRefA(false);
  const saveTimerRef = useRefA(null);
  const serverVersionRef = useRefA(0);
  window.CATEGORIES = categories;

  // Load session on mount
  useEffectA(() => {
    if (DEV_BYPASS_AUTH) {
      setInitialized(true);
      return;
    }
    try {
      const saved = localStorage.getItem('nexus_gear_session');
      if (saved) {
        const sess = JSON.parse(saved);
        if (window.isSessionValid(sess)) {
          setSession(sess);
        } else {
          localStorage.removeItem('nexus_gear_session');
        }
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
    setInitialized(true);
  }, []);

  const pushToast = (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nextToast = { id, ...toast };
    setToasts(prev => [...prev, nextToast].slice(-3));
    setTimeout(() => {
      setToasts(prev => prev.filter(item => item.id !== id));
    }, 5000);
  };

  const applySharedPayload = (payload) => {
    if (!payload?.state) return;
    suppressRemoteSaveRef.current = true;
    setUnits(ensureTransactionCodes(payload.state.units || []));
    setProductLines(payload.state.productLines || []);
    setCategories(payload.state.categories?.length ? payload.state.categories : loadCategories());
    setAffiliateIncomes(normalizeAffiliateIncomes(payload.state.affiliateIncomes || []));
    setDashboardSettings({
      includePendingAffiliateInProfit: Boolean(payload.state.dashboardSettings?.includePendingAffiliateInProfit),
    });
    setSnapshots(payload.state.snapshots || []);
    serverVersionRef.current = payload.version || 0;
    setServerVersion(payload.version || 0);
  };

  const acquireEditLock = async ({ silent = false } = {}) => {
    try {
      const res = await fetch('/api/lock/acquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdRef.current,
          clientName: clientNameRef.current,
        }),
      });
      const payload = await res.json();
      const owned = Boolean(payload.granted);
      setEditLock({ owned, lock: payload.lock || null });
      if (!silent) {
        pushToast(owned
          ? { type: 'success', title: 'Đã nhận quyền sửa', message: 'Phiên này đang giữ quyền chỉnh sửa dữ liệu chung.' }
          : { type: 'warning', title: 'Chỉ xem', message: `${payload.lock?.ownerName || 'Thiết bị khác'} đang chỉnh sửa dữ liệu.` }
        );
      }
      return owned;
    } catch (error) {
      console.error('Failed to acquire edit lock:', error);
      return false;
    }
  };

  const releaseEditLock = async ({ silent = false } = {}) => {
    try {
      await fetch('/api/lock/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientIdRef.current }),
        keepalive: true,
      });
    } catch (error) {
      console.error('Failed to release edit lock:', error);
    } finally {
      setEditLock({ owned: false, lock: null });
      if (!silent) {
        pushToast({ type: 'warning', title: 'Đã trả quyền sửa', message: 'Phiên này chuyển sang chế độ chỉ xem.' });
      }
    }
  };

  // Shared server bootstrap. First editor seeds the canonical database from the current browser state.
  useEffectA(() => {
    let cancelled = false;
    const initializeSharedSync = async () => {
      try {
        const res = await fetch('/api/state', { cache: 'no-store' });
        if (!res.ok) throw new Error(`state endpoint returned ${res.status}`);
        let payload = await res.json();
        if (cancelled) return;

        setSyncMode('shared');
        if (payload.initialized) {
          applySharedPayload(payload);
        } else {
          const ownsLock = await acquireEditLock({ silent: true });
          if (ownsLock) {
            const bootstrapRes = await fetch('/api/bootstrap', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: clientIdRef.current,
                state: buildSharedState(units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots),
              }),
            });
            payload = await bootstrapRes.json();
            if (bootstrapRes.ok || bootstrapRes.status === 409) {
              applySharedPayload(payload);
            }
          } else {
            // Another tab is seeding the first canonical database. Stay on the loading
            // screen until that source of truth exists, rather than flashing local-only data.
            for (let attempt = 0; attempt < 20 && !payload.initialized; attempt += 1) {
              await sleep(250);
              payload = await (await fetch('/api/state', { cache: 'no-store' })).json();
            }
            if (!payload.initialized) throw new Error('shared database was not initialized in time');
            applySharedPayload(payload);
          }
        }

        if (!editLock.owned) {
          await acquireEditLock({ silent: true });
        }
        if (!cancelled) setSyncReady(true);
      } catch (error) {
        console.warn('Shared backend unavailable; entering offline read-only mode.', error);
        if (!cancelled) {
          setSyncMode('offline');
          setSyncReady(true);
        }
      }
    };
    initializeSharedSync();
    return () => {
      cancelled = true;
    };
  }, []);

  // Save units to localStorage whenever they change
  useEffectA(() => {
    try {
      localStorage.setItem('nexus_gear_units', JSON.stringify(units));
    } catch (e) {
      console.error('Failed to save units to localStorage:', e);
    }
  }, [units]);

  useEffectA(() => {
    try {
      localStorage.setItem('nexus_gear_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage:', e);
    }
  }, [categories]);

  useEffectA(() => {
    try {
      localStorage.setItem('nexus_gear_product_lines', JSON.stringify(productLines));
    } catch (e) {
      console.error('Failed to save product lines to localStorage:', e);
    }
  }, [productLines]);

  useEffectA(() => {
    try {
      localStorage.setItem('nexus_gear_affiliate_incomes', JSON.stringify(affiliateIncomes));
    } catch (e) {
      console.error('Failed to save affiliate incomes to localStorage:', e);
    }
  }, [affiliateIncomes]);

  useEffectA(() => {
    try {
      localStorage.setItem('nexus_gear_dashboard_settings', JSON.stringify(dashboardSettings));
    } catch (e) {
      console.error('Failed to save dashboard settings to localStorage:', e);
    }
  }, [dashboardSettings]);

  // Save snapshot history to localStorage whenever it changes.
  useEffectA(() => {
    try {
      localStorage.setItem('nexus_gear_snapshots', JSON.stringify(snapshots));
    } catch (e) {
      console.error('Failed to save snapshots to localStorage:', e);
    }
  }, [snapshots]);

  // Persist edits to the canonical server database. Only the lock holder may write.
  useEffectA(() => {
    if (!syncReady || syncMode !== 'shared' || !editLock.owned) return;
    if (suppressRemoteSaveRef.current) {
      suppressRemoteSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            version: serverVersionRef.current,
            state: buildSharedState(units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots),
          }),
        });
        const payload = await res.json();
        if (res.ok) {
          serverVersionRef.current = payload.version || serverVersionRef.current;
          setServerVersion(payload.version);
          return;
        }
        if (res.status === 409) {
          applySharedPayload(payload);
          pushToast({
            type: 'warning',
            title: 'Đã nạp bản mới hơn',
            message: 'Máy chủ có dữ liệu mới hơn; màn hình đã tự đồng bộ lại.',
          });
        }
        if (res.status === 423) {
          setEditLock({ owned: false, lock: payload.lock || null });
          pushToast({
            type: 'warning',
            title: 'Mất quyền sửa',
            message: 'Phiên này không còn giữ khóa chỉnh sửa.',
          });
        }
      } catch (error) {
        console.error('Failed to save shared state:', error);
        pushToast({
          type: 'warning',
          title: 'Chưa đồng bộ',
          message: 'Không gửi được thay đổi lên máy chủ; hãy kiểm tra kết nối.',
        });
      }
    }, 250);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots, syncReady, syncMode, editLock.owned]);

  // View-only clients poll the canonical database so every device sees the same state.
  useEffectA(() => {
    if (!syncReady || syncMode !== 'shared') return;
    const interval = setInterval(async () => {
      try {
        const payload = await (await fetch('/api/state', { cache: 'no-store' })).json();
        setEditLock(prev => ({ owned: prev.owned && payload.lock?.ownerId === clientIdRef.current, lock: payload.lock || null }));
        if (payload.initialized && payload.version > serverVersionRef.current) {
          applySharedPayload(payload);
        }
      } catch (error) {
        console.error('Failed to poll shared state:', error);
      }
    }, SHARED_POLL_MS);
    return () => clearInterval(interval);
  }, [syncReady, syncMode]);

  // The editor refreshes its lease; if the tab disappears, the lock naturally expires.
  useEffectA(() => {
    if (!syncReady || syncMode !== 'shared' || !editLock.owned) return;
    const heartbeat = async () => {
      try {
        const res = await fetch('/api/lock/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId: clientIdRef.current }),
        });
        const payload = await res.json();
        if (!res.ok || !payload.granted) {
          setEditLock({ owned: false, lock: payload.lock || null });
        } else {
          setEditLock({ owned: true, lock: payload.lock || null });
        }
      } catch (error) {
        console.error('Failed to heartbeat edit lock:', error);
      }
    };
    const interval = setInterval(heartbeat, LOCK_HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [syncReady, syncMode, editLock.owned]);

  useEffectA(() => {
    const releaseOnUnload = () => {
      if (!editLock.owned || syncMode !== 'shared') return;
      navigator.sendBeacon?.(
        '/api/lock/release',
        new Blob([JSON.stringify({ clientId: clientIdRef.current })], { type: 'application/json' })
      );
    };
    window.addEventListener('beforeunload', releaseOnUnload);
    return () => window.removeEventListener('beforeunload', releaseOnUnload);
  }, [editLock.owned, syncMode]);

  // Save session to localStorage
  useEffectA(() => {
    if (session) {
      try {
        localStorage.setItem('nexus_gear_session', JSON.stringify(session));
      } catch (e) {
        console.error('Failed to save session:', e);
      }
    }
  }, [session]);

  // Check session timeout every minute
  useEffectA(() => {
    if (DEV_BYPASS_AUTH) return;
    const interval = setInterval(() => {
      if (session && !window.isSessionValid(session)) {
        setSession(null);
        localStorage.removeItem('nexus_gear_session');
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session]);

  // Handle browser back button
  useEffectA(() => {
    const handlePopState = (e) => {
      // Browser back button was clicked
      // Just let React state handle it naturally
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle login
  const handleLogin = (newSession) => {
    setSession(newSession);
    setTab('dashboard'); // Redirect admin to dashboard after login
  };

  // Handle logout
  const handleLogout = () => {
    if (DEV_BYPASS_AUTH) return;
    setSession(null);
    localStorage.removeItem('nexus_gear_session');
    setTab('storefront');
  };

  // Check if user can access a tab
  const canAccess = (tabName) => {
    if (DEV_BYPASS_AUTH) return true;
    if (!session) {
      return tabName === 'storefront'; // Only storefront accessible when not logged in
    }
    return window.hasPermission(session.user.role, tabName);
  };

  const canEditSharedData = syncMode === 'shared' && editLock.owned;
  const ensureCanEdit = () => {
    if (canEditSharedData) return true;
    pushToast({
      type: 'warning',
      title: syncMode === 'offline' ? 'Chưa có máy chủ chung' : 'Chế độ chỉ xem',
      message: syncMode === 'offline'
        ? 'Hãy mở trang qua máy chủ đồng bộ để chỉnh sửa dữ liệu chung.'
        : `${editLock.lock?.ownerName || 'Thiết bị khác'} đang giữ quyền chỉnh sửa.`,
    });
    return false;
  };

  // Wait for initialization before rendering
  if (!initialized || !syncReady) {
    return React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      },
    }, React.createElement('div', null, !syncReady ? 'Đang kết nối dữ liệu chung...' : 'Đang tải...'));
  }

  if (syncMode === 'offline') {
    return (
      <div className="sync-blocked-screen">
        <div className="sync-blocked-card">
          <div className="sync-blocked-kicker">KHÔNG CÓ NGUỒN DỮ LIỆU CHUNG</div>
          <h1>Không mở dữ liệu cục bộ để tránh lệch giữa các thiết bị.</h1>
          <p>Hãy chạy <span className="mono">node server.js</span> rồi truy cập cùng một địa chỉ máy chủ trên mọi trình duyệt.</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login screen
  if (!DEV_BYPASS_AUTH && !session) {
    return React.createElement(window.LoginScreen, { onLogin: handleLogin });
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Sell an in-stock unit — moves it to sold list
  const sellUnit = (id, sell, soldDate, note) => {
    if (!ensureCanEdit()) return;
    setUnits(prev => prev.map(u =>
      u.id === id
        ? { ...u, status: 'sold', sell: +sell, sold: soldDate, note: note ?? u.note }
        : u
    ));
  };

  // Cancel a sale — push back to in-stock
  const cancelSale = (id) => {
    if (!ensureCanEdit()) return;
    setUnits(prev => prev.map(u =>
      u.id === id
        ? { ...u, status: 'in_stock', sell: undefined, sold: undefined }
        : u
    ));
  };

  // Update note on any unit
  const updateNote = (id, note) => {
    if (!canEditSharedData) return;
    setUnits(prev => prev.map(u => u.id === id ? { ...u, note } : u));
  };

  // Update any mutable unit field while preserving identity fields.
  const updateUnit = (id, patch) => {
    if (!ensureCanEdit()) return;
    setUnits(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = {
        ...u,
        ...patch,
        id: u.id,
        transactionCode: u.transactionCode,
      };
      if (next.status === 'in_stock') {
        delete next.sell;
        delete next.sold;
      }
      return next;
    }));
  };

  // Add new unit (Inventory modal)
  const addUnit = (u) => {
    if (!ensureCanEdit()) return;
    const quantity = Math.max(1, Math.floor(+u.quantity || 1));
    const { quantity: _quantity, ...base } = u;
    const rows = Array.from({ length: quantity }, () => ({ ...base, status: 'in_stock' }));
    setUnits(prev => [...buildUnitsWithCodes(rows, prev, 'manual'), ...prev]);
  };

  // Import normalized units from Excel / CSV into the shared data source.
  // in_stock rows appear in Inventory; sold rows appear in Dashboard automatically.
  const importUnits = (rows, options = {}) => {
    if (!ensureCanEdit()) return;
    const catalogLines = window.mergeCatalogWithUnits(productLines, units);
    const normalizedRows = window.attachCatalogRefs(rows, catalogLines);
    setUnits(prev => options.replaceExisting
      ? buildUnitsWithCodes(normalizedRows, [], 'imp')
      : [...buildUnitsWithCodes(normalizedRows, prev, 'imp'), ...prev]
    );
  };

  const addAffiliateIncome = (entry) => {
    if (!ensureCanEdit()) return;
    const amount = Math.max(0, Math.round(+entry.amount || 0));
    if (!amount || !entry.receivedAt) return;
    setAffiliateIncomes(prev => [
      {
        id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        amount,
        receivedAt: entry.receivedAt,
        status: normalizeAffiliateStatus(entry.status),
        note: String(entry.note || '').trim(),
      },
      ...prev,
    ]);
  };

  const updateAffiliateIncome = (id, patch) => {
    if (!ensureCanEdit()) return;
    setAffiliateIncomes(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      return {
        ...entry,
        amount: Math.max(0, Math.round(+patch.amount || 0)),
        receivedAt: patch.receivedAt || entry.receivedAt,
        status: normalizeAffiliateStatus(patch.status),
        note: String(patch.note || '').trim(),
      };
    }));
  };

  const removeAffiliateIncome = (id) => {
    if (!ensureCanEdit()) return;
    setAffiliateIncomes(prev => prev.filter(entry => entry.id !== id));
  };

  const setIncludePendingAffiliateInProfit = (value) => {
    if (!ensureCanEdit()) return;
    setDashboardSettings(prev => ({
      ...prev,
      includePendingAffiliateInProfit: Boolean(value),
    }));
  };

  // Delete a sold record permanently (different from cancel)
  // (cancel returns to stock; delete used by Inventory remove)
  const removeUnit = (id) => {
    if (!ensureCanEdit()) return;
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  const saveSnapshot = (name) => {
    if (!ensureCanEdit()) return;
    setSnapshots(prev => [createSnapshot(units, productLines, categories, affiliateIncomes, dashboardSettings, tab, name), ...prev]);
    pushToast({
      type: 'success',
      title: 'Đã sao lưu',
      message: name?.trim() ? `Đã lưu "${name.trim()}".` : 'Đã lưu trạng thái hiện tại.',
    });
  };

  const restoreSnapshot = (id) => {
    if (!ensureCanEdit()) return;
    const snapshot = snapshots.find(s => s.id === id);
    if (!snapshot) return;

    const safetyCopy = createSnapshot(
      units,
      productLines,
      categories,
      affiliateIncomes,
      dashboardSettings,
      tab,
      makeAutoSnapshotName(snapshot.name),
      'auto'
    );
    setSnapshots(prev => [safetyCopy, ...prev]);
    setUnits(ensureTransactionCodes(snapshot.units || []));
    setCategories(snapshot.categories || categories);
    setProductLines(snapshot.productLines || productLines);
    setAffiliateIncomes(normalizeAffiliateIncomes(snapshot.affiliateIncomes || []));
    setDashboardSettings({
      includePendingAffiliateInProfit: Boolean(snapshot.dashboardSettings?.includePendingAffiliateInProfit),
    });
    setTab(snapshot.tab || 'dashboard');
    pushToast({
      type: 'restore',
      title: 'Đã khôi phục',
      message: `Đã mở lại "${snapshot.name}".`,
    });
  };

  const deleteSnapshots = (ids) => {
    if (!ensureCanEdit()) return;
    const idsSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setSnapshots(prev => prev.filter(s => !idsSet.has(s.id)));
  };

  const addProductLine = (line) => {
    if (!ensureCanEdit()) return;
    setProductLines(prev => prev.some(x => x.id === line.id) ? prev : [...prev, line]);
  };

  const addProductVariant = (line, variant) => {
    if (!ensureCanEdit()) return;
    setProductLines(prev => {
      const existing = prev.find(item => item.id === line.id);
      if (!existing) {
        return [
          ...prev,
          {
            id: line.id,
            cat: line.cat,
            brand: line.brand || '',
            name: line.name,
            variants: [...(line.variants || []), variant],
          },
        ];
      }
      return prev.map(item => (
        item.id === line.id
          ? {
              ...item,
              variants: item.variants.some(v => v.id === variant.id || v.name === variant.name)
                ? item.variants
                : [...item.variants, variant],
            }
          : item
      ));
    });
  };

  const createCategoryFromName = (name) => {
    if (!ensureCanEdit()) return null;
    const trimmedName = String(name || '').trim();
    if (!trimmedName) return null;
    const existing = categories.find(category =>
      category.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) return existing;

    const usedIds = new Set(categories.map(category => category.id));
    const id = makeUniqueCatalogId(catalogEntitySlug(trimmedName), usedIds, 'danh-muc');
    const category = {
      id,
      name: trimmedName,
      color: EXTRA_CATEGORY_COLORS[categories.length % EXTRA_CATEGORY_COLORS.length],
    };
    setCategories(prev => [...prev, category]);
    return category;
  };

  const createProductLineFromName = (name, catId) => {
    if (!ensureCanEdit()) return null;
    const trimmedName = String(name || '').trim();
    if (!trimmedName) return null;
    const safeCat = categories.some(category => category.id === catId)
      ? catId
      : categories[0]?.id || 'accessory';
    const currentCatalog = window.mergeCatalogWithUnits(productLines, units);
    const existing = currentCatalog.find(line =>
      line.cat === safeCat
      && line.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) return existing;

    const usedIds = new Set(currentCatalog.map(line => line.id));
    const id = makeUniqueCatalogId(catalogEntitySlug(trimmedName), usedIds, 'dong-san-pham');
    const line = {
      id,
      cat: safeCat,
      brand: '',
      name: trimmedName,
      variants: [{ id: `${id}-mac-dinh`, name: 'Mặc định' }],
    };
    setProductLines(prev => [...prev, line]);
    return line;
  };

  const createProductVariantFromName = (line, name) => {
    if (!ensureCanEdit()) return null;
    const trimmedName = String(name || '').trim();
    if (!line || !trimmedName) return null;
    const existing = (line.variants || []).find(variant =>
      variant.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) return existing;

    const usedIds = new Set((line.variants || []).map(variant => variant.id));
    const base = `${line.id}-${catalogEntitySlug(trimmedName)}`;
    const variant = {
      id: makeUniqueCatalogId(base, usedIds, `${line.id}-phan-loai`),
      name: trimmedName,
    };
    addProductVariant(line, variant);
    return variant;
  };

  const updateProductLine = (line, patch) => {
    if (!ensureCanEdit()) return;
    const updatedLine = {
      ...line,
      ...patch,
      id: line.id,
      variants: (line.variants || []).map(variant => ({ ...variant })),
    };

    setProductLines(prev => upsertProductLine(prev, updatedLine));
    setUnits(prev => prev.map(unit => {
      const belongsToLine = unit.productLineId === line.id
        || (unit.name === line.name && unit.cat === line.cat);
      return belongsToLine
        ? {
            ...unit,
            productLineId: line.id,
            name: updatedLine.name,
            cat: updatedLine.cat,
          }
        : unit;
    }));
  };

  const updateProductVariant = (line, variant, patch) => {
    if (!ensureCanEdit()) return;
    const updatedLine = {
      ...line,
      variants: (line.variants || []).map(item => (
        item.id === variant.id
          ? { ...item, ...patch, id: item.id }
          : { ...item }
      )),
    };

    setProductLines(prev => upsertProductLine(prev, updatedLine));
    setUnits(prev => prev.map(unit => {
      const belongsToLine = unit.productLineId === line.id
        || (unit.name === line.name && unit.cat === line.cat);
      const belongsToVariant = unit.variantId === variant.id
        || (belongsToLine && (unit.variant || 'Mặc định') === variant.name);
      return belongsToLine && belongsToVariant
        ? {
            ...unit,
            productLineId: line.id,
            variantId: variant.id,
            variant: patch.name ?? variant.name,
          }
        : unit;
    }));
  };

  const inStock = units.filter(u => u.status === 'in_stock');
  const sold = units.filter(u => u.status === 'sold');
  const catalogLines = window.mergeCatalogWithUnits(productLines, units);

  // Calculate remaining session time
  const remainingTime = !DEV_BYPASS_AUTH && session ? Math.ceil((session.expiresAt - Date.now()) / 1000 / 60) : 0;

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <div className="logo-mark">N</div>
          <div className="logo-name">NEXUS<span>GEAR</span></div>
        </div>
        <nav className="tabs">
          <button
            className={`tab ${tab === 'dashboard' ? 'active' : ''} ${!canAccess('dashboard') ? 'disabled' : ''}`}
            onClick={() => canAccess('dashboard') && setTab('dashboard')}
            disabled={!canAccess('dashboard')}
            title={!canAccess('dashboard') ? 'Chỉ admin có thể truy cập' : ''}
          >
            Tổng quan
          </button>
          <button
            className={`tab ${tab === 'inventory' ? 'active' : ''} ${!canAccess('inventory') ? 'disabled' : ''}`}
            onClick={() => canAccess('inventory') && setTab('inventory')}
            disabled={!canAccess('inventory')}
            title={!canAccess('inventory') ? 'Chỉ admin có thể truy cập' : ''}
          >
            Kho hàng
          </button>
          <button
            className={`tab ${tab === 'catalog' ? 'active' : ''} ${!canAccess('catalog') ? 'disabled' : ''}`}
            onClick={() => canAccess('catalog') && setTab('catalog')}
            disabled={!canAccess('catalog')}
            title={!canAccess('catalog') ? 'Chỉ admin có thể truy cập' : ''}
          >
            Danh mục
          </button>
          <button
            className={`tab ${tab === 'storefront' ? 'active' : ''}`}
            onClick={() => setTab('storefront')}
          >
            Cửa hàng
          </button>
        </nav>
        <div className="top-spacer"></div>
        <div className="top-meta">
          <span><span className="live-dot"></span>LIVE</span>
          <span>{new Date(today).toLocaleDateString('vi-VN')}</span>
          <span className={`sync-chip ${syncMode === 'offline' ? 'offline' : canEditSharedData ? 'editor' : 'viewer'}`}>
            {syncMode === 'offline'
              ? 'KHÔNG ĐỒNG BỘ'
              : canEditSharedData
                ? 'ĐANG SỬA'
                : 'CHỈ XEM'}
          </span>
          {DEV_BYPASS_AUTH ? (
            <span style={{ color: 'var(--red)', fontWeight: 800 }}>DEV MODE · FULL ACCESS</span>
          ) : remainingTime > 0 && (
            <span style={{
              fontSize: 11,
              color: remainingTime < 5 ? 'var(--red)' : 'var(--muted)',
              marginLeft: 12,
            }}>
              Session: {remainingTime}m
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <BackupManagerButton
            backups={snapshots}
            units={units}
            readOnly={!canEditSharedData}
            onSave={saveSnapshot}
            onRestore={restoreSnapshot}
            onDelete={deleteSnapshots}
          />
          {syncMode === 'shared' && (
            canEditSharedData ? (
              <button className="ctl ghost" onClick={() => releaseEditLock()}>
                TRẢ QUYỀN SỬA
              </button>
            ) : (
              <button className="ctl ghost" onClick={() => acquireEditLock()}>
                NHẬN QUYỀN SỬA
              </button>
            )
          )}
          <div className="user-chip" title={`${session.user.name}`}>
            {session.user.username.substring(0, 2).toUpperCase()}
          </div>
          {!DEV_BYPASS_AUTH && (
            <button
              className="ctl ghost"
              onClick={handleLogout}
              style={{ fontSize: 12, padding: '6px 12px' }}
              title="Đăng xuất"
            >
              Đăng xuất
            </button>
          )}
        </div>
      </header>

      {!canEditSharedData ? (
        <div className="sync-banner viewer">
          Chế độ chỉ xem · {editLock.lock?.ownerName || 'Thiết bị khác'} đang giữ quyền chỉnh sửa. Dữ liệu vẫn tự đồng bộ từ máy chủ chung.
        </div>
      ) : (
        <div className="sync-banner editor">
          Phiên này đang giữ quyền chỉnh sửa độc quyền. Các thiết bị khác chỉ xem và tự nhận dữ liệu mới.
        </div>
      )}

      <main data-screen-label={
        tab === 'dashboard' ? '01 Dashboard' :
        tab === 'inventory' ? '02 Inventory' :
        tab === 'catalog' ? '03 Catalog' :
        '04 Storefront'
      }>
        {!canAccess(tab) ? (
          <div style={{ padding: '60px 28px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 16, marginBottom: 16 }}>❌ Bạn không có quyền truy cập trang này</div>
            <div style={{ fontSize: 13, marginBottom: 24 }}>Chỉ quản trị viên (admin) mới có thể xem trang này.</div>
            <button className="ctl primary" onClick={() => setTab('storefront')}>
              ← Quay về Cửa hàng
            </button>
          </div>
        ) : (
          <>
            {tab === 'dashboard' && (
              <Dashboard
                units={units}
                sold={sold}
                affiliateIncomes={affiliateIncomes}
                includePendingAffiliateInProfit={dashboardSettings.includePendingAffiliateInProfit}
                catalogLines={catalogLines}
                today={today}
                importUnits={importUnits}
                cancelSale={cancelSale}
                updateNote={updateNote}
                updateUnit={updateUnit}
                onCreateCategory={createCategoryFromName}
                onCreateLine={createProductLineFromName}
                onCreateVariant={createProductVariantFromName}
                onAddAffiliateIncome={addAffiliateIncome}
                onUpdateAffiliateIncome={updateAffiliateIncome}
                onRemoveAffiliateIncome={removeAffiliateIncome}
                onSetIncludePendingAffiliateInProfit={setIncludePendingAffiliateInProfit}
                readOnly={!canEditSharedData}
              />
            )}
            {tab === 'inventory' && (
              <Inventory
                units={units}
                inStock={inStock}
                catalogLines={catalogLines}
                sellUnit={sellUnit}
                updateNote={updateNote}
                updateUnit={updateUnit}
                addUnit={addUnit}
                importUnits={importUnits}
                removeUnit={removeUnit}
                today={today}
                onCreateCategory={createCategoryFromName}
                onCreateLine={createProductLineFromName}
                onCreateVariant={createProductVariantFromName}
                readOnly={!canEditSharedData}
              />
            )}
            {tab === 'catalog' && (
              <Catalog
                productLines={productLines}
                units={units}
                onAddLine={addProductLine}
                onAddVariant={addProductVariant}
                onUpdateLine={updateProductLine}
                onUpdateVariant={updateProductVariant}
                readOnly={!canEditSharedData}
              />
            )}
            {tab === 'storefront' && <Storefront inStock={inStock} />}
          </>
        )}
      </main>
      {toasts.length > 0 && (
        <div className="app-toast-stack">
          {toasts.map(toast => <AppToast key={toast.id} toast={toast} />)}
        </div>
      )}
    </div>
  );
}

function AppToast({ toast }) {
  return (
    <div className={`app-toast ${toast.type}`}>
      <div className="app-toast-icon">{toast.type === 'restore' ? '↺' : toast.type === 'warning' ? '!' : '✓'}</div>
      <div>
        <div className="app-toast-title">{toast.title}</div>
        <div className="app-toast-message">{toast.message}</div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
