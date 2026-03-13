// ─────────────────────────────────────────────────────────────────────────────
// Bulow Group · Approvals Portal
// src/App.jsx  —  repo: bulow-approvals
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { ClerkProvider, SignIn, useUser, useClerk } from "@clerk/react";

const API      = "https://bulow-backend.onrender.com";
const CLERK_PK = "pk_live_Y2xlcmsudGhlYnVsb3dncm91cC5jb20k";
const PORTAL   = "https://finance.thebulowgroup.com";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#0d1820",
  surface:   "#111f2b",
  card:      "rgba(255,255,255,0.035)",
  cardHov:   "rgba(255,255,255,0.06)",
  border:    "rgba(255,255,255,0.08)",
  borderHov: "rgba(255,255,255,0.16)",
  accent:    "#007ab6",
  white:     "#f5f7f9",
  muted:     "rgba(255,255,255,0.42)",
  subtle:    "rgba(255,255,255,0.2)",
  success:   "#10b981",
  danger:    "#ef4444",
  warning:   "#f59e0b",
  divider:   "rgba(255,255,255,0.06)",
};

const STATUS = {
  pending:   { label: "Pending",   color: C.warning, bg: "rgba(245,158,11,0.1)"   },
  approved:  { label: "Approved",  color: C.success, bg: "rgba(16,185,129,0.1)"   },
  rejected:  { label: "Rejected",  color: C.danger,  bg: "rgba(239,68,68,0.1)"    },
  cancelled: { label: "Cancelled", color: C.subtle,  bg: "rgba(255,255,255,0.05)" },
};

const TYPE = {
  invoice:     { label: "Invoice"     },
  expense:     { label: "Expense"     },
  transaction: { label: "Transaction" },
  contract:    { label: "Contract"    },
  other:       { label: "Other"       },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt$ = n =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const isOverdue = d =>
  d && new Date(d) < new Date() && new Date(d).toDateString() !== new Date().toDateString();

// ── API ───────────────────────────────────────────────────────────────────────
async function apiGet(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPatch(path, body) {
  const r = await fetch(API + path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ── Shared components ─────────────────────────────────────────────────────────

function Badge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
      textTransform: "uppercase", padding: "3px 10px", borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.color}33`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function TypeTag({ type }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.1,
      textTransform: "uppercase", padding: "3px 8px", borderRadius: 4,
      background: "rgba(255,255,255,0.05)", color: C.muted,
      border: `1px solid ${C.border}`, whiteSpace: "nowrap",
    }}>
      {TYPE[type]?.label || "Other"}
    </span>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, small, fullWidth, style: sx = {} }) {
  const v = {
    primary: { background: C.accent,                 color: "#fff",    border: "none" },
    success: { background: "rgba(16,185,129,0.12)",  color: C.success, border: "1px solid rgba(16,185,129,0.28)" },
    danger:  { background: "rgba(239,68,68,0.10)",   color: C.danger,  border: "1px solid rgba(239,68,68,0.28)"  },
    ghost:   { background: "rgba(255,255,255,0.05)", color: C.muted,   border: `1px solid ${C.border}` },
    outline: { background: "transparent",            color: C.accent,  border: `1px solid ${C.accent}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...v[variant], borderRadius: 6,
      fontSize: small ? 11 : 13, fontWeight: 600,
      padding: small ? "5px 12px" : "9px 18px",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transition: "opacity 0.15s",
      fontFamily: "inherit",
      width: fullWidth ? "100%" : "auto",
      ...sx,
    }}>
      {children}
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required, as, rows = 3, options }) {
  const shared = {
    background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
    borderRadius: 6, padding: "9px 12px", color: C.white, fontSize: 13,
    fontFamily: "inherit", outline: "none", width: "100%",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 0.6, textTransform: "uppercase" }}>
          {label}{required ? " *" : ""}
        </label>
      )}
      {as === "textarea" ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} rows={rows} style={{ ...shared, resize: "vertical" }} />
      ) : as === "select" ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ ...shared, background: "#0f1e2a", cursor: "pointer" }}>
          {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} style={shared} />
      )}
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase",
      letterSpacing: 1.5, paddingBottom: 8, borderBottom: `1px solid ${C.border}`,
      marginTop: 4,
    }}>
      {children}
    </div>
  );
}

function MetaRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0" }}>
      <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: highlight || C.white }}>{value}</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "11px 18px", borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5 }}>
            {title}
          </span>
        </div>
      )}
      <div style={{ padding: "16px 18px" }}>{children}</div>
    </div>
  );
}

function Loader() {
  return <div style={{ textAlign: "center", padding: 80, color: C.muted, fontSize: 13 }}>Loading…</div>;
}

// ── Top Bar ───────────────────────────────────────────────────────────────────
function TopBar({ user, isAdmin, pendingCount, page, setPage, onSignOut }) {
  return (
    <div style={{
      height: 58, padding: "0 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: `1px solid ${C.border}`,
      background: "rgba(13,24,32,0.96)",
      position: "sticky", top: 0, zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <a href={PORTAL} style={{
          fontSize: 12, color: C.muted, textDecoration: "none",
          fontWeight: 600, letterSpacing: 0.2, transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}>
          &larr; Portal
        </a>
        <div style={{ width: 1, height: 18, background: C.border }} />
        <div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>Approvals</span>
          <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>The Bulow Group</span>
        </div>
        {pendingCount > 0 && (
          <span style={{
            background: C.danger, color: "#fff", borderRadius: 12,
            fontSize: 10, fontWeight: 700, padding: "2px 7px",
          }}>
            {pendingCount}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {["dashboard", ...(isAdmin ? ["admin"] : [])].map(p => (
          <button key={p} onClick={() => setPage(p)} style={{
            background: page === p ? "rgba(0,122,182,0.12)" : "none",
            border: page === p ? "1px solid rgba(0,122,182,0.28)" : "1px solid transparent",
            borderRadius: 6, color: page === p ? C.accent : C.muted,
            fontSize: 12, fontWeight: 600, padding: "5px 12px",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {p === "admin" ? "All Requests" : "Dashboard"}
          </button>
        ))}
        {isAdmin && (
          <>
            <div style={{ width: 1, height: 18, background: C.border }} />
            <Btn small onClick={() => setPage("submit")}>New Request</Btn>
          </>
        )}
        <div style={{ width: 1, height: 18, background: C.border, marginLeft: 4 }} />
        <span style={{ fontSize: 11, color: C.muted }}>{user?.primaryEmailAddress?.emailAddress}</span>
        <Btn small onClick={onSignOut} variant="ghost">Sign Out</Btn>
      </div>
    </div>
  );
}

// ── Request Row ───────────────────────────────────────────────────────────────
function RequestRow({ req, onClick, showApprovers }) {
  const overdue        = isOverdue(req.dueDate) && req.status === "pending";
  const approvedCount  = req.approvers?.filter(a => a.status === "approved").length || 0;
  const totalApprovers = req.approvers?.length || 0;

  return (
    <div onClick={onClick} style={{
      background: C.card,
      border: `1px solid ${overdue ? "rgba(239,68,68,0.25)" : C.border}`,
      borderRadius: 8, padding: "14px 18px", cursor: "pointer",
      transition: "all 0.15s",
      display: "grid", gridTemplateColumns: "1fr auto",
      gap: 16, alignItems: "center",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = C.cardHov; e.currentTarget.style.borderColor = overdue ? "rgba(239,68,68,0.45)" : C.borderHov; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.card;    e.currentTarget.style.borderColor = overdue ? "rgba(239,68,68,0.25)" : C.border; }}>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>
            {req.title || req.vendor}
          </span>
          <Badge status={req.status} />
          <TypeTag type={req.type} />
          {overdue && (
            <span style={{ fontSize: 10, fontWeight: 700, color: C.danger, letterSpacing: 1, textTransform: "uppercase" }}>
              Overdue
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{req.vendor || "—"}</span>
          <span style={{ fontSize: 12, color: C.muted }}>Submitted {fmtDate(req.createdAt)}</span>
          {req.dueDate && (
            <span style={{ fontSize: 12, color: overdue ? C.danger : C.muted }}>
              Due {fmtDate(req.dueDate)}
            </span>
          )}
          {showApprovers && (
            <span style={{ fontSize: 12, color: C.muted }}>{approvedCount}/{totalApprovers} approved</span>
          )}
          {req.documents?.length > 0 && (
            <span style={{ fontSize: 12, color: C.muted }}>
              {req.documents.length} {req.documents.length === 1 ? "document" : "documents"}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.white }}>{fmt$(req.amount)}</div>
        <div style={{ fontSize: 16, color: C.subtle }}>›</div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ user, isAdmin, onView }) {
  const [toApprove, setToApprove] = useState([]);
  const [mine, setMine]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!email) return;
    setLoading(true);
    Promise.all([
      apiGet(`/api/approvals?assignedTo=${encodeURIComponent(email)}`),
      apiGet(`/api/approvals?submittedBy=${encodeURIComponent(email)}`),
    ])
      .then(([a, m]) => { setToApprove(a); setMine(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <Loader />;

  const myPending = toApprove.filter(r => {
    const me = r.approvers?.find(a => a.email === email);
    return me?.status === "pending" && r.status === "pending";
  });
  const myDecided = toApprove.filter(r => {
    const me = r.approvers?.find(a => a.email === email);
    return me && me.status !== "pending";
  });

  const Section = ({ title, items, empty, showApprovers }) => (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5 }}>
          {title}
        </span>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: "rgba(255,255,255,0.06)", color: C.muted }}>
          {items.length}
        </span>
      </div>
      {items.length === 0
        ? <div style={{ padding: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
            {empty}
          </div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map(r => <RequestRow key={r._id} req={r} onClick={() => onView(r)} showApprovers={showApprovers} />)}
          </div>
      }
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 28px" }}>
      {myPending.length > 0 && (
        <Section title="Needs Your Approval" items={myPending} empty="" showApprovers={false} />
      )}
      <Section
        title={isAdmin ? "Submitted by You" : "My Requests"}
        items={mine}
        empty="No requests submitted yet."
        showApprovers={true}
      />
      {myDecided.length > 0 && (
        <Section title="Previously Reviewed" items={myDecided} empty="" showApprovers={false} />
      )}
    </div>
  );
}

// ── Submit Form ───────────────────────────────────────────────────────────────
function SubmitForm({ user, onBack, onSuccess }) {
  const [form, setForm]             = useState({ type: "invoice", title: "", vendor: "", amount: "", notes: "", dueDate: "" });
  const [approvers, setApprovers]   = useState([{ name: "", email: "" }]);
  const [files, setFiles]           = useState([]);
  const [dragOver, setDragOver]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  const set = k => v => setForm(f => ({ ...f, [k]: v }));
  const addApprover    = () => setApprovers(a => [...a, { name: "", email: "" }]);
  const removeApprover = i  => setApprovers(a => a.filter((_, idx) => idx !== i));
  const setApprover    = (i, k, v) => setApprovers(a => a.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const addFiles = newFiles => setFiles(f => {
    const names = new Set(f.map(x => x.name));
    return [...f, ...Array.from(newFiles).filter(x => !names.has(x.name))];
  });
  const handleDrop = e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  const handleSubmit = async () => {
    if (!form.vendor.trim())                            { setError("Vendor is required."); return; }
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError("Enter a valid amount."); return; }
    if (approvers.some(a => !a.email.trim()))           { setError("All approver rows need an email address."); return; }
    setSubmitting(true); setError("");
    try {
      const name = user?.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : user?.primaryEmailAddress?.emailAddress;

      const created = await apiPost("/api/approvals", {
        ...form,
        amount: parseFloat(form.amount),
        approvers: approvers.filter(a => a.email.trim()),
        submittedBy: { email: user?.primaryEmailAddress?.emailAddress, name, clerkId: user?.id },
      });

      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        await fetch(`${API}/api/approvals/${created._id}/upload`, { method: "POST", body: fd });
      }
      onSuccess();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 32 }}>
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
          borderRadius: 6, color: C.muted, fontSize: 16, cursor: "pointer",
          width: 32, height: 32, flexShrink: 0,
        }}>&#8592;</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>New Approval Request</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
            Fill in the details and assign approvers. They will be notified by email.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHeader>Request Details</SectionHeader>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field as="select" label="Type" value={form.type} onChange={set("type")}
            options={Object.entries(TYPE).map(([v, t]) => ({ value: v, label: t.label }))} />
          <Field label="Vendor / Payee" value={form.vendor} onChange={set("vendor")} placeholder="e.g. Acme Corp" required />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Title / Description" value={form.title} onChange={set("title")} placeholder="e.g. Q1 Software Subscription" />
          <Field label="Amount ($)" type="number" value={form.amount} onChange={set("amount")} placeholder="0.00" required />
        </div>

        <Field label="Due Date" type="date" value={form.dueDate} onChange={set("dueDate")} />

        <Field as="textarea" label="Notes" value={form.notes} onChange={set("notes")}
          placeholder="GL account, PO number, or any context the approver needs..." rows={3} />

        <SectionHeader>Approvers</SectionHeader>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {approvers.map((a, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "end" }}>
              <Field value={a.name} onChange={v => setApprover(i, "name", v)} placeholder="Full Name" />
              <Field value={a.email} type="email" onChange={v => setApprover(i, "email", v)} placeholder="email@company.com" />
              {approvers.length > 1 && (
                <button onClick={() => removeApprover(i)} style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)",
                  borderRadius: 6, color: C.danger, cursor: "pointer", width: 34, height: 34, fontSize: 16,
                }}>&times;</button>
              )}
            </div>
          ))}
          <button onClick={addApprover} style={{
            background: "none", border: "none", color: C.accent,
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            padding: "4px 0", fontFamily: "inherit", textAlign: "left",
          }}>
            + Add another approver
          </button>
        </div>

        <SectionHeader>Documents</SectionHeader>

        <label
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            display: "block",
            border: `1.5px dashed ${dragOver ? C.accent : C.border}`,
            borderRadius: 8, padding: "24px 16px", textAlign: "center",
            cursor: "pointer", color: dragOver ? C.accent : C.muted,
            fontSize: 13, background: dragOver ? "rgba(0,122,182,0.05)" : "transparent",
            transition: "all 0.15s",
          }}>
          <input type="file" multiple onChange={e => addFiles(e.target.files)} style={{ display: "none" }} />
          {files.length > 0 ? (
            <div>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 12px", background: "rgba(255,255,255,0.04)",
                  borderRadius: 5, marginBottom: 5, textAlign: "left",
                }}>
                  <span style={{ fontSize: 12 }}>{f.name}</span>
                  <button onClick={ev => { ev.preventDefault(); ev.stopPropagation(); setFiles(fs => fs.filter((_, idx) => idx !== i)); }}
                    style={{ background: "none", border: "none", color: C.danger, cursor: "pointer", fontSize: 15 }}>&times;</button>
                </div>
              ))}
              <span style={{ fontSize: 11, color: C.muted, display: "block", marginTop: 6 }}>Click or drag to add more files</span>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, marginBottom: 4 }}>Drop files here or click to browse</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>PDF, images, Excel, Word — up to 25 MB each</div>
            </div>
          )}
        </label>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "10px 14px", color: C.danger, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
          <Btn onClick={onBack} variant="ghost">Cancel</Btn>
          <Btn onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for Approval"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Approval Detail ───────────────────────────────────────────────────────────
