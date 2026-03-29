import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/budgets", label: "Budgets" },
  { to: "/insights", label: "Insights" },
  { to: "/gmail", label: "Gmail Sync" },
];

const CATEGORIES = [
  "Food", "Travel", "Shopping", "Entertainment",
  "Health", "Utilities", "Education", "Other",
];

export default function Budgets() {
  const location = useLocation();
  const logout = () => { localStorage.removeItem("token"); window.location.href = "/login"; };

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "", limitAmount: "", month: new Date().toISOString().slice(0, 7) });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/budgets?month=${month}`);
      setBudgets(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBudgets(); }, [month]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/budgets", {
        category: form.category,
        limitAmount: Number(form.limitAmount),
        month: form.month,
      });
      setShowForm(false);
      setForm({ category: "", limitAmount: "", month: new Date().toISOString().slice(0, 7) });
      showToast("Budget created!");
      if (form.month === month) loadBudgets();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create budget");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>⬡ Expenso</div>
        <nav style={styles.nav}>
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{ ...styles.navLink, ...(location.pathname === to ? styles.navActive : {}) }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>Sign out</button>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* Toast */}
        {toast && (
          <div style={{ ...styles.toast, ...(toast.type === "error" ? styles.toastError : {}) }}>
            {toast.type === "success" ? "✓" : "✕"} {toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Budgets</h1>
            <p style={styles.pageSub}>Set monthly spending limits per category</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={styles.monthInput}
            />
            <button style={styles.addBtn} onClick={() => setShowForm((s) => !s)}>
              {showForm ? "✕ Cancel" : "+ New Budget"}
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>Create Budget</h3>
            {error && <div style={styles.errorBox}>{error}</div>}
            <form onSubmit={handleSubmit} style={styles.formRow}>
              {/* Category */}
              <div style={styles.field}>
                <label style={styles.label}>Category</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  style={styles.input}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Limit */}
              <div style={styles.field}>
                <label style={styles.label}>Limit Amount (₹)</label>
                <input
                  name="limitAmount"
                  type="number"
                  min="1"
                  value={form.limitAmount}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="4000"
                  required
                />
              </div>

              {/* Month */}
              <div style={styles.field}>
                <label style={styles.label}>Month</label>
                <input
                  name="month"
                  type="month"
                  value={form.month}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? "Saving..." : "Save Budget"}
              </button>
            </form>
          </div>
        )}

        {/* Budget cards */}
        {loading ? (
          <div style={styles.empty}>Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>📊</div>
            <div style={styles.emptyTitle}>No budgets for {month}</div>
            <div style={styles.emptySub}>
              Create a budget to start tracking your spending limits.
            </div>
          </div>
        ) : (
          <div style={styles.grid}>
            {budgets.map((b) => (
              <BudgetCard key={b.id} budget={b} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function BudgetCard({ budget }) {
  const CATEGORY_COLORS = {
    Food: "#f59e0b", Travel: "#22d3ee", Shopping: "#f43f5e",
    Entertainment: "#a78bfa", Health: "#10b981", Utilities: "#6366f1",
    Education: "#818cf8", Other: "#64748b",
  };

  const accent = CATEGORY_COLORS[budget.category] || "#6366f1";

  return (
    <div style={{ ...cardStyles.card, borderTop: `3px solid ${accent}` }}>
      <div style={cardStyles.top}>
        <div style={{ ...cardStyles.categoryDot, background: accent + "22", color: accent }}>
          {budget.category}
        </div>
        <div style={cardStyles.month}>{budget.month}</div>
      </div>
      <div style={cardStyles.limit}>
        ₹{Number(budget.limitAmount).toLocaleString()}
      </div>
      <div style={cardStyles.limitLabel}>monthly limit</div>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex", minHeight: "100vh", background: "#0a0a0f",
    fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9",
  },
  sidebar: {
    width: 220, background: "#0d0d14", borderRight: "1px solid #1e1e2e",
    display: "flex", flexDirection: "column", padding: "32px 20px",
    position: "sticky", top: 0, height: "100vh",
  },
  brand: { fontSize: 20, fontWeight: 700, color: "#818cf8", marginBottom: 40, letterSpacing: "-0.5px" },
  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navLink: { color: "#64748b", textDecoration: "none", fontSize: 14, fontWeight: 500, padding: "9px 12px", borderRadius: 8 },
  navActive: { color: "#f1f5f9", background: "#1e1e2e" },
  logoutBtn: { background: "transparent", border: "1px solid #1e1e2e", color: "#475569", borderRadius: 8, padding: 9, fontSize: 13, cursor: "pointer" },
  main: { flex: 1, padding: "40px 48px", position: "relative" },
  toast: {
    position: "fixed", top: 24, right: 24, background: "#0d2b1e",
    border: "1px solid #166534", color: "#4ade80", borderRadius: 10,
    padding: "12px 20px", fontSize: 14, fontWeight: 600, zIndex: 999,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  toastError: { background: "#2d1a1a", border: "1px solid #7f1d1d", color: "#fca5a5" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
  pageTitle: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" },
  pageSub: { color: "#475569", fontSize: 14, margin: "4px 0 0" },
  monthInput: {
    background: "#13131a", border: "1px solid #1e1e2e", color: "#94a3b8",
    borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none",
  },
  addBtn: {
    background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  },
  formBox: {
    background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 12,
    padding: "24px", marginBottom: 28,
  },
  formTitle: { margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#94a3b8" },
  formRow: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", flex: 1, minWidth: 160 },
  label: { color: "#64748b", fontSize: 12, fontWeight: 600, marginBottom: 4, letterSpacing: "0.4px" },
  input: {
    background: "#0d0d14", border: "1px solid #1e1e2e", color: "#f1f5f9",
    borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none",
    width: "100%", boxSizing: "border-box",
  },
  submitBtn: {
    background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    whiteSpace: "nowrap", alignSelf: "flex-end",
  },
  errorBox: {
    background: "#2d1a1a", border: "1px solid #7f1d1d", color: "#fca5a5",
    padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 16,
  },
  empty: { color: "#475569", textAlign: "center", padding: "60px 0", fontSize: 14 },
  emptyCard: {
    background: "#13131a", border: "1px dashed #1e1e2e", borderRadius: 14,
    padding: "60px 24px", textAlign: "center",
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#475569", maxWidth: 320, margin: "0 auto" },
};

const cardStyles = {
  card: {
    background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 12,
    padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8,
  },
  top: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  categoryDot: {
    fontSize: 12, fontWeight: 700, padding: "4px 10px",
    borderRadius: 20, letterSpacing: "0.3px",
  },
  month: { fontSize: 12, color: "#475569" },
  limit: { fontSize: 30, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.5px", marginTop: 8 },
  limitLabel: { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" },
};