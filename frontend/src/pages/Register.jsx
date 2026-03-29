import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/register", form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>⬡ Expenso</div>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.sub}>Start tracking smarter</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { name: "name", type: "text", placeholder: "Your name", label: "Full Name" },
            { name: "email", type: "email", placeholder: "you@email.com", label: "Email" },
            { name: "password", type: "password", placeholder: "••••••••", label: "Password" },
          ].map(({ name, type, placeholder, label }) => (
            <div key={name}>
              <label style={styles.label}>{label}</label>
              <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                style={styles.input}
                placeholder={placeholder}
                required
              />
            </div>
          ))}
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Creating..." : "Create Account →"}
          </button>
        </form>

        <p style={styles.footer}>
          Already registered?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
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
  brand: { fontSize: 20, fontWeight: 700, color: "#818cf8", marginBottom: 28, letterSpacing: "-0.5px" },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px" },
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
  label: { color: "#94a3b8", fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", display: "block", marginBottom: 4, marginTop: 10 },
  input: {
    background: "#0d0d14",
    border: "1px solid #1e1e2e",
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: 14,
    padding: "11px 14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
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
  },
  footer: { textAlign: "center", color: "#475569", fontSize: 13, marginTop: 20 },
  link: { color: "#818cf8", textDecoration: "none", fontWeight: 600 },
};