function ApprovalDetail({ req: init, user, isAdmin, onBack }) {
  const [req, setReq]           = useState(init);
  const [deciding, setDeciding] = useState(null);
  const [comment, setComment]   = useState("");
  const [saving, setSaving]     = useState(false);

  const email      = user?.primaryEmailAddress?.emailAddress;
  const me         = req.approvers?.find(a => a.email === email);
  const canDecide  = me?.status === "pending" && req.status === "pending";
  const overdue    = isOverdue(req.dueDate) && req.status === "pending";
  const approvedCount  = req.approvers?.filter(a => a.status === "approved").length || 0;
  const totalApprovers = req.approvers?.length || 0;
  const progressPct    = totalApprovers ? Math.round((approvedCount / totalApprovers) * 100) : 0;

  const decide = async () => {
    setSaving(true);
    try {
      const updated = await apiPatch(`/api/approvals/${req._id}/decide`, { decision: deciding, comment, approverEmail: email });
      setReq(updated); setDeciding(null); setComment("");
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const cancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    try {
      const updated = await apiPatch(`/api/approvals/${req._id}/decide`, { decision: "cancelled" });
      setReq(updated);
    } catch (e) { alert(e.message); }
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 28px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <button onClick={onBack} style={{
            background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
            borderRadius: 6, color: C.muted, fontSize: 16, cursor: "pointer",
            width: 32, height: 32, flexShrink: 0, marginTop: 5,
          }}>&#8592;</button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 21, fontWeight: 800, color: C.white }}>{req.title || req.vendor}</span>
              <Badge status={req.status} />
              <TypeTag type={req.type} />
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Submitted by {req.submittedBy?.name}&nbsp;&nbsp;·&nbsp;&nbsp;{fmtDate(req.createdAt)}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.white, whiteSpace: "nowrap" }}>
          {fmt$(req.amount)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Request Details">
            <MetaRow label="Vendor / Payee" value={req.vendor || "—"} />
            <div style={{ height: 1, background: C.divider }} />
            <MetaRow label="Amount" value={fmt$(req.amount)} />
            <div style={{ height: 1, background: C.divider }} />
            <MetaRow label="Type" value={TYPE[req.type]?.label || "Other"} />
            <div style={{ height: 1, background: C.divider }} />
            <MetaRow label="Date Submitted" value={fmtDate(req.createdAt)} />
            <div style={{ height: 1, background: C.divider }} />
            <MetaRow
              label="Due Date"
              value={req.dueDate ? fmtDate(req.dueDate) : "No due date set"}
              highlight={overdue ? C.danger : req.dueDate ? C.white : C.muted}
            />
            {overdue && (
              <div style={{
                marginTop: 10, padding: "8px 12px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 6, fontSize: 12, color: C.danger,
              }}>
                This request is past its due date.
              </div>
            )}
            {req.notes && (
              <>
                <div style={{ height: 1, background: C.divider, margin: "12px 0" }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Notes</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", whiteSpace: "pre-wrap" }}>{req.notes}</div>
              </>
            )}
          </Card>

          <Card title={`Documents  (${req.documents?.length || 0})`}>
            {req.documents?.length > 0
              ? req.documents.map((doc, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 6,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.fileName}</div>
                    {doc.uploadedAt && (
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Uploaded {fmtDate(doc.uploadedAt)}</div>
                    )}
                  </div>
                  <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: C.accent, fontWeight: 600, textDecoration: "none" }}>
                    Download
                  </a>
                </div>
              ))
              : <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "12px 0" }}>No documents attached</div>
            }
          </Card>

          {deciding && (
            <div style={{
              background: deciding === "approved" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
              border: `1px solid ${deciding === "approved" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
              borderRadius: 10, padding: 20,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: C.white }}>
                {deciding === "approved" ? "Confirm Approval" : "Confirm Rejection"}
              </div>
              <Field as="textarea" label="Comment (optional)" value={comment} onChange={setComment}
                placeholder={deciding === "approved" ? "Approved." : "Please provide a reason..."} rows={2} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Btn onClick={decide} variant={deciding === "approved" ? "success" : "danger"} disabled={saving}>
                  {saving ? "Saving…" : deciding === "approved" ? "Confirm Approval" : "Confirm Rejection"}
                </Btn>
                <Btn onClick={() => { setDeciding(null); setComment(""); }} variant="ghost">Back</Btn>
              </div>
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Approval Progress">
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 6 }}>
                <span>{approvedCount} of {totalApprovers} approved</span>
                <span>{progressPct}%</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                <div style={{
                  height: 3, borderRadius: 2, width: `${progressPct}%`,
                  background: req.status === "approved" ? C.success : req.status === "rejected" ? C.danger : C.accent,
                  transition: "width 0.4s",
                }} />
              </div>
            </div>
            {req.approvers?.map((a, i) => {
              const statusColor = a.status === "approved" ? C.success : a.status === "rejected" ? C.danger : C.muted;
              return (
                <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < req.approvers.length - 1 ? `1px solid ${C.divider}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{a.name || a.email}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{a.email}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: statusColor }}>
                      {a.status}
                    </span>
                  </div>
                  {a.comment && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 5, fontStyle: "italic" }}>
                      "{a.comment}"
                    </div>
                  )}
                  {a.decidedAt && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{fmtDate(a.decidedAt)}</div>}
                </div>
              );
            })}
          </Card>

          {canDecide && !deciding && (
            <Card title="Your Decision">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Btn onClick={() => setDeciding("approved")} variant="success" fullWidth>Approve</Btn>
                <Btn onClick={() => setDeciding("rejected")} variant="danger"  fullWidth>Reject</Btn>
              </div>
            </Card>
          )}

          {me && me.status !== "pending" && (
            <div style={{
              padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, fontSize: 12, color: C.muted, textAlign: "center",
            }}>
              You {me.status} this request on {fmtDate(me.decidedAt)}.
            </div>
          )}

          {isAdmin && req.status === "pending" && (
            <Btn onClick={cancel} variant="ghost" small>Cancel Request</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
function AdminPanel({ user, onView }) {
  const [all, setAll]               = useState([]);
  const [filter, setFilter]         = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    apiGet("/api/approvals?admin=true")
      .then(setAll).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = all.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (search && !`${r.vendor} ${r.title} ${r.submittedBy?.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalValue = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.white }}>All Requests</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
          {filtered.length} request{filtered.length !== 1 ? "s" : ""}&nbsp;·&nbsp;{fmt$(totalValue)} total
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input
          placeholder="Search vendor, title, submitter…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, background: "rgba(255,255,255,0.05)",
            border: `1px solid ${C.border}`, borderRadius: 6, padding: "7px 12px",
            color: C.white, fontSize: 12, fontFamily: "inherit", outline: "none",
          }}
        />
        {["all", "pending", "approved", "rejected", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            background: filter === s ? C.accent : "rgba(255,255,255,0.04)",
            border: `1px solid ${filter === s ? C.accent : C.border}`,
            borderRadius: 6, color: filter === s ? "#fff" : C.muted,
            fontSize: 11, fontWeight: 600, padding: "6px 13px",
            cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
          }}>{s}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {["all", ...Object.keys(TYPE)].map(tp => (
          <button key={tp} onClick={() => setTypeFilter(tp)} style={{
            background: typeFilter === tp ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${typeFilter === tp ? C.borderHov : C.border}`,
            borderRadius: 6, color: typeFilter === tp ? C.white : C.muted,
            fontSize: 11, fontWeight: 600, padding: "5px 12px",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {tp === "all" ? "All Types" : TYPE[tp].label}
          </button>
        ))}
      </div>

      {loading
        ? <Loader />
        : filtered.length === 0
          ? <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 13 }}>No requests found.</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map(r => <RequestRow key={r._id} req={r} onClick={() => onView(r)} showApprovers />)}
            </div>
      }
    </div>
  );
}

