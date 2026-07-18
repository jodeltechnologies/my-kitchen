/* ===== My Kitchen — business configuration ===== */
export const APP_NAME = "My Kitchen";

export const DEV = {
  name: "Jodel Technologies",
  whatsapp: "+237678662454",
  whatsappLink: "https://wa.me/237678662454",
  email: "jdtechnologies92@gmail.com",
  website: "https://jodeltech.vercel.app",
  momoNumber: "678662454",
};

// Exchange rate used to convert USD prices to CFA for MTN MoMo.
// Update whenever the market moves.
export const USD_TO_XAF = 600;

// Pricing (USD). First-time plans include the $20 activation.
export const PLANS = {
  newUser: [
    { period: "first",        label: "Activation + 1 month",   usd: 20, note: "Standard start" },
    { period: "first6months", label: "Activation + 6 months",  usd: 40, note: "Save $5" },
    { period: "firstyearly",  label: "Activation + 12 months", usd: 65, note: "Best value — save $10" },
  ],
  renewal: [
    { period: "monthly", label: "1 month",   usd: 1.67, note: "Standard renewal" },
    { period: "6months", label: "6 months",  usd: 9,    note: "Save ~1,000 CFA" },
    { period: "yearly",  label: "12 months", usd: 17,   note: "Best value — save ~3,000 CFA" },
  ],
};

export const toCFA = (usd) => Math.round((usd * USD_TO_XAF) / 100) * 100;

// MTN MoMo USSD autofill: *126*9*RECEIVER*AMOUNT_CFA#
export const momoDialCode = (cfa) => `*126*9*${DEV.momoNumber}*${cfa}#`;
export const momoTelLink = (cfa) => `tel:${encodeURIComponent(momoDialCode(cfa))}`;

// Where the APK is served from (drop the built APK into /public).
export const APK_PATH = "/my-kitchen.apk";
