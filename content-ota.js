// ─────────────────────────────────────────────────────────────────────────────
// content-ota.js — Over-the-air content layer (offline-first, host-agnostic)
// ─────────────────────────────────────────────────────────────────────────────
// Goal: deliver lesson JSON + audio over the air so content updates don't need an
// app-store release. Strategy: the app ALWAYS reads from a local cache; the network
// only refreshes that cache in the background. Offline-first (critical for
// "OnTheGo") and avoids Apple 4.2 thin-wrapper rejection (bundled content still
// works with no network).
//
// SAFE BY DEFAULT: every public function no-ops unless CONTENT_CONFIG.OTA_ENABLED
// is true. While disabled, app.js loads bundled lessons/audio exactly as today.
//
// H5 design (manifest-mutable, content-immutable):
//   - manifest.json lives at BASE (a MUTABLE @main ref) and is purged on publish.
//   - lesson/overview JSON are referenced by IMMUTABLE per-drop URLs (@drop-N) so
//     unchanged files stay cache-hits and only changed files re-download.
//   - audio clips use a MUTABLE @main base — safe because filenames are sha1
//     content-addressed (a given name's bytes never change → cache forever, no
//     purge, no re-download). New clips are new paths, fetched on first miss.
//
// Manifest shape (see app-assets/manifest.sample.json):
//   { contentVersion, minAppVersion, audioBase, audioManifest, recordedManifest,
//     index,                    — @drop-N URL of lessons/index.json (lets a drop ADD units)
//     artBase,                  — @drop-N base URL for assets/unit-art/<id>.png
//     audioAdditions,           — phrase→file mappings newer than the bundled map
//     listenAdditions: {en,es}, — Listen text→file mappings newer than the bundled maps
//     lessons: { <id>: { v, minAppVersion?, files: {
//         lesson, "lesson.es", overview, "overview.es" } } } }
// Each files.* value is a FULL URL.

