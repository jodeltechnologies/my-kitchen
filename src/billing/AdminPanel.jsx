import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const C = { card: "#fff", border: "#F8BBD0", soft: "#FDE7EF", rose: "#D81B60", deep: "#AD1457", brownSoft: "#8D6E63", green: "#2E7D32" };
const btn = { background: C.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer" };
const btnSoft = { ...btn, background: C.soft, color: C.deep, border: `1.5px solid ${C.border}` };
const tab = (active) => ({ ...btnSoft, padding: "6px 16px", background: active ? C.rose : C.soft, color: active ? "#fff" : C.deep });

export default function AdminPanel({ onClose }) {
  const [view, setView] = useState("payments"); // payments | devices
  const [rows, setRows] = useState([]);
  const [devices, setDevices] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: pay } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50);
    setRows(pay || []);
    const { data: dev } = await supabase.from("devices").select("*").order("created_at", { ascending: false }).limit(50);
    setDevices(dev || []);
  };
  useEffect(() => { load(); }, []);

  const review = async (id, approve) => {
    setBusy(true);
    await supabase.rpc("review_payment", { p_id: id, p_approve: approve });
    await load();
    setBusy(false);
  };

  const reviewDevice = async (id, approve) => {
    setBusy(true);
    await supabase.rpc(approve ? "admin_approve_device" : "admin_deny_device", { p_row: id });
    await load();
    setBusy(false);
  };

  const pendingDevices = devices.filter((d) => d.status === "pending");
  const otherDevices = devices.filter((d) => d.status !== "pending");

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(93,64,55,0.5)", zIndex: 95, fontFamily: "'Nunito', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-2xl p-6 overflow-y-auto" style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: C.deep, fontWeight: 600 }}>🛠 Jodel Technologies — Admin</h2>
          <button style={{ ...btnSoft, padding: "4px 12px" }} onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-2 mb-4">
          <button style={tab(view === "payments")} onClick={() => setView("payments")}>💳 Payments</button>
          <button style={tab(view === "devices")} onClick={() => setView("devices")}>
            📱 Devices{pendingDevices.length ? ` (${pendingDevices.length})` : ""}
          </button>
        </div>

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

        {view === "devices" && (
          <>
            <p style={{ color: C.brownSoft, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              Approving a device signs out any other device on that account.
            </p>
            {pendingDevices.length === 0 && <p style={{ color: C.brownSoft, fontWeight: 700 }}>No devices waiting for approval. 🎉</p>}
            <div className="flex flex-col gap-2">
              {pendingDevices.map((d) => (
                <div key={d.id} className="p-3 flex flex-wrap justify-between items-center gap-2" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: C.deep }}>⏳ {d.user_email || "Guest account"}</div>
                    <div style={{ color: C.brownSoft, fontWeight: 700 }}>
                      {d.device_name || "Unknown device"} · {new Date(d.created_at).toLocaleString()}
                    </div>
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
      </div>
    </div>
  );
}
