// ============================================================
//  ScholarBud config  —  THIS IS THE ONLY FILE YOU EDIT.
// ------------------------------------------------------------
//  Your site is on GitHub Pages, which cannot run a server.
//  So the app talks to Gemini directly, and your key goes below.
// ============================================================

window.SCHOLARBUD_CONFIG = {

    // On GitHub Pages this MUST stay empty ('')  -> do not change it.
    proxyBaseUrl: '',

    // ==========================================================
    //  >>>  PASTE YOUR GEMINI KEY BETWEEN THE QUOTES BELOW  <<<
    // ==========================================================
    //  Get one free at  https://aistudio.google.com/apikey
    //  It looks like:  AIzaSyAbc123...
    //
    //  Example of the finished line:
    //      geminiApiKey: 'AIzaSyAbc123xyz',
    //
    ownerApi: {
        geminiApiKey: 'AIzaSyCLxnyhbUXCRCd89aTrbDxJMbNZX1Zy9YY',     // <-- put your Gemini key here (needed for the chatbot)
        sarvamApiKey: 'sk_mf32x49g_oSndk437IjpFSyK5uVbCMwsY',     // optional: voice + multilingual chat
        youtubeApiKey: 'AIzaSyCdAhXR_g0XT17aiWzHA3URoaCGi47pN4c'     // optional: real YouTube search
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
