// Authentication - login screen, session management, permissions

const { useState: useStateAuth } = React;

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Qu\u1ea3n tr\u1ecb vi\u00ean' },
  { username: 'viewer', password: 'viewer123', role: 'viewer', name: 'T\u00e0i kho\u1ea3n xem to\u00e0n b\u1ed9' },
  { username: 'store', password: 'store123', role: 'storefront', name: 'T\u00e0i kho\u1ea3n c\u1eeda h\u00e0ng' },
];

const SESSION_DURATION = 30 * 60 * 1000;

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  const [error, setError] = useStateAuth('');
  const [loading, setLoading] = useStateAuth(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const account = DEMO_ACCOUNTS.find(item => item.username === username && item.password === password);
    if (account) {
      onLogin({
        user: {
          username: account.username,
          role: account.role,
          name: account.name,
        },
        loginTime: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
      });
      setUsername('');
      setPassword('');
    } else {
      setError('T\u00ean \u0111\u0103ng nh\u1eadp ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang');
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: 32,
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64,
            height: 64,
            backgroundColor: 'var(--red)',
            color: '#fff',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            fontWeight: 700,
            margin: '0 auto 16px',
          }}>
            N
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>NEXUS GEAR</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{'Qu\u1ea3n l\u00fd b\u00e1n h\u00e0ng'}</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 8,
              color: 'var(--text)',
            }}>
              {'T\u00ean \u0111\u0103ng nh\u1eadp'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin, viewer hoac store"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 13,
                border: '1px solid var(--border)',
                borderRadius: 6,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 8,
              color: 'var(--text)',
            }}>
              {'M\u1eadt kh\u1ea9u'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhap mat khau"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 13,
                border: '1px solid var(--border)',
                borderRadius: 6,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--red)',
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'var(--red)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
              opacity: loading || !username || !password ? 0.6 : 1,
            }}
          >
            {loading ? '\u0110ang \u0111\u0103ng nh\u1eadp...' : '\u0110\u0103ng nh\u1eadp'}
          </button>
        </form>

        <div style={{
          marginTop: 20,
          padding: 12,
          backgroundColor: '#f9f9f9',
          borderRadius: 6,
          fontSize: 11,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>Demo accounts:</div>
          <div style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            <div><strong>Admin:</strong> admin / admin123</div>
            <div><strong>Viewer:</strong> viewer / viewer123</div>
            <div><strong>Store:</strong> store / store123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function isSessionValid(session) {
  if (!session) return false;
  return Date.now() < session.expiresAt;
}

function hasPermission(userRole, page) {
  const permissions = {
    dashboard: ['admin', 'viewer'],
    inventory: ['admin', 'viewer'],
    catalog: ['admin', 'viewer'],
    storefront: ['admin', 'viewer', 'storefront'],
  };
  return permissions[page]?.includes(userRole);
}

function canEditData(userRole) {
  return userRole === 'admin';
}

window.isSessionValid = isSessionValid;
window.hasPermission = hasPermission;
window.canEditData = canEditData;
window.LoginScreen = LoginScreen;
