/* ============================================================
   ScholarBud — shared announcement store
   ------------------------------------------------------------
   Used by BOTH index.html (reads) and admin.html (writes).
   If Firebase is configured in config.js it syncs to the cloud,
   so one announcement reaches every device. If it is not, it
   quietly falls back to this browser only.
   ============================================================ */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot }
  from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const KEY = 'scholarbud_announcements';
const CFG = (window.SCHOLARBUD_CONFIG && window.SCHOLARBUD_CONFIG.firebase) || {};
const APP_ID = 'scholar-bud-app';   // must match the id the app uses
const PATH = ['artifacts', APP_ID, 'public', 'data', 'site', 'announcements'];

let db = null, ref = null, tried = false;

function connect() {
  if (tried) return db;
  tried = true;
  if (!CFG.apiKey || !CFG.projectId) return null;   // no Firebase set up - local only
  try {
    const NAME = 'announce-store';
    const existing = getApps().filter((a) => a.name === NAME)[0];
    const app = existing || initializeApp(CFG, NAME);
    db = getFirestore(app);
    ref = doc(db, ...PATH);
  } catch (e) {
    console.warn('[announce] Firebase not available, using this device only.', e);
    db = null;
  }
  return db;
}

const Store = {
  /* ---- always available ---- */
  local() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  },
  saveLocal(arr) { localStorage.setItem(KEY, JSON.stringify(arr)); },

  /* ---- cloud ---- */
  isCloud() { return !!connect(); },

  async fetchCloud() {
    if (!connect()) return null;
    try {
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data().items || []) : [];
    } catch (e) {
      console.warn('[announce] could not read from the cloud', e);
      return null;
    }
  },

  async pushCloud(arr) {
    if (!connect()) return false;
    try {
      await setDoc(ref, { items: arr, updatedAt: new Date().toISOString() });
      return true;
    } catch (e) {
      console.warn('[announce] could not write to the cloud', e);
      return false;
    }
  },

  watch(cb) {
    if (!connect()) return null;
    try {
      return onSnapshot(
        ref,
        (snap) => cb(snap.exists() ? (snap.data().items || []) : []),
        (err) => console.warn('[announce] live updates stopped', err)
      );
    } catch (e) { return null; }
  }
};

window.AnnounceStore = Store;
window.dispatchEvent(new Event('announce-store-ready'));