(function () {
  const CFG = window.CONTENT_CONFIG || { OTA_ENABLED: false };
  const OTA = {};
  const LS_MANIFEST = "malti.ota.manifest";
  const LS_VERSION = "malti.contentVersion";

  // Last-fetched manifest (also persisted) so getLessonJSON can resolve cached
  // file URLs on the NEXT launch before this session's sync completes.
  OTA._manifest = null;
  // sha1 filename -> object URL, for OTA-only audio pre-fetched on lesson open.
  OTA._blobURLs = {};

  try {
    const saved = localStorage.getItem(LS_MANIFEST);
    if (saved) OTA._manifest = JSON.parse(saved);
  } catch (e) { /* ignore */ }

  function manifestURL() {
    return CFG.BASE.replace(/\/+$/, "") + "/" + String(CFG.MANIFEST_PATH || "manifest.json").replace(/^\/+/, "");
  }

  async function fetchWithTimeout(u, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || CFG.NETWORK_TIMEOUT_MS || 6000);
    try {
      return await fetch(u, { signal: ctrl.signal, cache: "no-store" });
    } finally {
      clearTimeout(t);
    }
  }

  // Compare semver-ish strings. true if `running` >= `required`. On parse failure, allow.
  function appVersionSatisfies(running, required) {
    if (!required) return true;
    const norm = (s) => String(s).split("-")[0].split(".").map((n) => parseInt(n, 10) || 0);
    const a = norm(running), b = norm(required);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] || 0, y = b[i] || 0;
      if (x > y) return true;
      if (x < y) return false;
    }
    return true;
  }

  async function cacheOpen() {
    if (!("caches" in window)) return null;
    return caches.open(CFG.CACHE_NAME);
  }

  // ── Cache helpers (operate on FULL URLs) ──────────────────────────────────
  async function getCachedJSON(absURL) {
    const c = await cacheOpen();
    if (!c) return null;
    const hit = await c.match(absURL);
    if (!hit) return null;
    try { return await hit.json(); } catch (e) { return null; }
  }

  // Download a file into the cache. JSON is validated (parses) before storing so a
  // corrupt/truncated drop never persists (it just leaves bundled in place).
  async function cacheURL(absURL) {
    const c = await cacheOpen();
    if (!c) return false;
    try {
      const r = await fetchWithTimeout(absURL);
      if (!r.ok) return false;
      if (/\.json(\?|$)/.test(absURL)) {
        try { JSON.parse(await r.clone().text()); }
        catch (e) { return false; }
      }
      await c.put(absURL, r.clone());
      return true;
    } catch (e) {
      return false;
    }
  }

  // Resolve a lesson/overview file URL from the in-memory manifest.
  function fileURL(lid, kind, lang) {
    const m = OTA._manifest;
    if (!m || !m.lessons || !m.lessons[lid] || !m.lessons[lid].files) return null;
    const files = m.lessons[lid].files;
    const suffix = lang && lang !== "en" ? "." + lang : "";
    return files[kind + suffix] || null;
  }

  // ── Manifest ──────────────────────────────────────────────────────────────
  OTA.fetchManifest = async function () {
    if (!CFG.OTA_ENABLED) return null;
    try {
      const r = await fetchWithTimeout(manifestURL());
      if (!r.ok) return null;
      const m = await r.json();
      OTA._manifest = m;
      try { localStorage.setItem(LS_MANIFEST, JSON.stringify(m)); } catch (e) {}
      return m;
    } catch (e) {
      return null; // offline/timeout → app falls back to bundled+cache
    }
  };

  // ── Public read API (cache-first JSON) ────────────────────────────────────
  // Return parsed JSON from cache, else null so the caller uses the bundled file.
  OTA.getLessonJSON = async function (lid, lang) {
    if (!CFG.OTA_ENABLED) return null;
    const u = fileURL(lid, "lesson", lang);
    if (!u) return null;
    return getCachedJSON(u);
  };

  OTA.getOverviewJSON = async function (lid, lang) {
    if (!CFG.OTA_ENABLED) return null;
    const u = fileURL(lid, "overview", lang);
    if (!u) return null;
    return getCachedJSON(u);
  };

  // Lesson index (home-screen unit list). OTA-first like lessons so a drop can ADD
  // new units without a store release; null → caller keeps the bundled index.json.
  OTA.getIndexJSON = async function () {
    if (!CFG.OTA_ENABLED || !OTA._manifest || !OTA._manifest.index) return null;
    return getCachedJSON(OTA._manifest.index);
  };

  // Remote audio/recorded maps (text->filename), merged over bundled by app.js.
  OTA.getRemoteMap = async function (which) {
    if (!CFG.OTA_ENABLED || !OTA._manifest) return null;
    const u = which === "recorded" ? OTA._manifest.recordedManifest : OTA._manifest.audioManifest;
    if (!u) return null;
    return getCachedJSON(u);
  };

  // NEW phrase->filename mappings delivered INLINE in the manifest (tiny + always
  // available since the manifest itself loads). This replaces fetching the full
  // ~110KB audio map over OTA, which timed out on mobile (12s vs the timeout) and
  // left OTA audio silent. The bundled map covers bundled clips; this covers the
  // over-the-air ones. Merged over State.manifest by app.js.
  // Listen-mode text→filename mappings newer than the bundled manifests, one map
  // per language. Same inline-in-manifest strategy as audioAdditions (never fetch a
  // full map over OTA — the 110KB audio map timed out on mobile). The clips
  // themselves live under audioBase as listen/<lang>/<file> and ride the normal
  // prefetch/stream-and-cache path.
  OTA.getListenAdditions = function () {
    if (!CFG.OTA_ENABLED || !OTA._manifest) return null;
    return OTA._manifest.listenAdditions || null;
  };

  // Base URL for unit hero art so OTA-added units get real artwork; null → the
  // <img> keeps its existing emoji-placeholder fallback.
  OTA.getArtBase = function () {
    if (!CFG.OTA_ENABLED || !OTA._manifest) return null;
    return OTA._manifest.artBase || null;
  };

  OTA.getAudioAdditions = function () {
    if (!CFG.OTA_ENABLED || !OTA._manifest) return null;
    return OTA._manifest.audioAdditions || null;
  };

  // ── Audio (fetch-on-miss + pre-fetch-on-open) ─────────────────────────────
  // SYNC accessor for play(): returns a pre-fetched object URL for an OTA-only
  // clip, or null (caller uses the bundled "audio/<file>" path). Sync so it can be
  // used inside the tap handler without losing the user-gesture (iOS WKWebView).
  OTA.getAudioURLSync = function (file) {
    if (!CFG.OTA_ENABLED) return null;
    if (OTA._blobURLs[file]) return OTA._blobURLs[file]; // cached → offline-capable blob
    // Not cached yet → return the direct CDN URL so the clip plays NOW (online),
    // instead of falling back to a non-existent bundled path (silent). Media
    // elements play cross-origin URLs without CORS, and this stays in-gesture on
    // iOS. prefetchAudio still caches it in the background for offline use.
    const m = OTA._manifest;
    if (m && m.audioBase) return m.audioBase.replace(/\/+$/, "") + "/" + file;
    return null;
  };

  // Canonical cache key for an audio clip. Clip filenames are sha1
  // content-addressed (bytes never change for a given name), but audioBase moves
  // to a new immutable @drop-N tag on every publish — caching by the full CDN URL
  // would invalidate EVERY user's cached audio each drop. Keying by a synthetic
  // tag-independent URL keeps clips cached across drops. (Matters since the
  // binary-shrink: ~2,900 locked-lesson clips + narration ride on audioBase.)
  function audioCacheKey(file) {
    return "https://audio-cache.maltiongthego.invalid/" + file;
  }

  // Pre-fetch OTA-only clips for a lesson so play() (sync) can use them at tap time.
  // `files`     : sha1 filenames the lesson needs.
  // `isBundled` : (file)=>bool, lets the caller skip clips already in the binary.
  // Fetches run a few at a time — a locked lesson can need ~100+ clips, and the
  // old one-at-a-time loop took minutes to warm a lesson.
  OTA.prefetchAudio = async function (files, isBundled) {
    if (!CFG.OTA_ENABLED || !OTA._manifest || !OTA._manifest.audioBase) return;
    const base = OTA._manifest.audioBase.replace(/\/+$/, "");
    const c = await cacheOpen();
    if (!c) return;
    const todo = (files || []).filter(f =>
      f && !OTA._blobURLs[f] && !(isBundled && isBundled(f)));
    const one = async (f) => {
      const key = audioCacheKey(f);
      let hit = await c.match(key);
      if (!hit) {
        try {
          const r = await fetchWithTimeout(base + "/" + f);
          if (r && r.ok) { await c.put(key, r.clone()); hit = await c.match(key); }
        } catch (e) { /* offline/timeout → direct-URL fallback still works online */ }
      }
      if (hit) {
        try { OTA._blobURLs[f] = URL.createObjectURL(await hit.blob()); } catch (e) {}
      }
    };
    const CONCURRENCY = 6;
    let i = 0;
    const worker = async () => { while (i < todo.length) { const f = todo[i++]; await one(f); } };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker));
  };

  // ── Background sync ────────────────────────────────────────────────────────
  // Call once on launch. Fetch manifest; if contentVersion is newer, download
  // changed lesson/overview JSON + the audio maps in the background. Immutable
  // per-drop URLs mean unchanged files are cache-hits (skipped). Fire-and-forget.
  // Returns true if a NEWER content version was fetched + cached this call (so the
  // app can prompt "new lessons available — tap to refresh"); false otherwise.
  OTA.syncInBackground = async function (runningAppVersion) {
    if (!CFG.OTA_ENABLED) return false;
    const m = await OTA.fetchManifest();
    if (!m) return false;
    if (!appVersionSatisfies(runningAppVersion, m.minAppVersion)) return false;

    let stored = 0;
    try { stored = parseInt(localStorage.getItem(LS_VERSION) || "0", 10); } catch (e) {}
    if (!(m.contentVersion > stored)) return false; // nothing new

    const c = await cacheOpen();
    const lessons = m.lessons || {};
    for (const lid of Object.keys(lessons)) {
      const entry = lessons[lid] || {};
      if (entry.minAppVersion && !appVersionSatisfies(runningAppVersion, entry.minAppVersion)) continue;
      const files = entry.files || {};
      for (const k of Object.keys(files)) {
        const u = files[k];
        if (c && !(await c.match(u))) await cacheURL(u); // skip cache-hits (immutable)
      }
    }
    // Recorded-overrides map only (small). We deliberately do NOT fetch the full
    // audio map (m.audioManifest) — it's ~110KB and timed out on mobile, leaving
    // OTA audio silent. New phrase mappings ride in manifest.audioAdditions instead.
    if (m.recordedManifest && c && !(await c.match(m.recordedManifest))) await cacheURL(m.recordedManifest);
    // Lesson index (adds new units to the home screen). Immutable @drop-N URL, so
    // a cache-hit means this drop's index is already present.
    if (m.index && c && !(await c.match(m.index))) await cacheURL(m.index);

    try { localStorage.setItem(LS_VERSION, String(m.contentVersion)); } catch (e) {}
    return true; // new content cached → caller can surface the refresh banner
  };

  // Diagnostics / escape hatch (H4): visible version + manual cache clear.
  OTA.getContentVersion = function () {
    try { return parseInt(localStorage.getItem(LS_VERSION) || "0", 10); } catch (e) { return 0; }
  };
  OTA.clearCache = async function () {
    try {
      if ("caches" in window) await caches.delete(CFG.CACHE_NAME);
      localStorage.removeItem(LS_MANIFEST);
      localStorage.removeItem(LS_VERSION);
      OTA._manifest = null;
      OTA._blobURLs = {};
      return true;
    } catch (e) { return false; }
  };

  window.ContentOTA = OTA;
})();
