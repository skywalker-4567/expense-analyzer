import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/expenses", label: "Expenses" },
  { to: "/budgets", label: "Budgets" },
  { to: "/insights", label: "Insights" },
  { to: "/gmail", label: "Gmail Sync" },
];

export default function Expenses() {
  const { logout } = { logout: () => { localStorage.removeItem("token"); window.location.href = "/login"; } };
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", description: "", expenseDate: new Date().toISOString().slice(0, 10) });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/expenses?page=${page}&size=10&month=${month}`);
      setExpenses(data.content || data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, month]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/expenses", {
        amount: Number(form.amount),
        description: form.description,
        expenseDate: form.expenseDate,
      });
      setShowForm(false);
      setForm({ amount: "", description: "", expenseDate: new Date().toISOString().slice(0, 10) });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>⬡ Expenso</div>
        <nav style={styles.nav}>
          {NAV.map(({ to, label }) => (
            <Link key={to} to={to} style={{ ...styles.navLink, ...(window.location.pathname === to ? styles.navActive : {}) }}>
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} style={styles.logoutBtn}>Sign out</button>
      </aside>

      <main style={styles.main}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Expenses</h1>
            <p style={styles.pageSub}>All your transactions</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="month"
              value={month}
              onChange={(e) => { setMonth(e.target.value); setPage(0); }}
              style={styles.monthInput}
            />
            <button style={styles.addBtn} onClick={() => setShowForm((s) => !s)}>
              {showForm ? "✕ Cancel" : "+ Add Expense"}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div style={styles.formBox}>
            <h3 style={styles.formTitle}>New Expense</h3>
            {error && <div style={styles.errorBox}>{error}</div>}
            <form onSubmit={handleAdd} style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Amount (₹)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  style={styles.input}
                  placeholder="450"
                  required
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={styles.label}>Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  style={styles.input}
                  placeholder="Swiggy order"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
                  style={styles.input}
                  required
                />
              </div>
              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        )}

        {/* Table */}
        <div style={styles.tableBox}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Date", "Description", "Category", "Source", "Amount"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={styles.tdEmpty}>Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} style={styles.tdEmpty}>No expenses for {month}</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} style={styles.tr}>
                    <td style={styles.td}>{e.expenseDate}</td>
                    <td style={styles.td}>{e.description}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{e.category || "—"}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: e.source === "EMAIL" ? "#0e2a2a" : "#1a1a2e", color: e.source === "EMAIL" ? "#34d399" : "#818cf8" }}>
                        {e.source || "MANUAL"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: 700, color: "#818cf8" }}>
                      ₹{Number(e.amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={styles.pagination}>
          <button style={styles.pageBtn} onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            ← Prev
          </button>
          <span style={{ color: "#475569", fontSize: 13 }}>Page {page + 1}</span>
          <button style={styles.pageBtn} onClick={() => setPage((p) => p + 1)} disabled={expenses.length < 10}>
            Next →
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9" },
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
  main: { flex: 1, padding: "40px 48px" },
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
  formBox: { background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 12, padding: 24, marginBottom: 24 },
  formTitle: { margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "#94a3b8" },
  formRow: { display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" },
  label: { color: "#64748b", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 },
  input: {
    background: "#0d0d14", border: "1px solid #1e1e2e", color: "#f1f5f9",
    borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  },
  submitBtn: {
    background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  },
  errorBox: { background: "#2d1a1a", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12 },
  tableBox: { background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0d0d14", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #1e1e2e" },
  tr: { borderBottom: "1px solid #1a1a28", transition: "background 0.1s" },
  td: { padding: "13px 16px", fontSize: 14, color: "#cbd5e1" },
  tdEmpty: { padding: "40px", textAlign: "center", color: "#475569", fontSize: 14 },
  badge: { background: "#1a1a2e", color: "#818cf8", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 },
  pagination: { display: "flex", alignItems: "center", gap: 16, marginTop: 20, justifyContent: "flex-end" },
  pageBtn: { background: "#13131a", border: "1px solid #1e1e2e", color: "#94a3b8", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" },
};