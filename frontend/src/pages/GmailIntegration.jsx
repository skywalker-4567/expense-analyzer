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

export default function GmailIntegration() {
  const location = useLocation();
  const logout = () => { localStorage.removeItem("token"); window.location.href = "/login"; };

  const [emailExpenses, setEmailExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [converting, setConverting] = useState(null); // id being converted
  const [toast, setToast] = useState(null); // { msg, type }
  const [gmailConnected, setGmailConnected] = useState(
    () => localStorage.getItem("gmail_connected") === "true"
  );

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle OAuth callback — ?gmail=connected in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("gmail") === "connected") {
      localStorage.setItem("gmail_connected", "true");
      setGmailConnected(true);
      showToast("Gmail connected successfully!");
      window.history.replaceState({}, "", "/gmail");
    }
  }, [location.search]);

  // Load existing email expenses on mount
  useEffect(() => {
    loadEmailExpenses();
  }, []);

  const loadEmailExpenses = async () => {
    setLoading(true);
    try {
      // Backend returns email_expenses for this user
      const { data } = await api.get("/api/email-expenses");
      setEmailExpenses(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { data } = await api.get("/api/integrations/gmail/connect");
      window.location.href = data.url; // redirect to Google OAuth consent screen
    } catch (e) {
      showToast("Failed to initiate Gmail connection", "error");
    }
  };

  const handleFetch = async () => {
    setFetching(true);
    try {
      await api.post("/api/integrations/gmail/fetch");
      showToast("Emails fetched! Reviewing new expenses below.");
      await loadEmailExpenses();
    } catch (e) {
      showToast(e.response?.data?.message || "Failed to fetch emails", "error");
    } finally {
      setFetching(false);
    }
  };

  const handleConvert = async (id) => {
    setConverting(id);
    try {
      await api.post(`/api/email-expenses/${id}/convert`);
      showToast("Expense added to your records!");
      setEmailExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, detected: true } : e))
      );
    } catch (e) {
      showToast(e.response?.data?.message || "Conversion failed", "error");
    } finally {
      setConverting(null);
    }
  };

  const pending = emailExpenses.filter((e) => !e.detected);
  const converted = emailExpenses.filter((e) => e.detected);

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
              style={{
                ...styles.navLink,
                ...(location.pathname === to ? styles.navActive : {}),
              }}
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

        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>Gmail Sync</h1>
            <p style={styles.pageSub}>Auto-detect expenses from your inbox</p>
          </div>
        </div>

        {/* Connect card */}
        <div style={styles.connectCard}>
          <div style={styles.gmailIcon}>✉</div>
          <div style={{ flex: 1 }}>
            <div style={styles.connectTitle}>
              {gmailConnected ? "Gmail is connected" : "Connect your Gmail"}
            </div>
            <div style={styles.connectSub}>
              {gmailConnected
                ? "Your inbox is linked. Fetch emails to scan for new expenses."
                : "Link your Gmail account to automatically detect transactions from emails."}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {!gmailConnected ? (
              <button style={styles.connectBtn} onClick={handleConnect}>
                Connect Gmail →
              </button>
            ) : (
              <>
                <div style={styles.connectedBadge}>● Connected</div>
                <button
                  style={styles.fetchBtn}
                  onClick={handleFetch}
                  disabled={fetching}
                >
                  {fetching ? "Scanning..." : "Fetch Emails"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pending expenses */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>
              Pending Review
              {pending.length > 0 && (
                <span style={styles.badge}>{pending.length}</span>
              )}
            </h2>
            <p style={styles.sectionSub}>
              Confirm each expense to add it to your records
            </p>
          </div>

          {loading ? (
            <div style={styles.empty}>Scanning your emails...</div>
          ) : pending.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>📭</div>
              <div style={styles.emptyTitle}>No pending expenses</div>
              <div style={styles.emptySub}>
                {gmailConnected
                  ? "Click 'Fetch Emails' to scan your inbox for new transactions."
                  : "Connect Gmail first to start detecting expenses automatically."}
              </div>
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {pending.map((e) => (
                <EmailExpenseCard
                  key={e.id}
                  expense={e}
                  onConvert={handleConvert}
                  converting={converting === e.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Converted expenses */}
        {converted.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Converted</h2>
              <p style={styles.sectionSub}>Already added to your expenses</p>
            </div>
            <div style={styles.tableBox}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Email ID", "Extracted Text", "Amount", "Status"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {converted.map((e) => (
                    <tr key={e.id} style={styles.tr}>
                      <td style={styles.td}>
                        <span style={styles.emailId}>{e.emailId || "—"}</span>
                      </td>
                      <td style={{ ...styles.td, maxWidth: 280 }}>
                        <span style={styles.extractedText}>
                          {e.extractedText?.slice(0, 80)}
                          {e.extractedText?.length > 80 ? "…" : ""}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, color: "#818cf8" }}>
                        {e.amount ? `₹${Number(e.amount).toLocaleString()}` : "—"}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.convertedBadge}>✓ Added</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function EmailExpenseCard({ expense, onConvert, converting }) {
  return (
    <div style={cardStyles.card}>
      <div style={cardStyles.cardTop}>
        <div style={cardStyles.emailTag}>
          <span style={cardStyles.dot} />
          {expense.emailId || "Email"}
        </div>
        {expense.amount && (
          <div style={cardStyles.amount}>
            ₹{Number(expense.amount).toLocaleString()}
          </div>
        )}
      </div>

      <div style={cardStyles.extractedText}>
        {expense.extractedText || "No extracted text available"}
      </div>

      <div style={cardStyles.cardFooter}>
        <div style={cardStyles.date}>
          {expense.createdAt
            ? new Date(expense.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </div>
        <button
          style={{
            ...cardStyles.convertBtn,
            ...(converting ? cardStyles.convertBtnDisabled : {}),
          }}
          onClick={() => onConvert(expense.id)}
          disabled={converting}
        >
          {converting ? "Adding..." : "Add to Expenses →"}
        </button>
      </div>
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
  connectCard: {
    background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 14,
    padding: "24px 28px", display: "flex", alignItems: "center", gap: 20, marginBottom: 36,
  },
  gmailIcon: { fontSize: 28, width: 52, height: 52, background: "#1a1a2e", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" },
  connectTitle: { fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 },
  connectSub: { fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  connectBtn: {
    background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
    padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  },
  connectedBadge: { color: "#4ade80", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 },
  fetchBtn: {
    background: "#0d2b1e", border: "1px solid #166534", color: "#4ade80",
    borderRadius: 8, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  },
  section: { marginBottom: 40 },
  sectionHeader: { marginBottom: 18 },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 10 },
  sectionSub: { color: "#475569", fontSize: 13, margin: "4px 0 0" },
  badge: { background: "#4f46e5", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700 },
  empty: { color: "#475569", textAlign: "center", padding: "40px 0", fontSize: 14 },
  emptyCard: {
    background: "#13131a", border: "1px dashed #1e1e2e", borderRadius: 14,
    padding: "48px 24px", textAlign: "center",
  },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#475569", maxWidth: 340, margin: "0 auto" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 },
  tableBox: { background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 12, overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#0d0d14", color: "#475569", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", padding: "12px 16px", textAlign: "left", borderBottom: "1px solid #1e1e2e" },
  tr: { borderBottom: "1px solid #1a1a28" },
  td: { padding: "13px 16px", fontSize: 14, color: "#cbd5e1" },
  emailId: { fontFamily: "monospace", fontSize: 12, color: "#64748b" },
  extractedText: { color: "#94a3b8", fontSize: 13 },
  convertedBadge: { background: "#0d2b1e", color: "#4ade80", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600 },
};

const cardStyles = {
  card: {
    background: "#13131a", border: "1px solid #1e1e2e", borderRadius: 12,
    padding: "20px", display: "flex", flexDirection: "column", gap: 12,
    transition: "border-color 0.2s",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  emailTag: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", fontFamily: "monospace" },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", display: "inline-block" },
  amount: { fontSize: 20, fontWeight: 700, color: "#818cf8" },
  extractedText: {
    fontSize: 13, color: "#94a3b8", lineHeight: 1.6,
    background: "#0d0d14", borderRadius: 8, padding: "12px 14px",
    border: "1px solid #1a1a28", minHeight: 56,
  },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  date: { fontSize: 12, color: "#475569" },
  convertBtn: {
    background: "#6366f1", color: "#fff", border: "none",
    borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
  convertBtnDisabled: { background: "#312e81", color: "#818cf8", cursor: "not-allowed" },
};
