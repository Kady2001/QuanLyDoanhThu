// Authentication — login screen, session management, permissions

const { useState: useStateAuth, useEffect: useEffectAuth } = React;

// Demo accounts (no real auth yet — just for demo)
const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Quản trị viên' },
  { username: 'staff', password: 'staff123', role: 'staff', name: 'Nhân viên' },
];

// Session duration: 30 minutes
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useStateAuth('');
  const [password, setPassword] = useStateAuth('');
  const [error, setError] = useStateAuth('');
  const [loading, setLoading] = useStateAuth(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate auth delay
    await new Promise(r => setTimeout(r, 500));

    const account = DEMO_ACCOUNTS.find(a => a.username === username && a.password === password);
    if (account) {
      const session = {
        user: {
          username: account.username,
          role: account.role,
          name: account.name,
        },
        loginTime: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
      };
      onLogin(session);
      setUsername('');
      setPassword('');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
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
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Quản lý bán hàng</p>
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
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin hoặc staff"
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
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
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
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
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
            <div><strong>Staff:</strong> staff / staff123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Check if session is still valid
function isSessionValid(session) {
  if (!session) return false;
  return Date.now() < session.expiresAt;
}

// Check if user can access a page
function hasPermission(userRole, page) {
  const permissions = {
    dashboard: ['admin'],
    inventory: ['admin'],
    catalog: ['admin'],
    storefront: ['admin', 'staff'], // Everyone can access storefront
  };
  return permissions[page]?.includes(userRole);
}

window.isSessionValid = isSessionValid;
window.hasPermission = hasPermission;
window.LoginScreen = LoginScreen;
