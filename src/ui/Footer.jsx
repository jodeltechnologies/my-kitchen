import React from "react";
import { DEV, APK_PATH } from "../config";

const C = { deep: "#AD1457", rose: "#D81B60", border: "#F8BBD0", brownSoft: "#8D6E63" };

export default function Footer() {
  const link = { color: C.deep, fontWeight: 800, textDecoration: "none" };
  return (
    <footer className="text-center px-4 py-6 mt-4" style={{ borderTop: `1.5px dashed ${C.border}`, fontFamily: "'Nunito', sans-serif" }}>
      <a href={APK_PATH} download
        style={{ display: "inline-block", background: C.rose, color: "#fff", borderRadius: 999, padding: "10px 22px", fontWeight: 800, textDecoration: "none", fontSize: 14 }}>
        📲 Download the Android app (APK)
      </a>
      <div style={{ fontSize: 13, color: C.brownSoft, fontWeight: 700, marginTop: 12 }}>
        Developed with ❤️ by <b style={{ color: C.deep }}>{DEV.name}</b>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2" style={{ fontSize: 13 }}>
        <a style={link} href={DEV.whatsappLink} target="_blank" rel="noreferrer">💬 WhatsApp {DEV.whatsapp}</a>
        <a style={link} href={`mailto:${DEV.email}`}>✉️ {DEV.email}</a>
        <a style={link} href={DEV.website} target="_blank" rel="noreferrer">🌐 jodeltech.vercel.app</a>
      </div>
    </footer>
  );
}
