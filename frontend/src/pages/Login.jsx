import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", form);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>⬡ Expenso</div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.sub}>Sign in to track your finances</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            style={styles.input}
            placeholder="you@email.com"
            required
          />
          <label style={styles.label}>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            style={styles.input}
            placeholder="••••••••"
            required
          />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <p style={styles.footer}>
          No account?{" "}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0a0a0f",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: "#13131a",
    border: "1px solid #1e1e2e",
    borderRadius: 16,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 0 60px rgba(99,102,241,0.08)",
  },
  brand: {
    fontSize: 20,
    fontWeight: 700,
    color: "#818cf8",
    marginBottom: 28,
    letterSpacing: "-0.5px",
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: "#f1f5f9",
    letterSpacing: "-0.5px",
  },
  sub: { color: "#64748b", fontSize: 14, marginTop: 6, marginBottom: 28 },
  errorBox: {
    background: "#2d1a1a",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  form: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", marginTop: 10 },
  input: {
    background: "#0d0d14",
    border: "1px solid #1e1e2e",
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: 14,
    padding: "11px 14px",
    outline: "none",
    marginTop: 4,
    transition: "border-color 0.2s",
  },
  btn: {
    marginTop: 20,
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "13px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "-0.2px",
    transition: "background 0.2s",
  },
  footer: { textAlign: "center", color: "#475569", fontSize: 13, marginTop: 20 },
  link: { color: "#818cf8", textDecoration: "none", fontWeight: 600 },
};