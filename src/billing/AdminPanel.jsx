import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const C = { card: "#fff", border: "#F8BBD0", soft: "#FDE7EF", rose: "#D81B60", deep: "#AD1457", brownSoft: "#8D6E63", green: "#2E7D32" };
const btn = { background: C.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer" };
const btnSoft = { ...btn, background: C.soft, color: C.deep, border: `1.5px solid ${C.border}` };

export default function AdminPanel({ onClose }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50);
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);

  const review = async (id, approve) => {
    setBusy(true);
    await supabase.rpc("review_payment", { p_id: id, p_approve: approve });
    await load();
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(93,64,55,0.5)", zIndex: 95, fontFamily: "'Nunito', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-2xl p-6 overflow-y-auto" style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, color: C.deep, fontWeight: 600 }}>🛠 Jodel Technologies — Payment validation</h2>
          <button style={{ ...btnSoft, padding: "4px 12px" }} onClick={onClose}>✕</button>
        </div>
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
      </div>
    </div>
  );
}
