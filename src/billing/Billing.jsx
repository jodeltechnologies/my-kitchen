import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { DEV, PLANS, toCFA, momoDialCode, momoTelLink } from "../config";

const C = { card: "#fff", border: "#F8BBD0", soft: "#FDE7EF", softer: "#FCD9E8", rose: "#D81B60", deep: "#AD1457", brown: "#5D4037", brownSoft: "#8D6E63", green: "#2E7D32", amber: "#B26A00" };
const btn = { background: C.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer" };
const btnSoft = { ...btn, background: C.soft, color: C.deep, border: `1.5px solid ${C.border}` };
const input = { border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 13px", background: "#FFF9FB", color: C.brown, outline: "none", width: "100%", fontFamily: "inherit" };

export default function Billing({ profile, onClose, onPaid }) {
  const isNew = !profile.has_paid_initiation;
  const plans = isNew ? PLANS.newUser : PLANS.renewal;
  const [plan, setPlan] = useState(plans[0]);
  const [method, setMethod] = useState(null); // 'paypal' | 'momo'
  const [momoRef, setMomoRef] = useState("");
  const [momoPhone, setMomoPhone] = useState("");
  const [pending, setPending] = useState(null);
  const [msg, setMsg] = useState(null);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState(null);
  const paypalRef = useRef(null);
  const cfa = toCFA(plan.usd);

  const redeem = async () => {
    if (!coupon.trim()) { setCouponMsg("Enter a coupon code."); return; }
    const { data, error } = await supabase.rpc("redeem_coupon", { p_code: coupon.trim() });
    if (error) { setCouponMsg(error.message); return; }
    setCouponMsg(data || "Coupon applied!");
    // If it granted access, refresh the account.
    if (data && data.toLowerCase().includes("full access")) {
      setTimeout(() => onPaid(), 1200);
    }
  };

  /* existing pending MoMo payment? */
  useEffect(() => {
    supabase.from("payments").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(1)
      .then(({ data }) => data && data[0] && setPending(data[0]));
  }, []);

  /* PayPal buttons — automatic activation on capture */
  useEffect(() => {
    if (method !== "paypal") return;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) { setMsg("PayPal is not configured yet (add VITE_PAYPAL_CLIENT_ID in Vercel)."); return; }
    const render = () => {
      if (!window.paypal || !paypalRef.current) return;
      paypalRef.current.innerHTML = "";
      window.paypal.Buttons({
        createOrder: (d, actions) => actions.order.create({
          purchase_units: [{ description: `My Kitchen — ${plan.label}`, amount: { currency_code: "USD", value: plan.usd.toFixed(2) } }],
        }),
        onApprove: async (d, actions) => {
          const details = await actions.order.capture();
          const { error } = await supabase.rpc("record_paypal_payment", { p_period: plan.period, p_reference: details.id });
          if (error) setMsg(error.message);
          else { setMsg(null); onPaid(); }
        },
        onError: () => setMsg("PayPal payment failed — please try again."),
      }).render(paypalRef.current);
    };
    if (window.paypal) render();
    else {
      const s = document.createElement("script");
      s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      s.onload = render;
      document.body.appendChild(s);
    }
  }, [method, plan]);

  const submitMomo = async () => {
    if (!momoRef.trim() || !momoPhone.trim()) { setMsg("Enter the MoMo phone number used and the transaction ID."); return; }
    const { data, error } = await supabase.rpc("submit_momo_payment", {
      p_period: plan.period, p_reference: momoRef.trim(), p_phone: momoPhone.trim(), p_cfa: cfa,
    });
    if (error) { setMsg(error.message); return; }
    setPending({ id: data, method: "momo", status: "pending", amount_cfa: cfa });
    setMsg(null);
    // Notify the developer on WhatsApp so he can validate the account
    const text = encodeURIComponent(
      `Hello ${DEV.name}! I just paid ${cfa.toLocaleString()} CFA (${plan.label}) for My Kitchen via MTN MoMo.\nPhone used: ${momoPhone}\nTransaction ID: ${momoRef}\nPlease validate my account. Thank you!`
    );
    window.open(`${DEV.whatsappLink}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(93,64,55,0.5)", zIndex: 90, fontFamily: "'Nunito', sans-serif" }} onClick={onClose}>
      <div className="w-full max-w-lg p-6 overflow-y-auto" style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <h2 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, color: C.deep, fontWeight: 600 }}>⭐ Get full access</h2>
          <button style={{ ...btnSoft, padding: "4px 12px" }} onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: C.brownSoft, marginTop: 4 }}>
          {isNew
            ? "First payment is $20 (activation + your first month). After that it's just $5/month — or grab a bundle and save."
            : "Renew your subscription — $5/month, with discounts on bundles."}
        </p>

        {/* Pending momo notice */}
        {pending && (
          <div className="p-3 mt-4" style={{ background: "#FFF3E0", borderRadius: 14, fontSize: 13, color: C.amber, fontWeight: 700 }}>
            ⏳ You have a MoMo payment awaiting validation by {DEV.name}. You'll get full access as soon as it's approved.
            If it's taking long, message us on <a href={DEV.whatsappLink} target="_blank" rel="noreferrer" style={{ color: C.deep }}>WhatsApp</a>.
          </div>
        )}

        {/* Plan picker */}
        <div className="flex flex-col gap-2 mt-4">
          {plans.map((p) => (
            <button key={p.period} onClick={() => setPlan(p)}
              className="flex justify-between items-center p-3 text-left"
              style={{ background: plan.period === p.period ? C.softer : C.soft, border: `2px solid ${plan.period === p.period ? C.rose : C.border}`, borderRadius: 14, cursor: "pointer" }}>
              <span>
                <span style={{ fontWeight: 800, color: C.deep }}>{p.label}</span>
                <span style={{ display: "block", fontSize: 12, color: C.green, fontWeight: 700 }}>{p.note}</span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 20, color: C.rose, fontWeight: 600 }}>${p.usd}</span>
                <span style={{ display: "block", fontSize: 11, color: C.brownSoft, fontWeight: 700 }}>≈ {toCFA(p.usd).toLocaleString()} CFA</span>
              </span>
            </button>
          ))}
        </div>

        {/* Method picker */}
        <div className="flex gap-2 mt-4">
          <button style={{ ...(method === "paypal" ? btn : btnSoft), padding: "10px", flex: 1 }} onClick={() => setMethod("paypal")}>
            💳 PayPal — ${plan.usd} (instant)
          </button>
          <button style={{ ...(method === "momo" ? btn : btnSoft), padding: "10px", flex: 1 }} onClick={() => setMethod("momo")}>
            📱 MTN MoMo — {cfa.toLocaleString()} CFA
          </button>
        </div>

        {method === "paypal" && (
          <div className="mt-4">
            <p style={{ fontSize: 13, color: C.brownSoft, marginBottom: 8 }}>
              PayPal payments are <b>automatic</b> — your account unlocks the moment the payment completes. Charged in USD.
            </p>
            <div ref={paypalRef} />
          </div>
        )}

        {method === "momo" && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="p-3" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
              <b style={{ color: C.deep }}>Step 1 — Pay:</b> tap the button below and your phone's dialer opens
              with the MoMo code pre-filled: <b>{momoDialCode(cfa)}</b>. Just press call and confirm with your MoMo PIN.
            </div>
            <a href={momoTelLink(cfa)} style={{ ...btn, padding: "12px", textAlign: "center", textDecoration: "none", display: "block" }}>
              📞 Dial to pay {cfa.toLocaleString()} CFA
            </a>
            <div className="p-3" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
              <b style={{ color: C.deep }}>Step 2 — Tell us:</b> enter the number you paid from and the MoMo
              transaction ID from your SMS. This opens WhatsApp to notify {DEV.name}, who will
              <b> validate your account manually</b> (MoMo is not automatic like PayPal).
            </div>
            <input style={input} placeholder="MoMo phone number used (e.g. 6XXXXXXXX)" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)} />
            <input style={input} placeholder="MoMo transaction ID (from the SMS)" value={momoRef} onChange={(e) => setMomoRef(e.target.value)} />
            <button style={{ ...btn, padding: "12px" }} onClick={submitMomo}>✅ I've paid — notify {DEV.name} for validation</button>
          </div>
        )}

        {msg && <div style={{ color: C.rose, fontSize: 13, fontWeight: 700, marginTop: 10 }}>{msg}</div>}

        <p style={{ fontSize: 11, color: C.brownSoft, marginTop: 14, textAlign: "center" }}>
          Questions? WhatsApp {DEV.whatsapp} · {DEV.email}
        </p>
      </div>
    </div>
  );
}
