(() => {
  const { useState: useStateAuth } = React;

  const DEMO_ACCOUNTS = [
    { username: "admin", password: "admin123", role: "admin", name: "Qu\u1EA3n tr\u1ECB vi\xEAn" },
    { username: "viewer", password: "viewer123", role: "viewer", name: "T\xE0i kho\u1EA3n xem to\xE0n b\u1ED9" },
    { username: "store", password: "store123", role: "storefront", name: "T\xE0i kho\u1EA3n c\u1EEDa h\xE0ng" }
  ];

  const SESSION_DURATION = 30 * 60 * 1e3;

  function LoginScreen({ onLogin }) {
    const [username, setUsername] = useStateAuth("");
    const [password, setPassword] = useStateAuth("");
    const [error, setError] = useStateAuth("");
    const [loading, setLoading] = useStateAuth(false);

    const handleLogin = async (event) => {
      event.preventDefault();
      setError("");
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const account = DEMO_ACCOUNTS.find((item) => item.username === username && item.password === password);
      if (account) {
        onLogin({
          user: {
            username: account.username,
            role: account.role,
            name: account.name
          },
          loginTime: Date.now(),
          expiresAt: Date.now() + SESSION_DURATION
        });
        setUsername("");
        setPassword("");
      } else {
        setError("T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng");
      }
      setLoading(false);
    };

    return React.createElement("div", { style: loginPageStyle },
      React.createElement("div", { style: loginCardStyle },
        React.createElement("div", { style: { textAlign: "center", marginBottom: 32 } },
          React.createElement("div", { style: logoStyle }, "N"),
          React.createElement("h1", { style: { fontSize: 20, fontWeight: 600, margin: "0 0 8px" } }, "NEXUS GEAR"),
          React.createElement("p", { style: { fontSize: 13, color: "var(--muted)", margin: 0 } }, "Qu\u1EA3n l\xFD b\xE1n h\xE0ng")
        ),
        React.createElement("form", { onSubmit: handleLogin },
          React.createElement("div", { style: { marginBottom: 16 } },
            React.createElement("label", { style: labelStyle }, "T\xEAn \u0111\u0103ng nh\u1EADp"),
            React.createElement("input", {
              type: "text",
              value: username,
              onChange: (event) => setUsername(event.target.value),
              placeholder: "admin, viewer hoac store",
              style: inputStyle,
              disabled: loading
            })
          ),
          React.createElement("div", { style: { marginBottom: 24 } },
            React.createElement("label", { style: labelStyle }, "M\u1EADt kh\u1EA9u"),
            React.createElement("input", {
              type: "password",
              value: password,
              onChange: (event) => setPassword(event.target.value),
              placeholder: "Nhap mat khau",
              style: inputStyle,
              disabled: loading
            })
          ),
          error && React.createElement("div", { style: errorStyle }, error),
          React.createElement("button", {
            type: "submit",
            disabled: loading || !username || !password,
            style: {
              ...submitStyle,
              cursor: loading || !username || !password ? "not-allowed" : "pointer",
              opacity: loading || !username || !password ? 0.6 : 1
            }
          }, loading ? "\u0110ang \u0111\u0103ng nh\u1EADp..." : "\u0110\u0103ng nh\u1EADp")
        ),
        React.createElement("div", { style: demoBoxStyle },
          React.createElement("div", { style: { fontWeight: 600, marginBottom: 8, color: "var(--text)" } }, "Demo accounts:"),
          React.createElement("div", { style: { color: "var(--muted)", lineHeight: 1.6 } },
            React.createElement("div", null, React.createElement("strong", null, "Admin:"), " admin / admin123"),
            React.createElement("div", null, React.createElement("strong", null, "Viewer:"), " viewer / viewer123"),
            React.createElement("div", null, React.createElement("strong", null, "Store:"), " store / store123")
          )
        )
      )
    );
  }

  const loginPageStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    fontFamily: "inherit"
  };
  const loginCardStyle = {
    width: "100%",
    maxWidth: 400,
    padding: 32,
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
  };
  const logoStyle = {
    width: 64,
    height: 64,
    backgroundColor: "var(--red)",
    color: "#fff",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
    margin: "0 auto 16px"
  };
  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
    color: "var(--text)"
  };
  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    border: "1px solid var(--border)",
    borderRadius: 6,
    boxSizing: "border-box",
    fontFamily: "inherit"
  };
  const errorStyle = {
    padding: "10px 12px",
    backgroundColor: "#fee",
    border: "1px solid #fcc",
    borderRadius: 6,
    fontSize: 12,
    color: "var(--red)",
    marginBottom: 16
  };
  const submitStyle = {
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "var(--red)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600
  };
  const demoBoxStyle = {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    fontSize: 11
  };

  function isSessionValid(session) {
    if (!session) return false;
    return Date.now() < session.expiresAt;
  }

  function hasPermission(userRole, page) {
    const permissions = {
      dashboard: ["admin", "viewer"],
      inventory: ["admin", "viewer"],
      catalog: ["admin", "viewer"],
      storefront: ["admin", "viewer", "storefront"]
    };
    return permissions[page]?.includes(userRole);
  }

  function canEditData(userRole) {
    return userRole === "admin";
  }

  window.isSessionValid = isSessionValid;
  window.hasPermission = hasPermission;
  window.canEditData = canEditData;
  window.LoginScreen = LoginScreen;
})();
