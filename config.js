// ============================================================
//  ScholarBud config  —  THIS IS THE ONLY FILE YOU EDIT.
// ------------------------------------------------------------
//  IMPORTANT: if this file is in a PUBLIC GitHub repo, any key you
//  put here can be seen by anyone, and Google may flag it as
//  "leaked" and switch it off (that is what just happened).
//
//  Two ways to run:
//    A) Keep the key private (recommended): run the ScholarBud
//       server on Render/Railway, then set proxyBaseUrl to its URL
//       and leave the keys below EMPTY.  See README.md.
//    B) Direct mode: paste the key below. Works instantly, but the
//       key is public and may be disabled by Google later.
// ============================================================

window.SCHOLARBUD_CONFIG = {

    // '' for direct mode, or your server URL e.g.
    // 'https://scholarbud.onrender.com'
    proxyBaseUrl: 'https://scholarbud.onrender.com',

    // ==========================================================
    //  >>>  PASTE YOUR API KEY(S) HERE  <<<
    //  Leave EMPTY if you are using the server (proxyBaseUrl above).
    // ==========================================================
    ownerApi: {
        geminiApiKey: '',     // Gemini key  (chatbot, quiz, planner)
        sarvamApiKey: 'sk_mf32x49g_oSndk437IjpFSyK5uVbCMwsY',     // Sarvam key  (voice, multilingual chat)
        youtubeApiKey: 'AIzaSyCdAhXR_g0XT17aiWzHA3URoaCGi47pN4c'     // YouTube Data API v3 key (video search)
    },

    // Leave the rest as it is.
    geminiModel: 'gemini-3.8-flash',
    chatProvider: 'gemini',
    sarvamSpeaker: 'shubh',

    firebase: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    },

    allowedGoogleDomains: []
};
