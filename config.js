// ####################################################################
//  >>>  PASTE YOUR API KEYS BELOW  <<<
//  Search this file for the line:   ownerApi: {
//  Put your key inside the quotes on that line, e.g.
//      geminiApiKey: 'AIzaSyABCDEF...',
//  Then save this file and refresh the app. That is the only file you edit.
//  DO NOT edit ScholarBud.html.
// ####################################################################

// ============================================================
//  ScholarBud configuration  (copy this file to "config.js")
// ------------------------------------------------------------
//  config.js is git-ignored. Do NOT commit real keys to a public
//  repository. In production, prefer the server proxy so no key
//  ever reaches the browser.
// ============================================================
window.SCHOLARBUD_CONFIG = {

    // ---- AI routing ----
    // ''      -> talk to the providers directly from the browser
    //            (uses the user's own key, or the shared owner key below)
    // 'same'  -> use the ScholarBud server that served this page (recommended:
    //            keys stay on the server). Falls back to direct when opened as a file.
    // 'https://your-app.onrender.com' -> a remote ScholarBud server
    proxyBaseUrl: 'same',

    // Default Gemini model for chat/quiz/planner. If this exact model isn't
    // available for a key, the app automatically tries a short fallback list
    // (see GEMINI_FALLBACKS in ScholarBud.html).
    geminiModel: 'gemini-3.8-flash',

    // Default chat engine: 'gemini' or 'sarvam'. Users can change this live
    // from the dropdown in the Scholar Buddy chat header.
    chatProvider: 'gemini',

    // Default Sarvam voice for the "AI Voice Aloud" button (Bulbul v3).
    sarvamSpeaker: 'shubh',

    // ------------------------------------------------------------
    //  SHARED / OWNER KEYS  (this is "your API" for independent users)
    // ------------------------------------------------------------
    // If a user has NOT entered their own key, Scholar Buddy falls back to
    // these, so independent users can use YOUR account with no setup.
    // Order of use: server proxy  ->  user's own key  ->  these keys.
    //
    // NOTE: in direct mode these keys are visible in the page source, so they
    // are only safe for a private/limited deployment. For a public site, leave
    // these blank and use the server proxy (server.js) instead.
    ownerApi: {
        geminiApiKey: 'AIzaSyCLxnyhbUXCRCd89aTrbDxJMbNZX1Zy9YY',     // e.g. 'AIzaSy...'
        sarvamApiKey: 'sk_mf32x49g_oSndk437IjpFSyK5uVbCMwsY',     // e.g. 'sk_...'
        youtubeApiKey: 'AIzaSyCdAhXR_g0XT17aiWzHA3URoaCGi47pN4c'     // YouTube Data API v3 key
    },

    // ---- Direct-mode keys for the CURRENT user (optional) ----
    // Normally left blank; users paste their own key in Settings instead.
    geminiApiKey: '',
    sarvamApiKey: '',
    youtubeApiKey: '',

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