// ── Sign In ───────────────────────────────────────────────────────────────────
function SignInPage() {
  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 28,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>The Bulow Group</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Approvals Portal</div>
      </div>
      <SignIn
        appearance={{
          elements: {
            card:             { background: "#111f2b", border: `1px solid ${C.border}`, boxShadow: "none" },
            headerTitle:      { color: C.white },
            headerSubtitle:   { color: C.muted },
            formFieldLabel:   { color: C.muted },
            formFieldInput:   { background: "rgba(255,255,255,0.06)", borderColor: C.border, color: C.white },
            footerActionLink: { color: C.accent },
            socialButtonsBlockButton: { borderColor: C.border, color: C.white },
          },
        }}
      />
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { user, isLoaded } = useUser();
  const { signOut }        = useClerk();
  const [page, setPage]         = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;
    apiGet(`/api/approvals?assignedTo=${encodeURIComponent(email)}&status=pending`)
      .then(data => {
        const count = data.filter(r => {
          const me = r.approvers?.find(a => a.email === email);
          return me?.status === "pending" && r.status === "pending";
        }).length;
        setPendingCount(count);
      })
      .catch(() => {});
  }, [user, page]);

  if (!isLoaded) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 13 }}>
      Loading…
    </div>
  );

  if (!user) return <SignInPage />;

  const handleView = req => { setSelected(req); setPage("detail"); };
  const handleBack = ()  => { setSelected(null); setPage("dashboard"); };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, color: C.white,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: rgba(255,255,255,0.2); }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(0,122,182,0.5) !important;
          box-shadow: 0 0 0 3px rgba(0,122,182,0.1);
        }
      `}</style>

      <TopBar
        user={user} isAdmin={isAdmin} pendingCount={pendingCount}
        page={page} setPage={setPage}
        onSignOut={() => signOut({ redirectUrl: window.location.href })}
      />

      {page === "dashboard" && <Dashboard user={user} isAdmin={isAdmin} onView={handleView} />}
      {page === "submit"    && isAdmin   && <SubmitForm user={user} onBack={handleBack} onSuccess={handleBack} />}
      {page === "detail"    && selected  && <ApprovalDetail req={selected} user={user} isAdmin={isAdmin} onBack={handleBack} />}
      {page === "admin"     && isAdmin   && <AdminPanel user={user} onView={handleView} />}
    </div>
  );
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PK}
      isSatellite
      domain="finance.thebulowgroup.com"
      signInUrl="https://finance.thebulowgroup.com"
    >
      <AppInner />
    </ClerkProvider>
  );
}
