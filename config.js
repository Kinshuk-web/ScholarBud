// ####################################################################
//  >>>  PASTE YOUR API KEYS BELOW  <<<
//  Search this file for:   ownerApi: {
//  Put your key inside the quotes, e.g.  geminiApiKey: 'AIzaSy...',
//  Then save and refresh the app. This is the ONLY file you edit.
//  DO NOT edit ScholarBud.html.
//
//  On GitHub Pages: set proxyBaseUrl to '' (see the notes below).
// ####################################################################

// ============================================================
//  ScholarBud configuration  (this file is config.js)
// ------------------------------------------------------------
//  config.js is git-ignored. Do NOT commit real keys to a public repo.
// ============================================================
//
//  ------------------------------------------------------------------
//  IF YOU HOSTED ON GITHUB PAGES (or Netlify, Vercel static, etc.)
//  ------------------------------------------------------------------
//  A static host cannot run server.js, so there is no /api/... backend.
//  Pick ONE of these two options:
//
//  OPTION 1 - simplest, works immediately (key is PUBLIC):
//      proxyBaseUrl: '',
//      ownerApi: { geminiApiKey: 'YOUR_GEMINI_KEY' }
//    The browser calls Gemini directly. Anyone can read the key from the
//    page source, so lock it down: in Google Cloud Console -> APIs &
//    Services -> Credentials -> edit the key -> Application restrictions ->
//    Websites -> add  https://YOUR-USERNAME.github.io/*
//
//  OPTION 2 - keys hidden (needs a backend somewhere else):
//      proxyBaseUrl: 'https://your-scholarbud-server.onrender.com',
//    Deploy server.js to Render / Railway / Fly.io, put the keys in its
//    .env, then paste that URL above.
//  ------------------------------------------------------------------
//
window.SCHOLARBUD_CONFIG = {

    // '' = direct browser calls | 'same' = server that served this page
    // (only works if server.js is actually running) | or a full URL.
    proxyBaseUrl: '',

    // Gemini model for chat/quiz/planner. If this one isn't available for a
    // key, a short fallback list is tried automatically.
    geminiModel: 'gemini-3.8-flash',

    // Default chat engine: 'gemini' or 'sarvam'. Users can change it live
    // from the dropdown in the Scholar Buddy chat header.
    chatProvider: 'gemini',

    // Default Sarvam voice for the "AI Voice Aloud" button (Bulbul v3).
    sarvamSpeaker: 'shubh',

    // ------------------------------------------------------------
    //  >>>  PASTE YOUR API KEY(S) HERE  <<<
    // ------------------------------------------------------------
    // Independent users with no key of their own fall back to these, so
    // your account can power Scholar Buddy for them.
    ownerApi: {
        geminiApiKey: '',     // e.g. 'AIzaSy...'   <- needed for the chatbot
        sarvamApiKey: '',     // e.g. 'sk_...'      <- voice + multilingual chat
        youtubeApiKey: ''     // YouTube Data API v3 key  <- real video search
    },

    // ---- Firebase (organisations / cloud sync + Google sign-in) ----
    // Paste the web config from Firebase Console -> Project settings.
    // These values are public by design; protect data with Firestore rules.
    firebase: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    },

    // Optional: lock organisation Google sign-in to specific Workspace
    // domains, e.g. ['myschool.edu']. Empty array = any Google account.
    allowedGoogleDomains: []
};
