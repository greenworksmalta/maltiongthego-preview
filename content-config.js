// ─────────────────────────────────────────────────────────────────────────────
// content-config.js — OTA content delivery configuration
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for WHERE over-the-air content comes from. The host is
// never hard-coded anywhere else — change BASE here (jsDelivr today, Cloudflare R2
// later) and the whole app follows. See app-assets/ota-content-plan.md.
//
// OTA is OFF by default (OTA_ENABLED = false) until the cache layer is tested on
// device. While off, the app loads bundled lessons exactly as before — zero
// behaviour change. Flip to true only after the OTA path is verified.

window.CONTENT_CONFIG = {
  // Master switch. false = load bundled lessons/ as today (current behaviour).
  // true  = check the remote manifest and prefer newer cached/remote content.
  // ⚠️ ENABLED 2026-06-21 for the 1.0.4 OTA release. This build MUST pass the
  // device test matrix (fresh-install offline, online update with no rebuild,
  // locked/unlocked, old-version compat, iOS audio-tap path) on a real iPhone +
  // Android BEFORE promoting to production. See app-assets/ota-content-plan.md.
  OTA_ENABLED: true,

  // BASE = where the MANIFEST lives. We use GitHub RAW (not jsDelivr) for the
  // manifest because it is a mutable pointer that must update reliably on every
  // publish. jsDelivr caches branch refs (@main) AND the branch->commit mapping
  // per-edge for up to 12h, so a purge does NOT reliably refresh @main globally
  // (proven 2026-06-21: edges served stale contentVersion even at age=0). GitHub
  // raw has a 5-min TTL, sends CORS *, and always serves the branch HEAD → no
  // purge needed, propagates in minutes.
  //   manifest: https://raw.githubusercontent.com/<owner>/<repo>/main/manifest.json
  // Content FILES (lessons/overviews/audio) are referenced INSIDE the manifest by
  // IMMUTABLE jsDelivr per-drop tag URLs (@drop-N) → permanent cache, instant,
  // never need purging. So raw serves only the tiny manifest; jsDelivr serves the
  // heavy immutable content. Best of both.
  BASE: "https://raw.githubusercontent.com/greenworksmalta/maltiongthego-content/test-listen-ota",

  // Manifest path under BASE. Small JSON listing contentVersion + per-lesson files.
  MANIFEST_PATH: "manifest.json",

  // Cache Storage bucket name for OTA'd content (separate from the SW's app cache).
  CACHE_NAME: "malti-ota-content-v1",

  // If the manifest requires a newer app than this build, ignore the new content
  // (old app keeps working with what it has). Kept in sync with app VERSION.
  // The manifest's per-lesson minAppVersion is checked against the running app.
  NETWORK_TIMEOUT_MS: 20000,
};
