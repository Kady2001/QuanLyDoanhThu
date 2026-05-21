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
    if (existing.length) {
      return existing.map(line => ({
        ...line,
        variants: (line.variants || []).map(variant => ({ ...variant })),
      }));
    }
    return window.INITIAL_PRODUCT_LINES.map(line => ({
      ...line,
      variants: (line.variants || []).map(variant => ({ ...variant })),
    }));
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
    const validExisting = existing.filter(category => category?.id && category?.name);
    return validExisting.length ? validExisting.map(category => ({ ...category })) : initial;
  } catch (e) {
    console.error('Failed to load categories from localStorage:', e);
    return (window.INITIAL_CATEGORIES || window.CATEGORIES || []).map(category => ({ ...category }));
  }
}

function loadUnits() {
  try {
    const saved = localStorage.getItem('nexus_gear_units');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    return ensureTransactionCodes(window.INITIAL_UNITS.map(unit => ({ ...unit })));
  } catch (e) {
    console.error('Failed to load units from localStorage:', e);
    return ensureTransactionCodes(window.INITIAL_UNITS.map(unit => ({ ...unit })));
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
    units: units.map(u => ({ ...u })),
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


function capitalizeWordInitials(value) {
  return String(value || '').replace(/(^|\s)(\S)/gu, (match, space, firstChar) => `${space}${firstChar.toLocaleUpperCase('vi-VN')}`);
}

function normalizeUnitText(unit) {
  return {
    ...unit,
    name: capitalizeWordInitials(unit.name),
    variant: capitalizeWordInitials(unit.variant),
    note: capitalizeWordInitials(unit.note),
  };
}

function normalizeProductLineText(line) {
  return {
    ...line,
    name: capitalizeWordInitials(line.name),
    variants: (line.variants || []).map(variant => ({
      ...variant,
      name: capitalizeWordInitials(variant.name),
    })),
  };
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

const UNIT_HISTORY_FIELDS = [
  { key: 'productLineId', label: 'D\u00f2ng s\u1ea3n ph\u1ea9m' },
  { key: 'variantId', label: 'Ph\u00e2n lo\u1ea1i' },
  { key: 'name', label: 'T\u00ean s\u1ea3n ph\u1ea9m' },
  { key: 'cat', label: 'Danh m\u1ee5c' },
  { key: 'variant', label: 'T\u00ean ph\u00e2n lo\u1ea1i' },
  { key: 'buy', label: 'Gi\u00e1 mua' },
  { key: 'expectedSell', label: 'Gi\u00e1 b\u00e1n d\u1ef1 ki\u1ebfn' },
  { key: 'arrived', label: 'Ng\u00e0y nh\u1eadp' },
  { key: 'status', label: 'Tr\u1ea1ng th\u00e1i' },
  { key: 'sell', label: 'Gi\u00e1 b\u00e1n th\u1ef1c t\u1ebf' },
  { key: 'sold', label: 'Ng\u00e0y b\u00e1n' },
  { key: 'note', label: 'Ghi ch\u00fa' },
];

function unitHistoryValue(value) {
  if (value === undefined || value === null || value === '') return '\u2014';
  if (value === 'in_stock') return 'T\u1ed3n kho';
  if (value === 'sold') return '\u0110\u00e3 b\u00e1n';
  return String(value);
}

function buildUnitHistoryEntries(before, after, action, changedAt = new Date().toISOString()) {
  return UNIT_HISTORY_FIELDS
    .filter(field => before?.[field.key] !== after?.[field.key])
    .map(field => ({
      id: `hist_${Date.now()}_${field.key}_${Math.random().toString(36).slice(2, 7)}`,
      unitId: after.id,
      transactionCode: after.transactionCode,
      productName: after.name,
      action,
      field: field.key,
      fieldLabel: field.label,
      before: unitHistoryValue(before?.[field.key]),
      after: unitHistoryValue(after?.[field.key]),
      changedAt,
    }));
}

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
    units: units.map(unit => ({ ...unit })),
    productLines: productLines.map(line => cloneProductLine(line)),
    categories: categories.map(category => ({ ...category })),
    affiliateIncomes: normalizeAffiliateIncomes(affiliateIncomes).map(entry => ({ ...entry })),
    dashboardSettings: {
      includePendingAffiliateInProfit: Boolean(dashboardSettings?.includePendingAffiliateInProfit),
    },
    snapshots: snapshots.map(snapshot => ({
      ...snapshot,
      units: (snapshot.units || []).map(unit => ({ ...unit })),
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
  const [unitChangeHistory, setUnitChangeHistory] = useStateA([]);
  const [showUnitHistory, setShowUnitHistory] = useStateA(false);
  const historyStartedAtRef = useRefA(new Date().toISOString());
  const clientIdRef = useRefA(getOrCreateClientId());
  const clientNameRef = useRefA(makeClientName(clientIdRef.current));
  const suppressRemoteSaveRef = useRefA(false);
  const saveTimerRef = useRefA(null);
  const serverVersionRef = useRefA(0);
  const localSaveReadyRef = useRefA({ units: false, categories: false, productLines: false, affiliateIncomes: false, dashboardSettings: false, snapshots: false });
  const userDataDirtyRef = useRefA(false);
  window.CATEGORIES = categories;
  const markUserDataChanged = () => { userDataDirtyRef.current = true; };

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
    setUnits((payload.state.units || []).map(unit => ({ ...unit })));
    setProductLines((payload.state.productLines || []).map(line => cloneProductLine(line)));
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
    if (!localSaveReadyRef.current.units) {
      localSaveReadyRef.current.units = true;
      return;
    }
    try {
      localStorage.setItem('nexus_gear_units', JSON.stringify(units));
    } catch (e) {
      console.error('Failed to save units to localStorage:', e);
    }
  }, [units]);

  useEffectA(() => {
    if (!localSaveReadyRef.current.categories) {
      localSaveReadyRef.current.categories = true;
      return;
    }
    try {
      localStorage.setItem('nexus_gear_categories', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage:', e);
    }
  }, [categories]);

  useEffectA(() => {
    if (!localSaveReadyRef.current.productLines) {
      localSaveReadyRef.current.productLines = true;
      return;
    }
    try {
      localStorage.setItem('nexus_gear_product_lines', JSON.stringify(productLines));
    } catch (e) {
      console.error('Failed to save product lines to localStorage:', e);
    }
  }, [productLines]);

  useEffectA(() => {
    if (!localSaveReadyRef.current.affiliateIncomes) {
      localSaveReadyRef.current.affiliateIncomes = true;
      return;
    }
    try {
      localStorage.setItem('nexus_gear_affiliate_incomes', JSON.stringify(affiliateIncomes));
    } catch (e) {
      console.error('Failed to save affiliate incomes to localStorage:', e);
    }
  }, [affiliateIncomes]);

  useEffectA(() => {
    if (!localSaveReadyRef.current.dashboardSettings) {
      localSaveReadyRef.current.dashboardSettings = true;
      return;
    }
    try {
      localStorage.setItem('nexus_gear_dashboard_settings', JSON.stringify(dashboardSettings));
    } catch (e) {
      console.error('Failed to save dashboard settings to localStorage:', e);
    }
  }, [dashboardSettings]);

  // Save snapshot history to localStorage whenever it changes.
  useEffectA(() => {
    if (!localSaveReadyRef.current.snapshots) {
      localSaveReadyRef.current.snapshots = true;
      return;
    }
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
    if (!userDataDirtyRef.current) return;
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
          userDataDirtyRef.current = false;
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
    if (canEditSharedData) {
      markUserDataChanged();
      return true;
    }
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
    setUnits(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = { ...u, status: 'sold', sell: +sell, sold: soldDate, note: capitalizeWordInitials(note ?? u.note) };
      appendUnitHistory(buildUnitHistoryEntries(u, next, 'Ghi\u0020nh\u1eadn\u0020b\u00e1n\u0020h\u00e0ng'));
      return next;
    }));
  };

  const appendUnitHistory = (entries) => {
    if (!entries.length) return;
    setUnitChangeHistory(prev => {
      const next = [...prev];
      entries.forEach(entry => {
        const last = next[next.length - 1];
        const nearSameEdit = last
          && last.transactionCode === entry.transactionCode
          && last.field === entry.field
          && new Date(entry.changedAt) - new Date(last.changedAt) < 1500;
        if (nearSameEdit) {
          next[next.length - 1] = { ...entry, id: last.id, before: last.before };
        } else {
          next.push(entry);
        }
      });
      return next;
    });
  };

  // Cancel a sale ? push back to in-stock
  const cancelSale = (id, action = 'Hu\u1ef7\u0020giao\u0020d\u1ecbch\u0020b\u00e1n') => {
    if (!ensureCanEdit()) return;
    setUnits(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = { ...u, status: 'in_stock', sell: undefined, sold: undefined };
      appendUnitHistory(buildUnitHistoryEntries(u, next, action));
      return next;
    }));
  };

  // Update note on any unit
  const updateNote = (id, note, action = 'S\u1eeda\u0020ghi\u0020ch\u00fa') => {
    if (!canEditSharedData) return;
    setUnits(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = { ...u, note: capitalizeWordInitials(note) };
      appendUnitHistory(buildUnitHistoryEntries(u, next, action));
      return next;
    }));
  };

  // Update any mutable unit field while preserving identity fields.
  const updateUnit = (id, patch, action = 'S\u1eeda\u0020giao\u0020d\u1ecbch') => {
    if (!ensureCanEdit()) return;
    setUnits(prev => prev.map(u => {
      if (u.id !== id) return u;
      const next = {
        ...u,
        ...patch,
        note: patch.note === undefined ? u.note : capitalizeWordInitials(patch.note),
        id: u.id,
        transactionCode: u.transactionCode,
      };
      if (next.status === 'in_stock') {
        delete next.sell;
        delete next.sold;
      }
      appendUnitHistory(buildUnitHistoryEntries(u, next, action));
      return next;
    }));
  };

  // Add new unit (Inventory modal)
  const addUnit = (u) => {
    if (!ensureCanEdit()) return;
    const quantity = Math.max(1, Math.floor(+u.quantity || 1));
    const { quantity: _quantity, ...base } = u;
    const rows = Array.from({ length: quantity }, () => normalizeUnitText({ ...base, status: 'in_stock' }));
    setUnits(prev => {
      const createdRows = buildUnitsWithCodes(rows, prev, 'manual');
      appendUnitHistory(createdRows.flatMap(unit => buildUnitHistoryEntries({}, unit, 'Nh\u1eadp\u0020h\u00e0ng\u0020m\u1edbi')));
      return [...createdRows, ...prev];
    });
  };

  // Import normalized units from Excel / CSV into the shared data source.
  // in_stock rows appear in Inventory; sold rows appear in Dashboard automatically.
  const importUnits = (rows, options = {}) => {
    if (!ensureCanEdit()) return;
    const catalogLines = window.mergeCatalogWithUnits(productLines, units);
    const normalizedRows = window.attachCatalogRefs(rows, catalogLines).map(unit => normalizeUnitText(unit));
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
    setUnits((snapshot.units || []).map(unit => ({ ...unit })));
    setCategories(snapshot.categories || categories);
    setProductLines((snapshot.productLines || productLines).map(line => cloneProductLine(line)));
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

  const deleteProductLine = (line) => {
    if (!ensureCanEdit()) return;
    const hasTransactions = units.some(unit =>
      unit.productLineId === line.id || (unit.name === line.name && unit.cat === line.cat)
    );
    if (hasTransactions) {
      pushToast({
        type: 'warning',
        title: 'Chưa thể xóa dòng sản phẩm',
        message: 'Dòng này đã có giao dịch trong kho hoặc lịch sử bán.',
      });
      return;
    }
    setProductLines(prev => prev.filter(item => item.id !== line.id));
  };

  const deleteProductVariant = (line, variant) => {
    if (!ensureCanEdit()) return;
    const hasTransactions = units.some(unit => {
      const belongsToLine = unit.productLineId === line.id
        || (unit.name === line.name && unit.cat === line.cat);
      const belongsToVariant = unit.variantId === variant.id
        || (belongsToLine && (unit.variant || '\u004d\u1eb7\u0063 \u0111\u1ecb\u006e\u0068') === variant.name);
      return belongsToLine && belongsToVariant;
    });
    if (hasTransactions) {
      pushToast({
        type: 'warning',
        title: 'Chưa thể xóa phân loại',
        message: 'Phân loại này đã có giao dịch trong kho hoặc lịch sử bán.',
      });
      return;
    }
    const updatedLine = {
      ...line,
      variants: (line.variants || []).filter(item => item.id !== variant.id),
    };
    setProductLines(prev => upsertProductLine(prev, updatedLine));
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
    const trimmedName = capitalizeWordInitials(String(name || '').trim());
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
    const trimmedName = capitalizeWordInitials(String(name || '').trim());
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
      name: patch.name === undefined ? line.name : capitalizeWordInitials(patch.name),
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
          ? { ...item, ...patch, name: patch.name === undefined ? item.name : capitalizeWordInitials(patch.name), id: item.id }
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
            variant: patch.name === undefined ? variant.name : capitalizeWordInitials(patch.name),
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
          <button className="ctl ghost history-open-btn" onClick={() => setShowUnitHistory(true)}>
            {'LỊCH SỬ SỬA ĐỔI'}
          </button>
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
                cancelSale={(id) => cancelSale(id, 'Hu\u1ef7\u0020giao\u0020d\u1ecbch\u0020\u1edf\u0020b\u1ea3ng\u0020b\u00e1n')}
                updateNote={(id, note) => updateNote(id, note, 'S\u1eeda\u0020ghi\u0020ch\u00fa\u0020\u1edf\u0020b\u1ea3ng\u0020b\u00e1n')}
                updateUnit={(id, patch) => updateUnit(id, patch, 'S\u1eeda\u0020giao\u0020d\u1ecbch\u0020\u1edf\u0020b\u1ea3ng\u0020b\u00e1n')}
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
                updateNote={(id, note) => updateNote(id, note, 'S\u1eeda\u0020ghi\u0020ch\u00fa\u0020\u1edf\u0020kho')}
                updateUnit={(id, patch) => updateUnit(id, patch, 'S\u1eeda\u0020giao\u0020d\u1ecbch\u0020\u1edf\u0020kho')}
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
                onDeleteLine={deleteProductLine}
                onDeleteVariant={deleteProductVariant}
                readOnly={!canEditSharedData}
              />
            )}
            {tab === 'storefront' && <Storefront inStock={inStock} />}
          </>
        )}
      </main>
      {showUnitHistory && (
        <UnitChangeHistoryModal
          entries={unitChangeHistory}
          startedAt={historyStartedAtRef.current}
          onClose={() => setShowUnitHistory(false)}
        />
      )}
      {toasts.length > 0 && (
        <div className="app-toast-stack">
          {toasts.map(toast => <AppToast key={toast.id} toast={toast} />)}
        </div>
      )}
    </div>
  );
}

