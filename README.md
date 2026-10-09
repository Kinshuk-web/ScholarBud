# ScholarBud — fixed, upgraded, and secured

ScholarBud is a single-page AI study workspace (dashboard, tasks, calendar,
notes/documents/slides, an AI chatbot, quizzes, an AI study planner, text-to-speech,
real YouTube search, and shared "organisations" for classrooms).

This package is a repaired and extended version of your uploaded files. It keeps
everything that worked, fixes what didn't, and moves all API keys off the client.

---

## 1. What was broken (and is now fixed)

| # | Bug | Fix |
|---|-----|-----|
| 1 | **Fatal JS syntax error** — the Firebase config object was missing a comma after `appId`, which crashed the whole module script so **Google Sign-In and organisations never worked**. | Config moved to `config.js`; object is valid. |
| 2 | **AI never answered** — calls used the non-existent model `gemini-3-flash-preview` (404). | Current model + an automatic **fallback chain** if a model isn't available for a key. |
| 3 | **YouTube search was fake** — hardcoded placeholder cards. | Real YouTube Data API v3 search. |
| 4 | **"After a day I can't add tasks"** — the daily cleanup never stamped the date, so it wiped tasks on every save. | Date is stamped before clearing. |
| 5 | **`crypto.randomUUID()` crashes on `file://`.** | Safe `genId()` fallback. |
| 6 | **API keys shipped to the browser**, and the admin's Gemini key was copied into a **public** Firestore doc. | Keys live on the server; key-sharing removed. |
| 7 | **"I had issues connecting to the Gemini engines"** shown even with a correct key — the real error was hidden. | The chat now shows the **actual** error and a specific hint. |
| 8 | **Thinking-model responses** could be mis-parsed (`parts[0]` isn't always the answer). | Robust parsing across all response parts. |

---

## 2. What's new

- **Real YouTube search**, **working Scholar Buddy chatbot**, **Sarvam AI** (multilingual chat + Indian-language text-to-speech via Bulbul v3).
- **Gemini + Sarvam keys hidden** — routed through `server.js` so keys never reach the browser.
- **Organisations** now actually run (see bug #1), with read-only members and live sync.
- **Google sign-in restricted to organisations** — individuals never see a login (§6).
- **Chat engine switcher** — pick Gemini or Sarvam live, from the chat header (§3).
- **Shared owner API** — independent users can use *your* key with zero setup (§4).
- **Diagnostic errors** — failures now tell you exactly what went wrong (§7).

---

## 3. Switching between Sarvam and Gemini in the chatbot

There's an **Engine** dropdown in the Scholar Buddy chat header:

- **Gemini 3.8 Flash / 3.5 Flash / 3.5 Flash-Lite / auto**
- **Sarvam 105B / default**

Pick one and it's used immediately and remembered in the browser. The little status
line under "Scholar Buddy" shows *Gemini ready* / *Sarvam ready* (or *key needed*).
Gemini is required for the note/document/slide tools; Sarvam is great for
multilingual chat and is always used for the voice button.

---

## 4. Letting independent users run on YOUR API

You want individual users to be able to use Scholar Buddy on your account when they
haven't entered a key. The app resolves a key in this order:

1. **Server proxy** (best — keys hidden, see §5).
2. **The user's own key** (if they entered one in Settings).
3. **Your shared key** in `config.js` → `ownerApi`.

### Recommended: the server proxy
Deploy `server.js` with your keys in `.env` and point the app at it:

```js
proxyBaseUrl: 'same',                       // server serves the page, or
// proxyBaseUrl: 'https://your-app.onrender.com'
```

Then **every** user — individual or organisation — is served by your API and never
sees a key. No setup on their side.

### Quick-and-simple: the shared key
If you just hand out the HTML file, put your key in `config.js`:

```js
ownerApi: { geminiApiKey: 'AIzaSy...', sarvamApiKey: 'sk_...', youtubeApiKey: '...' }
```

Users with no key then run on yours automatically. Be aware this key is **visible in
the page source** — fine for a private/limited group, not for a public site. For a
public site, use the proxy.

---

## 5. Quick start

**Option A — Standalone (personal):** open `ScholarBud.html`, paste keys in Settings, choose *Use as Individual*.

**Option B — Secure server (recommended):**
```bash
cp .env.example .env          # fill in your keys
cp config.example.js config.js
node server.js                # or: npm start
# open http://localhost:8080
```

Deploy the same way on Render / Railway / a VPS: run `node server.js`, set the env
vars in the dashboard, and set `ALLOWED_ORIGINS` to your site URL.

---

## 6. Hosting on GitHub Pages (important)

GitHub Pages is **static hosting** — it serves files but cannot run `server.js`.
So if `proxyBaseUrl` is `'same'`, the app tries to POST to
`https://your-name.github.io/api/gemini`, and GitHub Pages replies **HTTP 405
(Method Not Allowed)**. That is exactly the error you saw.

Pick one:

**Option 1 — direct mode (works immediately, key is public)**
```js
// config.js
proxyBaseUrl: '',
ownerApi: { geminiApiKey: 'YOUR_GEMINI_KEY' }
```
The browser calls Gemini directly. Then **restrict the key** so a copied key is
useless elsewhere: Google Cloud Console → *APIs & Services → Credentials* → edit
the key → *Application restrictions → Websites* → add `https://YOUR-USERNAME.github.io/*`.

**Option 2 — keep keys hidden (deploy the proxy elsewhere)**
1. Push this repo (with `server.js`, `package.json`, `.env.example`) to GitHub.
2. On [Render](https://render.com) (free tier) → *New → Web Service* → pick the repo →
   build `npm install`, start `npm start`.
3. Add `GEMINI_API_KEY`, `SARVAM_API_KEY`, `YOUTUBE_API_KEY`, `ALLOWED_ORIGINS=https://YOUR-USERNAME.github.io` as environment variables.
4. In `config.js` set `proxyBaseUrl: 'https://your-service.onrender.com'`.

The app also **auto-detects** a static host: the first failed call flips it into
direct mode automatically, so if you have a direct key it will just start working.

## 6. Enabling Google sign-in for organisations only

Already the behaviour: **Individual** needs no Google login; **Create/Join
Organisation** requires it. To tighten it:

1. Restrict to your school's domain — in `config.js`: `allowedGoogleDomains: ['yourschool.edu']`.
2. In Firebase Console → *Authentication → Sign-in method* → enable **Google**;
   and add your hosting domain under *Authentication → Settings → Authorized domains*
   (Google sign-in fails with `auth/unauthorized-domain` until it's listed).

---

## 7. Troubleshooting

**"I couldn't reach the AI — Details: ..."** — read the *Details* line, it names the cause:
- `Model "..." is unavailable for this key (404)` → the app already auto-tries other
  models; if all fail, set a different `geminiModel` in `config.js` or pick another
  engine in the chat header.
- `API key not valid` → re-check the key in Settings / `.env`.
- `NO_GEMINI_KEY` / `NO_SARVAM_KEY` → no key configured; add one or connect the server.
- `quota` / `429` → rate limit; wait or switch engines.
- `ScholarBud server error 500` → the server is running but missing a key — check `.env` and `/api/health`.

**Where is the AI configured?** The status line under "Scholar Buddy" and the badge in
Settings show whether an engine is ready. `https://your-server/api/health` reports which
server keys loaded.

---

## 8. Security notes — please read

- **Rotate the Firebase key that was hardcoded in `ScholarBudv2.html`** — it's been shared, so treat it as public. Restrict or delete it in Google Cloud Console → *Credentials*.
- **Lock down Firestore.** Org data lives under `artifacts/{appId}/public/data/orgs`; without rules anyone can read/write it:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /artifacts/{appId}/public/data/orgs/{orgId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null;
        allow delete: if request.auth != null && resource.data.adminUserId == request.auth.uid;
      }
    }
  }
  ```
- **Never commit** `config.js` or `.env` (already git-ignored).
- The proxy has a rate limiter and request-size cap; put it behind HTTPS in production.

---

## 9. Maintenance tips

- If AI calls fail with a model error, change `GEMINI_MODEL` / `geminiModel`.
- To default to Sarvam, set `chatProvider: 'sarvam'` in `config.js`.
- To change the voice, set `sarvamSpeaker` to any Bulbul v3 voice (`anushka`, `rahul`, `priya`, …).
