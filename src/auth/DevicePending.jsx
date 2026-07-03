import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { getDeviceId } from "../lib/deviceId";

const C = { bg: "#FFF1F6", card: "#fff", border: "#F8BBD0", soft: "#FDE7EF", rose: "#D81B60", deep: "#AD1457", brown: "#5D4037", brownSoft: "#8D6E63" };
const btn = { background: C.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer", padding: "12px", width: "100%" };
const btnSoft = { ...btn, background: C.soft, color: C.deep, border: `1.5px solid ${C.border}` };
const input = { border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", background: "#FFF9FB", color: C.brown, outline: "none", width: "100%", fontFamily: "inherit" };

export default function DevicePending({ session, onRecheck, onLogout }) {
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const email = session?.user?.email;

  const sendOtp = async () => {
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) setMsg(error.message); else setOtpSent(true);
    setBusy(false);
  };

  const verifyAndClaim = async () => {
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (error) { setMsg(error.message); setBusy(false); return; }
    const { error: e2 } = await supabase.rpc("claim_device", { p_device_id: getDeviceId() });
    if (e2) setMsg(e2.message);
    setBusy(false);
    onRecheck();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;700;800&display=swap');`}</style>
      <div className="w-full max-w-md p-7 text-center" style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24 }}>
        <div style={{ fontSize: 44 }}>🔐📱</div>
        <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 24, color: C.deep, fontWeight: 600, marginTop: 6 }}>
          New device — approval needed
        </h1>
        <p style={{ color: C.brownSoft, fontSize: 14, marginTop: 8 }}>
          Your account is already linked to another device. Ite Nri allows
          <b> one active device per account</b>, so this device is waiting for approval.
        </p>

        <div className="flex flex-col gap-3 mt-6 text-left">
          <div className="p-3" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
            <b style={{ color: C.deep }}>Option 1:</b> Open Ite Nri on your other device — an
            approval banner will appear there. Approve, then come back and tap below.
          </div>
          <button style={btnSoft} disabled={busy} onClick={onRecheck}>🔄 I've approved — check again</button>

          {email ? (
            <>
              <div className="p-3" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
                <b style={{ color: C.deep }}>Option 2:</b> Lost the old device or already logged
                out of it? Prove it's you with a code sent to <b>{email}</b>. This device
                becomes the active one and the old device is signed out.
              </div>
              {!otpSent ? (
                <button style={btn} disabled={busy} onClick={sendOtp}>📧 Email me an approval code</button>
              ) : (
                <>
                  <input style={input} placeholder="Enter the 6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
                  <button style={btn} disabled={busy || code.length < 6} onClick={verifyAndClaim}>✅ Verify & use this device</button>
                </>
              )}
            </>
          ) : (
            <div className="p-3" style={{ background: "#FFF3E0", borderRadius: 14, fontSize: 13, color: "#B26A00", fontWeight: 700 }}>
              Guest accounts have no email, so they can only be approved from the previous device.
            </div>
          )}

          {msg && <div style={{ color: C.rose, fontSize: 13, fontWeight: 700 }}>{msg}</div>}
          <button style={{ ...btnSoft, background: "transparent" }} onClick={onLogout}>Log out</button>
        </div>
      </div>
    </div>
  );
}
