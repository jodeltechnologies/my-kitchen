# 🍲 My Kitchen — by Jodel Technologies

Pantry tracking, age-aware portion scaling, a Nigerian + Cameroonian recipe book, and an automatic weekly cooking planner — with login, single-device lock, guest trial, and cloud sync.

**Stack:** React (Vite) · Supabase (auth + database) · Vercel (hosting) · GitHub (code) · Capacitor (APK)

---

## How access control works

| Feature | 👀 Guest / trial | ⭐ Full access |
|---|---|---|
| Browse recipes | First 6 only | All recipes |
| Weekly planner | 🔒 Locked | ✅ |
| Cook & pantry deduction | 🔒 Locked | ✅ |
| Cloud sync | 🔒 Locked | ✅ |
| Can log in | ✅ | ✅ |

- Every new signup starts as a **guest** (trial). Tapping **⭐ Buy full access** opens the billing screen (see "Pricing & payments" below).
- **One device per account.** The first device you log in on becomes the *active* device. Logging in anywhere else — even after logging out of the first — puts the new device in a **pending** state until you approve it, either from the old device (an approval banner appears there) or by entering an email code. Approving a new device signs the old one out.

---

## Step 1 — Supabase (database + login)

1. Go to [supabase.com](https://supabase.com) → **New project** (free tier is fine).
2. Open **SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**.
3. Go to **Authentication → Providers**:
   - **Email**: enabled (it is by default). For quick testing you may turn **off** "Confirm email".
   - **Anonymous sign-ins**: turn **ON** (this powers the "Continue as guest" button).
4. Go to **Authentication → Email Templates → Magic Link / OTP** and make sure the template includes `{{ .Token }}` so users receive a **6-digit code** (used for approving a new device by email).
5. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**.

## Step 2 — GitHub

```bash
cd ite-nri
git init
git add .
git commit -m "Ite Nri v1"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/YOUR-USERNAME/ite-nri.git
git push -u origin main
```

`.env` is git-ignored — your keys never reach GitHub.

## Step 3 — Vercel (hosting)

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import your `ite-nri` GitHub repo.
2. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
4. Click **Deploy**. You'll get a URL like `https://ite-nri.vercel.app`.
5. Back in Supabase: **Authentication → URL Configuration** → set **Site URL** to your Vercel URL.

Every `git push` now redeploys automatically.

## Step 4 — APK (linked to the hosted version)

The APK is a native Android shell that **loads your live Vercel site**, so users always see the latest version without reinstalling — exactly the "link up with the hosted version" behaviour.

1. Edit `capacitor.config.json` and replace `https://YOUR-APP.vercel.app` with your real Vercel URL.
2. Install Capacitor and add Android:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npm run build
   npx cap add android
   npx cap sync
   ```
3. Open in Android Studio and build:
   ```bash
   npx cap open android
   ```
   Then **Build → Build App Bundle(s)/APK(s) → Build APK(s)**.
   The APK appears at `android/app/build/outputs/apk/debug/app-debug.apk`.
4. For the Play Store, use **Build → Generate Signed Bundle/APK** with a keystore.

> Requirements: Android Studio + JDK 17. The device needs internet since the app loads the hosted version. (If you ever want an offline-capable APK instead, remove the `server.url` block from `capacitor.config.json` and the APK will bundle the built files.)

## Step 5 — Pricing & payments

| Plan | New user (includes $20 activation) | Renewal |
|---|---|---|
| 1 month | **$20** | **$5** |
| 6 months | **$40** (save $5) | **$27** (save $3) |
| 12 months | **$65** (save $10) | **$50** — 2 months free |

All prices are enforced **in the database** (`price_for()` in `schema.sql`), so the client can never pay less by tampering. USD→CFA uses `USD_TO_XAF` in `src/config.js` (currently 600 — update it when the rate moves).

### 💳 PayPal — automatic
1. Create an app at [developer.paypal.com](https://developer.paypal.com) → copy the **Client ID**.
2. Add `VITE_PAYPAL_CLIENT_ID` to Vercel env vars (and your local `.env`).
3. When a user pays, the app records the capture and **unlocks the account instantly** — no action needed from you. Charged in USD.
4. Production hardening (recommended before scale): verify each order server-side with a Supabase Edge Function + PayPal webhook before calling `apply_subscription`.

### 📱 MTN MoMo — manual validation by you
1. The user picks a plan; the app shows the CFA amount and a **"Dial to pay"** button that opens their dialer pre-filled with `*126*9*678662454*AMOUNT#` — they just press call and confirm with their PIN.
2. They then submit the paying phone number + MoMo transaction ID. This creates a **pending** payment and opens WhatsApp with a pre-written message to you (+237 678 662 454) so you're informed immediately.
3. You check your MoMo, log in to the app with **jodeltechnologies92@gmail.com**, and a **🛠 Validate payments** button appears (admin-only). Tap it, see the pending payment (phone, ref, amount), and hit **✅ Validate** — the user's account activates for the paid period. Reject fakes with one tap.

## Step 6 — App icon

`public/logo.svg` is the master logo (pink pot, steam, flower — used in the header, login screen, and favicon). `resources/icon.png` is the 1024×1024 Android icon. Generate all Android icon sizes with:
```bash
npm install @capacitor/assets --save-dev
npx capacitor-assets generate --android
```

## Step 7 — APK download on the web portal

The footer of the site has a **"📲 Download the Android app (APK)"** button pointing to `/my-kitchen.apk`. After building your APK (Step 4), just copy it into the project and push:
```bash
cp android/app/build/outputs/apk/release/app-release.apk public/my-kitchen.apk
git add public/my-kitchen.apk && git commit -m "publish apk" && git push
```
Vercel serves everything in `public/` as-is, so the button starts working immediately.

## Step 8 — Code protection (obfuscation)

`npm run build` automatically runs **javascript-obfuscator** on the output with:
- RC4-encoded string arrays (all text/logic strings scrambled)
- Control-flow flattening + dead-code injection (logic is unreadable)
- Self-defending output (breaks if beautified) and console output disabled

Honest note: obfuscation strongly deters casual copying and makes reverse-engineering painful, but no client-side code is 100% uncrackable — which is exactly why the *real* protection lives server-side: prices, subscription state, and the device lock are all enforced in Supabase where nobody can reach them. To tune it, edit the `obfuscate` script in `package.json`.

---

## Run locally

```bash
cp .env.example .env   # fill in your Supabase keys
npm install
npm run dev
```

## Project map

```
src/App.jsx               → session, device lock, approval banner, plan gate
src/auth/AuthScreen.jsx   → login / signup / guest trial
src/auth/DevicePending.jsx→ "new device needs approval" screen (+ email OTP)
src/kitchen/KitchenApp.jsx→ the kitchen: pantry, family, recipes, weekly plan
src/lib/supabase.js       → Supabase client
src/lib/deviceId.js       → stable per-device ID
src/billing/Billing.jsx   → plans, PayPal (auto) & MoMo (manual) checkout
src/billing/AdminPanel.jsx→ developer-only MoMo validation panel
src/ui/Footer.jsx         → Jodel Technologies credits + APK download
src/config.js             → prices, CFA rate, MoMo dial code, contacts
public/logo.svg           → master logo / favicon
resources/icon.png        → 1024px Android app icon
supabase/schema.sql       → tables, device lock, payments, security policies
capacitor.config.json     → APK shell pointing at the hosted URL
```

---
**My Kitchen** · Developed by **Jodel Technologies** · WhatsApp +237 678 662 454 · jodeltechnologies92@gmail.com · [jodeltech.vercel.app](https://jodeltech.vercel.app)
