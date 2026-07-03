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
  const [pendingDevices, setPendingDevices] = useState([]);
  const [showBilling, setShowBilling] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  /* ---- auth session ---- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
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

    const { data: pend } = await supabase
      .from("devices").select("*")
      .eq("user_id", session.user.id).eq("status", "pending")
      .neq("device_id", getDeviceId());
    setPendingDevices(pend || []);
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

  const isAdmin = session?.user?.email === DEV.email;

  // Full access = plan is 'full' AND the subscription hasn't expired.
  const fullAccess =
    profile?.plan === "full" &&
    (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date());
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
  if (!session) return <AuthScreen />;
  if (deviceStatus && deviceStatus !== "active") {
    return <DevicePending session={session} onRecheck={refresh} onLogout={logout} />;
  }
  if (!profile || !deviceStatus) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF1F6", fontFamily: "sans-serif", color: C.deep, fontWeight: 700 }}>🔐 Checking your device…</div>;
  }

  return (
    <>
      {pendingDevices.length > 0 && (
        <div style={{ position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 100, background: "#fff", border: `2px solid ${C.rose}`, borderRadius: 16, padding: "12px 16px", boxShadow: "0 6px 24px rgba(0,0,0,0.18)", maxWidth: 420, width: "92%", fontFamily: "'Nunito', sans-serif" }}>
          <div style={{ fontWeight: 800, color: C.deep, fontSize: 14 }}>🔔 New device wants to use your account</div>
          {pendingDevices.map((d) => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#5D4037" }}>{d.device_name || "Unknown device"}</span>
              <span style={{ display: "flex", gap: 6 }}>
                <button style={{ background: C.rose, color: "#fff", border: "none", borderRadius: 999, padding: "5px 14px", fontWeight: 700, cursor: "pointer" }}
                  onClick={async () => { await supabase.rpc("approve_device", { p_row: d.id }); logout(); }}>
                  Approve (signs this device out)
                </button>
                <button style={{ background: "#FDE7EF", color: C.deep, border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "5px 14px", fontWeight: 700, cursor: "pointer" }}
                  onClick={async () => { await supabase.rpc("deny_device", { p_row: d.id }); refresh(); }}>
                  Deny
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
      <KitchenApp profile={effProfile} session={session} onLogout={logout} onUpgrade={upgrade} cloudSave={cloudSave} cloudLoad={cloudLoad} />
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
