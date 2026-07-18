import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const C = { card: "#fff", border: "#F8BBD0", soft: "#FDE7EF", rose: "#D81B60", deep: "#AD1457", brown: "#5D4037", brownSoft: "#8D6E63", green: "#2E7D32" };
const btn = { background: C.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer" };
const btnSoft = { ...btn, background: C.soft, color: C.deep, border: `1.5px solid ${C.border}` };
const tab = (active) => ({ ...btnSoft, padding: "6px 14px", background: active ? C.rose : C.soft, color: active ? "#fff" : C.deep });
const input = { border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 13px", background: "#FFF9FB", color: C.brown, outline: "none", width: "100%", fontFamily: "inherit" };
const box = { background: C.soft, borderRadius: 14, padding: 14 };

export default function AdminPanel({ onClose }) {
  const [view, setView] = useState("payments"); // payments | devices | grant | coupons | admins | users
  const [rows, setRows] = useState([]);
  const [devices, setDevices] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null); // { ok: bool, text: string }

  // form fields
  const [grantEmail, setGrantEmail] = useState("");
  const [grantMonths, setGrantMonths] = useState("");
  const [cCode, setCCode] = useState("");
  const [cMonths, setCMonths] = useState("");
  const [cUses, setCUses] = useState("1");
  const [adminEmail, setAdminEmail] = useState("");

  const load = async () => {
    const { data: pay } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50);
    setRows(pay || []);
    const { data: dev } = await supabase.from("devices").select("*").order("created_at", { ascending: false }).limit(50);
    setDevices(dev || []);
    const { data: cps } = await supabase.from("coupons").select("*").order("created_at", { ascending: false }).limit(50);
    setCoupons(cps || []);
    const { data: adm } = await supabase.from("admins").select("*").order("created_at", { ascending: false }).limit(50);
    setAdmins(adm || []);
    const { data: usr } = await supabase.rpc("admin_list_users");
    setUsers(usr || []);
  };
  useEffect(() => { load(); }, []);

  const run = async (fn) => {
    setBusy(true); setNote(null);
    try { await fn(); await load(); }
    catch (e) { setNote({ ok: false, text: e.message || "Something went wrong." }); }
    setBusy(false);
  };

  const review = (id, approve) => run(async () => { await supabase.rpc("review_payment", { p_id: id, p_approve: approve }); });
  const reviewDevice = (id, approve) => run(async () => { await supabase.rpc(approve ? "admin_approve_device" : "admin_deny_device", { p_row: id }); });

  const grantAccess = () => run(async () => {
    if (!grantEmail.trim()) throw new Error("Enter the user's email.");
    const months = grantMonths.trim() === "" ? null : parseInt(grantMonths, 10);
    const { error } = await supabase.rpc("grant_free_access", { p_email: grantEmail.trim(), p_months: months });
    if (error) throw error;
    setNote({ ok: true, text: months ? `Granted ${months} month(s) to ${grantEmail}.` : `Granted LIFETIME access to ${grantEmail}.` });
    setGrantEmail(""); setGrantMonths("");
  });

  const revokeAccess = () => run(async () => {
    if (!grantEmail.trim()) throw new Error("Enter the user's email to revoke.");
    const { error } = await supabase.rpc("revoke_access", { p_email: grantEmail.trim() });
    if (error) throw error;
    setNote({ ok: true, text: `Revoked access for ${grantEmail}.` });
    setGrantEmail("");
  });

  const makeCoupon = () => run(async () => {
    if (!cCode.trim()) throw new Error("Enter a coupon code.");
    if (!cMonths.trim()) throw new Error("Enter how many free months this coupon gives.");
    const { error } = await supabase.rpc("create_coupon", {
      p_code: cCode.trim(), p_free_months: parseInt(cMonths, 10),
      p_percent_off: null, p_max_uses: parseInt(cUses || "1", 10), p_expires: null,
    });
    if (error) throw error;
    setNote({ ok: true, text: `Coupon ${cCode.toUpperCase()} created.` });
    setCCode(""); setCMonths(""); setCUses("1");
  });

  const killCoupon = (code) => run(async () => { await supabase.rpc("deactivate_coupon", { p_code: code }); });

  const promote = () => run(async () => {
    if (!adminEmail.trim()) throw new Error("Enter an email to make admin.");
    const { error } = await supabase.rpc("add_admin", { p_email: adminEmail.trim() });
    if (error) throw error;
    setNote({ ok: true, text: `${adminEmail} is now an admin.` });
    setAdminEmail("");
  });

  const demote = (email) => run(async () => { await supabase.rpc("remove_admin", { p_email: email }); });

  // Flip a user between admin and non-admin straight from the Users list.
  const toggleAdmin = (email, makeAdmin) => run(async () => {
    if (!email) throw new Error("This user has no email on file.");
    const { error } = await supabase.rpc(makeAdmin ? "add_admin" : "remove_admin", { p_email: email });
    if (error) throw error;
    setNote({ ok: true, text: makeAdmin ? `${email} is now an admin.` : `${email} is no longer an admin.` });
  });

  const sendReset = (email) => run(async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
    setNote({ ok: true, text: `Password reset link sent to ${email}.` });
  });

  const pendingDevices = devices.filter((d) => d.status === "pending");
  const otherDevices = devices.filter((d) => d.status !== "pending");

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(93,64,55,0.5)", zIndex: 95, fontFamily: "'Nunito', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-2xl p-6 overflow-y-auto" style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: C.deep, fontWeight: 600 }}>🛠 Admin panel</h2>
          <button style={{ ...btnSoft, padding: "4px 12px" }} onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button style={tab(view === "payments")} onClick={() => setView("payments")}>💳 Payments</button>
          <button style={tab(view === "devices")} onClick={() => setView("devices")}>📱 Devices{pendingDevices.length ? ` (${pendingDevices.length})` : ""}</button>
          <button style={tab(view === "grant")} onClick={() => setView("grant")}>🎁 Free access</button>
          <button style={tab(view === "coupons")} onClick={() => setView("coupons")}>🎟 Coupons</button>
          <button style={tab(view === "users")} onClick={() => setView("users")}>👥 Users</button>
          <button style={tab(view === "admins")} onClick={() => setView("admins")}>👑 Admins</button>
        </div>

        {note && (
          <div className="mb-3" style={{ background: note.ok ? "#E8F5E9" : "#FFEBEE", color: note.ok ? C.green : C.rose, borderRadius: 12, padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>
            {note.text}
          </div>
        )}

        {/* ---- PAYMENTS ---- */}
        {view === "payments" && (
          <>
            {rows.length === 0 && <p style={{ color: C.brownSoft, fontWeight: 700 }}>No payments yet.</p>}
            <div className="flex flex-col gap-2">
              {rows.map((r) => (
                <div key={r.id} className="p-3 flex flex-wrap justify-between items-center gap-2" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: C.deep }}>
                      {r.method === "momo" ? "📱 MoMo" : "💳 PayPal"} · ${r.amount_usd}{r.amount_cfa ? ` (${Number(r.amount_cfa).toLocaleString()} CFA)` : ""} · {r.period}
                    </div>
                    <div style={{ color: C.brownSoft, fontWeight: 700 }}>
                      {r.phone ? `Phone: ${r.phone} · ` : ""}Ref: {r.reference || "—"} · {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <button disabled={busy} style={{ ...btn, padding: "5px 14px" }} onClick={() => review(r.id, true)}>✅ Validate</button>
                      <button disabled={busy} style={{ ...btnSoft, padding: "5px 14px" }} onClick={() => review(r.id, false)}>Reject</button>
                    </div>
                  ) : (
                    <span style={{ fontWeight: 800, color: r.status === "approved" ? C.green : C.rose }}>
                      {r.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- DEVICES ---- */}
        {view === "devices" && (
          <>
            <p style={{ color: C.brownSoft, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Approving a device signs out any other device on that account.</p>
            {pendingDevices.length === 0 && <p style={{ color: C.brownSoft, fontWeight: 700 }}>No devices waiting for approval. 🎉</p>}
            <div className="flex flex-col gap-2">
              {pendingDevices.map((d) => (
                <div key={d.id} className="p-3 flex flex-wrap justify-between items-center gap-2" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: C.deep }}>⏳ {d.user_email || "Guest account"}</div>
                    <div style={{ color: C.brownSoft, fontWeight: 700 }}>{d.device_name || "Unknown device"} · {new Date(d.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busy} style={{ ...btn, padding: "5px 14px" }} onClick={() => reviewDevice(d.id, true)}>✅ Approve</button>
                    <button disabled={busy} style={{ ...btnSoft, padding: "5px 14px" }} onClick={() => reviewDevice(d.id, false)}>Deny</button>
                  </div>
                </div>
              ))}
            </div>
            {otherDevices.length > 0 && (
              <>
                <h3 style={{ color: C.deep, fontWeight: 800, fontSize: 14, margin: "16px 0 6px" }}>All devices</h3>
                <div className="flex flex-col gap-2">
                  {otherDevices.map((d) => (
                    <div key={d.id} className="p-3 flex flex-wrap justify-between items-center gap-2" style={{ background: "#FFF9FB", border: `1px solid ${C.border}`, borderRadius: 14, fontSize: 13 }}>
                      <div>
                        <div style={{ fontWeight: 800, color: C.deep }}>{d.user_email || "Guest account"}</div>
                        <div style={{ color: C.brownSoft, fontWeight: 700 }}>{d.device_name || "Unknown device"}</div>
                      </div>
                      <span style={{ fontWeight: 800, color: d.status === "active" ? C.green : C.brownSoft }}>
                        {d.status === "active" ? "✅ Active" : "🚫 Revoked"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ---- GRANT FREE ACCESS ---- */}
        {view === "grant" && (
          <div style={box}>
            <p style={{ fontSize: 13, color: C.brown, fontWeight: 700, marginBottom: 10 }}>
              Give a user full access with no payment. Enter their account email.
              Leave months <b>empty</b> for lifetime access, or type a number (e.g. 6).
            </p>
            <div className="flex flex-col gap-3">
              <input style={input} placeholder="User email (e.g. mary@gmail.com)" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} />
              <input style={input} placeholder="Months (empty = lifetime)" value={grantMonths} onChange={(e) => setGrantMonths(e.target.value)} />
              <div className="flex gap-2">
                <button disabled={busy} style={{ ...btn, padding: 12, flex: 1 }} onClick={grantAccess}>🎁 Grant access</button>
                <button disabled={busy} style={{ ...btnSoft, padding: 12, flex: 1 }} onClick={revokeAccess}>↩ Revoke access</button>
              </div>
            </div>
          </div>
        )}

        {/* ---- COUPONS ---- */}
        {view === "coupons" && (
          <>
            <div style={box}>
              <p style={{ fontSize: 13, color: C.brown, fontWeight: 700, marginBottom: 10 }}>
                Create a code users can redeem for free months. Max uses is how many people can use it in total.
              </p>
              <div className="flex flex-col gap-3">
                <input style={input} placeholder="Code (e.g. WELCOME1)" value={cCode} onChange={(e) => setCCode(e.target.value)} />
                <div className="flex gap-2">
                  <input style={input} placeholder="Free months (e.g. 1)" value={cMonths} onChange={(e) => setCMonths(e.target.value)} />
                  <input style={input} placeholder="Max uses (e.g. 50)" value={cUses} onChange={(e) => setCUses(e.target.value)} />
                </div>
                <button disabled={busy} style={{ ...btn, padding: 12 }} onClick={makeCoupon}>🎟 Create coupon</button>
              </div>
            </div>
            <h3 style={{ color: C.deep, fontWeight: 800, fontSize: 14, margin: "16px 0 6px" }}>Existing coupons</h3>
            {coupons.length === 0 && <p style={{ color: C.brownSoft, fontWeight: 700 }}>No coupons yet.</p>}
            <div className="flex flex-col gap-2">
              {coupons.map((c) => (
                <div key={c.code} className="p-3 flex flex-wrap justify-between items-center gap-2" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: C.deep }}>{c.code} {c.active ? "" : "(off)"}</div>
                    <div style={{ color: C.brownSoft, fontWeight: 700 }}>
                      {c.free_months ? `${c.free_months} free month(s)` : `${c.percent_off}% off`} · used {c.used_count}/{c.max_uses}
                    </div>
                  </div>
                  {c.active && <button disabled={busy} style={{ ...btnSoft, padding: "5px 14px" }} onClick={() => killCoupon(c.code)}>Turn off</button>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- USERS ---- */}
        {view === "users" && (
          <>
            <p style={{ color: C.brownSoft, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              Everyone who has an account. If someone forgot their password, tap “Reset link” to email them a link to set a new one.
            </p>
            <input style={{ ...input, marginBottom: 12 }} placeholder="🔍 Search by email or name" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            {users.length === 0 && <p style={{ color: C.brownSoft, fontWeight: 700 }}>No users yet.</p>}
            <div className="flex flex-col gap-2">
              {users
                .filter((u) => {
                  const q = userSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (u.email || "").toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q);
                })
                .map((u) => {
                  const active = u.plan === "full" && (!u.plan_expires_at || new Date(u.plan_expires_at) > new Date());
                  return (
                    <div key={u.id} className="p-3 flex flex-wrap justify-between items-center gap-2" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, color: C.deep, wordBreak: "break-all" }}>
                          {u.email}{u.is_admin ? " 👑" : ""}
                        </div>
                        <div style={{ color: C.brownSoft, fontWeight: 700 }}>
                          {u.full_name || "—"} · {active ? "✅ Full" : "Guest"}
                          {u.plan_expires_at ? ` · until ${new Date(u.plan_expires_at).toLocaleDateString()}` : (active ? " · lifetime" : "")}
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button disabled={busy}
                          style={{ ...btnSoft, padding: "6px 14px", ...(u.is_admin ? {} : { background: C.rose, color: "#fff", border: "none" }) }}
                          onClick={() => toggleAdmin(u.email, !u.is_admin)}>
                          {u.is_admin ? "Remove admin" : "👑 Make admin"}
                        </button>
                        <button disabled={busy} style={{ ...btnSoft, padding: "6px 14px" }} onClick={() => sendReset(u.email)}>
                          🔑 Reset link
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* ---- ADMINS ---- */}
        {view === "admins" && (
          <>
            <div style={box}>
              <p style={{ fontSize: 13, color: C.brown, fontWeight: 700, marginBottom: 10 }}>
                Make another person an admin by their account email. Admins get full access free and can manage everything here.
              </p>
              <div className="flex gap-2">
                <input style={input} placeholder="Email to make admin" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                <button disabled={busy} style={{ ...btn, padding: "10px 16px" }} onClick={promote}>👑 Add</button>
              </div>
            </div>
            <h3 style={{ color: C.deep, fontWeight: 800, fontSize: 14, margin: "16px 0 6px" }}>Current admins</h3>
            <div className="flex flex-col gap-2">
              {admins.map((a) => (
                <div key={a.email} className="p-3 flex justify-between items-center gap-2" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
                  <span style={{ fontWeight: 800, color: C.deep }}>{a.email}</span>
                  <button disabled={busy} style={{ ...btnSoft, padding: "5px 14px" }} onClick={() => demote(a.email)}>Remove</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
