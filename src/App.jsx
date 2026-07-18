import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { getDeviceId, getDeviceName } from "./lib/deviceId";
import AuthScreen from "./auth/AuthScreen";
import DevicePending from "./auth/DevicePending";
import KitchenApp from "./kitchen/KitchenApp";
import Billing from "./billing/Billing";
import AdminPanel from "./billing/AdminPanel";
import { DEV } from "./config";

const C = { rose: "#D81B60", deep: "#AD1457", border: "#F8BBD0" };

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [deviceStatus, setDeviceStatus] = useState(null); // active | pending | revoked
  const [profile, setProfile] = useState(null);
  const [showBilling, setShowBilling] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [recovery, setRecovery] = useState(false); // user clicked a reset link

  /* ---- auth session ---- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(s ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /* ---- device registration & profile ---- */
  const refresh = useCallback(async () => {
    if (!session) return;
    const { data: status } = await supabase.rpc("register_device", {
      p_device_id: getDeviceId(),
      p_name: getDeviceName(),
    });
    setDeviceStatus(status || "pending");

    const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    setProfile(prof || { plan: "guest", full_name: "Guest" });

    // Keep the admin flag in sync with the admins table, then re-read.
    await supabase.rpc("sync_admin_flag");
    const { data: prof2 } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (prof2) setProfile(prof2);
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  /* Poll for pending-device requests while active (every 20s) */
  useEffect(() => {
    if (deviceStatus !== "active") return;
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, [deviceStatus, refresh]);

  const logout = async () => {
    await supabase.auth.signOut();
    setDeviceStatus(null); setProfile(null);
  };

  const upgrade = () => setShowBilling(true);

  const isAdmin =
    profile?.is_admin === true ||
    (session?.user?.email || "").toLowerCase() === (DEV.email || "").toLowerCase();

  // Full access = admin, OR plan is 'full' and not expired (null expiry = lifetime).
  const fullAccess =
    isAdmin ||
    (profile?.plan === "full" &&
      (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date()));
  const effProfile = profile ? { ...profile, plan: fullAccess ? "full" : "guest" } : null;

  const cloudSave = async (data) => {
    if (!session) return { error: { message: "Not signed in" } };
    return supabase.from("kitchen_state").upsert({ user_id: session.user.id, data, updated_at: new Date().toISOString() });
  };
  const cloudLoad = async () => {
    if (!session) return null;
    const { data } = await supabase.from("kitchen_state").select("data").eq("user_id", session.user.id).single();
    return data ? data.data : null;
  };

  /* ---- render ---- */
  if (session === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF1F6", fontFamily: "sans-serif", color: C.deep, fontWeight: 700 }}>🍲 Warming the pot…</div>;
  }
  if (recovery && session) {
    return <SetNewPassword onDone={() => setRecovery(false)} onCancel={async () => { setRecovery(false); await logout(); }} />;
  }
  if (!session) return <AuthScreen />;
  if (deviceStatus && deviceStatus !== "active" && !isAdmin) {
    return <DevicePending session={session} onRecheck={refresh} onLogout={logout} />;
  }
  if (!profile || !deviceStatus) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF1F6", fontFamily: "sans-serif", color: C.deep, fontWeight: 700 }}>🔐 Checking your device…</div>;
  }

  return (
    <>
      <KitchenApp profile={effProfile} session={session} onLogout={logout} onUpgrade={upgrade} onRedeemed={refresh} cloudSave={cloudSave} cloudLoad={cloudLoad} />
      {showBilling && (
        <Billing profile={profile} onClose={() => setShowBilling(false)}
          onPaid={async () => { await refresh(); setShowBilling(false); }} />
      )}
      {isAdmin && (
        <button onClick={() => setShowAdmin(true)}
          style={{ position: "fixed", bottom: 18, right: 18, zIndex: 80, background: "#AD1457", color: "#fff", border: "none", borderRadius: 999, padding: "12px 18px", fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,0.25)", fontFamily: "'Nunito', sans-serif" }}>
          🛠 Validate payments
        </button>
      )}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}

/* ---- Set a new password after clicking a reset link ---- */
function SetNewPassword({ onDone, onCancel }) {
  const CC = { bg: "#FFF1F6", card: "#fff", border: "#F8BBD0", soft: "#FDE7EF", rose: "#D81B60", deep: "#AD1457", brown: "#5D4037", brownSoft: "#8D6E63" };
  const input = { border: `1.5px solid ${CC.border}`, borderRadius: 12, padding: "11px 14px", background: "#FFF9FB", color: CC.brown, outline: "none", width: "100%", fontFamily: "inherit" };
  const btn = { background: CC.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer", padding: "12px", width: "100%" };
  const btnSoft = { ...btn, background: CC.soft, color: CC.deep, border: `1.5px solid ${CC.border}` };

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [ok, setOk] = useState(false);

  const save = async () => {
    if (pw.length < 6) { setMsg("Password should be at least 6 characters."); return; }
    if (pw !== pw2) { setMsg("The two passwords don't match."); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setOk(true);
    setTimeout(onDone, 1500);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, background: CC.bg, fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;700;800&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 420, padding: 28, background: CC.card, border: `1.5px solid ${CC.border}`, borderRadius: 24, boxShadow: "0 4px 24px rgba(216,27,96,0.12)" }}>
        <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 26, fontWeight: 600, color: CC.deep, marginBottom: 4 }}>Set a new password 🔑</div>
        <p style={{ color: CC.brownSoft, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Choose a new password for your account.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input style={input} type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <input style={input} type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
          {msg && <div style={{ color: CC.rose, fontSize: 13, fontWeight: 700 }}>{msg}</div>}
          {ok && <div style={{ color: "#2E7D32", fontSize: 13, fontWeight: 700 }}>✅ Password updated! Taking you in…</div>}
          <button disabled={busy || ok} style={btn} onClick={save}>{busy ? "Saving…" : "Save new password"}</button>
          <button disabled={busy} style={btnSoft} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