function UnitChangeHistoryModal({ entries, startedAt, onClose }) {
  const [search, setSearch] = useStateA('');
  const [actionFilter, setActionFilter] = useStateA('all');
  const [fieldFilter, setFieldFilter] = useStateA('all');
  const actions = [...new Set(entries.map(entry => entry.action).filter(Boolean))];
  const fields = [...new Set(entries.map(entry => entry.fieldLabel).filter(Boolean))];
  const query = search.trim().toLowerCase();
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !query || [entry.transactionCode, entry.productName, entry.action, entry.fieldLabel, entry.before, entry.after]
      .some(value => String(value || '').toLowerCase().includes(query));
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const matchesField = fieldFilter === 'all' || entry.fieldLabel === fieldFilter;
    return matchesSearch && matchesAction && matchesField;
  });

  return (
    <div className="modal-bg history-modal-bg" onClick={onClose}>
      <div className="modal history-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title"><span className="accent"></span>{'LỊCH SỬ SỬA ĐỔI PHIÊN HIỆN TẠI'}</div>
            <div className="card-sub">
              {'Theo dõi từ lúc tải dữ liệu '} {startedAt ? new Date(startedAt).toLocaleString('vi-VN') : ''}
            </div>
          </div>
          <button className="close-x" onClick={onClose}>{'\u00d7'}</button>
        </div>
        <div className="history-filterbar">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm mã GD, sản phẩm, giá trị..." />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="all">Tất cả hành động</option>
            {actions.map(action => <option key={action} value={action}>{action}</option>)}
          </select>
          <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}>
            <option value="all">Tất cả trường</option>
            {fields.map(field => <option key={field} value={field}>{field}</option>)}
          </select>
          <span className="history-count mono">{filteredEntries.length}/{entries.length}</span>
        </div>
        <div className="modal-body history-modal-body">
          <div className="tbl-wrap history-modal-table-wrap">
            <table className="tbl change-history-table">
              <thead>
                <tr>
                  <th>Thời điểm</th>
                  <th>Hành động</th>
                  <th>Mã GD</th>
                  <th>Sản phẩm</th>
                  <th>Trường thay đổi</th>
                  <th>Giá trị cũ</th>
                  <th>Giá trị mới</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries
                  .slice()
                  .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                  .map(entry => (
                    <tr key={entry.id}>
                      <td className="mono" style={{ fontSize: 12 }}>{new Date(entry.changedAt).toLocaleString('vi-VN')}</td>
                      <td><span className="history-action">{entry.action}</span></td>
                      <td className="mono txn-code">{entry.transactionCode}</td>
                      <td>{entry.productName}</td>
                      <td>{entry.fieldLabel}</td>
                      <td className="history-before">{entry.before}</td>
                      <td className="history-after">{entry.after}</td>
                    </tr>
                  ))}
                {filteredEntries.length === 0 && (
                  <tr><td colSpan="7" className="empty">Không có lịch sử phù hợp với bộ lọc hiện tại.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
