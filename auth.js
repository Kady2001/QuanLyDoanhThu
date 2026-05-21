(() => {
  const { useState: useStateAuth, useEffect: useEffectAuth } = React;
  const DEMO_ACCOUNTS = [
    { username: "admin", password: "admin123", role: "admin", name: "Qu\u1EA3n tr\u1ECB vi\xEAn" },
    { username: "staff", password: "staff123", role: "staff", name: "Nh\xE2n vi\xEAn" }
  ];
  const SESSION_DURATION = 30 * 60 * 1e3;
  function LoginScreen({ onLogin }) {
    const [username, setUsername] = useStateAuth("");
    const [password, setPassword] = useStateAuth("");
    const [error, setError] = useStateAuth("");
    const [loading, setLoading] = useStateAuth(false);
    const handleLogin = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);
      await new Promise((r) => setTimeout(r, 500));
      const account = DEMO_ACCOUNTS.find((a) => a.username === username && a.password === password);
      if (account) {
        const session = {
          user: {
            username: account.username,
            role: account.role,
            name: account.name
          },
          loginTime: Date.now(),
          expiresAt: Date.now() + SESSION_DURATION
        };
        onLogin(session);
        setUsername("");
        setPassword("");
      } else {
        setError("T\xEAn \u0111\u0103ng nh\u1EADp ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng");
      }
      setLoading(false);
    };
    return /* @__PURE__ */ React.createElement("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#f5f5f5",
      fontFamily: "inherit"
    } }, /* @__PURE__ */ React.createElement("div", { style: {
      width: "100%",
      maxWidth: 400,
      padding: 32,
      backgroundColor: "#fff",
      borderRadius: 12,
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
    } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 32 } }, /* @__PURE__ */ React.createElement("div", { style: {
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
    } }, "N"), /* @__PURE__ */ React.createElement("h1", { style: { fontSize: 20, fontWeight: 600, margin: "0 0 8px" } }, "NEXUS GEAR"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 13, color: "var(--muted)", margin: 0 } }, "Qu\u1EA3n l\xFD b\xE1n h\xE0ng")), /* @__PURE__ */ React.createElement("form", { onSubmit: handleLogin }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("label", { style: {
      display: "block",
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 8,
      color: "var(--text)"
    } }, "T\xEAn \u0111\u0103ng nh\u1EADp"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: username,
        onChange: (e) => setUsername(e.target.value),
        placeholder: "admin ho\u1EB7c staff",
        style: {
          width: "100%",
          padding: "10px 12px",
          fontSize: 13,
          border: "1px solid var(--border)",
          borderRadius: 6,
          boxSizing: "border-box",
          fontFamily: "inherit"
        },
        disabled: loading
      }
    )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 24 } }, /* @__PURE__ */ React.createElement("label", { style: {
      display: "block",
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 8,
      color: "var(--text)"
    } }, "M\u1EADt kh\u1EA9u"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "password",
        value: password,
        onChange: (e) => setPassword(e.target.value),
        placeholder: "Nh\u1EADp m\u1EADt kh\u1EA9u",
        style: {
          width: "100%",
          padding: "10px 12px",
          fontSize: 13,
          border: "1px solid var(--border)",
          borderRadius: 6,
          boxSizing: "border-box",
          fontFamily: "inherit"
        },
        disabled: loading
      }
    )), error && /* @__PURE__ */ React.createElement("div", { style: {
      padding: "10px 12px",
      backgroundColor: "#fee",
      border: "1px solid #fcc",
      borderRadius: 6,
      fontSize: 12,
      color: "var(--red)",
      marginBottom: 16
    } }, error), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "submit",
        disabled: loading || !username || !password,
        style: {
          width: "100%",
          padding: "10px 16px",
          backgroundColor: "var(--red)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: loading || !username || !password ? "not-allowed" : "pointer",
          opacity: loading || !username || !password ? 0.6 : 1
        }
      },
      loading ? "\u0110ang \u0111\u0103ng nh\u1EADp..." : "\u0110\u0103ng nh\u1EADp"
    )), /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 20,
      padding: 12,
      backgroundColor: "#f9f9f9",
      borderRadius: 6,
      fontSize: 11
    } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 8, color: "var(--text)" } }, "Demo accounts:"), /* @__PURE__ */ React.createElement("div", { style: { color: "var(--muted)", lineHeight: 1.6 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Admin:"), " admin / admin123"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("strong", null, "Staff:"), " staff / staff123")))));
  }
  function isSessionValid(session) {
    if (!session) return false;
    return Date.now() < session.expiresAt;
  }
  function hasPermission(userRole, page) {
    const permissions = {
      dashboard: ["admin"],
      inventory: ["admin"],
      catalog: ["admin"],
      storefront: ["admin", "staff"]
      // Everyone can access storefront
    };
    return permissions[page]?.includes(userRole);
  }
  window.isSessionValid = isSessionValid;
  window.hasPermission = hasPermission;
  window.LoginScreen = LoginScreen;
})();
