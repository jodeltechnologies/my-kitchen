import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import Footer from "../ui/Footer";
import { APP_NAME } from "../config";

const C = { bg: "#FFF1F6", card: "#fff", border: "#F8BBD0", soft: "#FDE7EF", rose: "#D81B60", deep: "#AD1457", brown: "#5D4037", brownSoft: "#8D6E63" };
const input = { border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", background: "#FFF9FB", color: C.brown, outline: "none", width: "100%", fontFamily: "inherit" };
const btn = { background: C.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer", padding: "12px", width: "100%" };
const btnSoft = { ...btn, background: C.soft, color: C.deep, border: `1.5px solid ${C.border}` };

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const run = async (fn) => {
    setBusy(true); setMsg(null);
    const { error } = await fn();
    if (error) setMsg(error.message);
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: C.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;700;800&display=swap');`}</style>
      <div className="w-full max-w-md p-7" style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, boxShadow: "0 4px 24px rgba(216,27,96,0.12)" }}>
        <div className="text-center mb-5">
          <img src="/logo.svg" alt="My Kitchen" style={{ width: 76, height: 76, borderRadius: 20, margin: "0 auto 8px" }} />
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 36, fontWeight: 600, color: C.deep }}>{APP_NAME}</div>
          <div style={{ color: C.brownSoft, fontSize: 13, fontWeight: 700 }}>Sign in to your kitchen — one device at a time 🔐</div>
        </div>

        <div className="flex gap-2 mb-5">
          {["login", "signup"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              style={{ ...(mode === m ? btn : btnSoft), padding: "9px" }}>
              {m === "login" ? "Log in" : "Create account"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {mode === "signup" && (
            <input style={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {msg && <div style={{ color: C.rose, fontSize: 13, fontWeight: 700 }}>{msg}</div>}

          <button disabled={busy} style={btn} onClick={() =>
            mode === "login"
              ? run(() => supabase.auth.signInWithPassword({ email, password }))
              : run(() => supabase.auth.signUp({ email, password, options: { data: { full_name: name } } }))
          }>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up (starts as free trial)"}
          </button>

          <div className="text-center" style={{ color: C.brownSoft, fontSize: 12, fontWeight: 700 }}>— or —</div>

          <button disabled={busy} style={btnSoft} onClick={() => run(() => supabase.auth.signInAnonymously())}>
            👀 Continue as guest (trial — limited access)
          </button>

          <p style={{ fontSize: 12, color: C.brownSoft, textAlign: "center", marginTop: 4 }}>
            Guests and new accounts get a free taste of the recipe book. Full access is $20 for activation + first month, then just $5/month — pay by PayPal (instant) or MTN MoMo.
          </p>
        </div>
      </div>
      <div className="w-full max-w-md"><Footer /></div>
    </div>
  );
}
