import React, { useState } from "react";
import { getDeviceName } from "../lib/deviceId";
import { DEV } from "../config";

const C = { bg: "#FFF1F6", card: "#fff", border: "#F8BBD0", soft: "#FDE7EF", rose: "#D81B60", deep: "#AD1457", brown: "#5D4037", brownSoft: "#8D6E63" };
const btn = { background: C.rose, color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, cursor: "pointer", padding: "12px", width: "100%" };
const btnSoft = { ...btn, background: C.soft, color: C.deep, border: `1.5px solid ${C.border}` };

// New device is pending. The DEVELOPER approves it (not the user's other
// device). We open WhatsApp so the developer is alerted immediately.
export default function DevicePending({ session, onRecheck, onLogout }) {
  const [notified, setNotified] = useState(false);
  const email = session?.user?.email || "guest account";

  const alertDeveloper = () => {
    const msg =
      `Hello ${DEV.name}, I want to use My Kitchen on a new device.%0A%0A` +
      `Account: ${email}%0A` +
      `Device: ${getDeviceName()}%0A%0A` +
      `Please approve this device so I can log in.`;
    window.open(`${DEV.whatsappLink}?text=${msg}`, "_blank");
    setNotified(true);
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
          For your security, <b>My Kitchen</b> allows <b>one device per account</b>.
          A new device must be approved by the developer before it can be used.
        </p>

        <div className="flex flex-col gap-3 mt-6 text-left">
          <div className="p-3" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
            <b style={{ color: C.deep }}>Step 1:</b> Tap the button below to message the
            developer on WhatsApp. Your account and device are filled in automatically.
          </div>
          <button style={btn} onClick={alertDeveloper}>📲 Ask developer to approve</button>

          <div className="p-3" style={{ background: C.soft, borderRadius: 14, fontSize: 13 }}>
            <b style={{ color: C.deep }}>Step 2:</b> Once the developer approves (usually
            within a short while), tap below to enter.
          </div>
          <button style={btnSoft} onClick={onRecheck}>
            {notified ? "🔄 I've been approved — check now" : "🔄 Check approval status"}
          </button>

          <p style={{ color: C.brownSoft, fontSize: 12, textAlign: "center", marginTop: 4 }}>
            Developer: {DEV.name} · WhatsApp {DEV.whatsapp}
          </p>

          <button style={{ ...btnSoft, background: "transparent" }} onClick={onLogout}>Log out</button>
        </div>
      </div>
    </div>
  );
}
