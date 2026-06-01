/* =========================================================================
   MaltiOnTheGo — runtime observability config
   -------------------------------------------------------------------------
   Fill these in once accounts exist. With blanks (the committed default),
   the app runs with no third-party scripts at all — exactly as it did
   before observability was wired.

   These values are NOT secret:
     - Sentry DSNs are write-only ingestion keys, designed to be shipped in
       client code (https://docs.sentry.io/product/sentry-basics/dsn-explainer/).
     - Plausible domain + API host are just routing strings, also public.
   Real secrets (auth tokens, API keys) never go here — see .env.
   ========================================================================= */
window.MALTI_CONFIG = {
  // Sentry — crash + error reporting. Get a DSN at sentry.io → Project
  // Settings → Client Keys. Format: https://<key>@<region>.ingest.sentry.io/<projectId>
  sentryDsn: "",
  // Free-form environment tag. Use "production" for App Store / Play builds,
  // "beta" for internal-testing builds, "dev" for local.
  sentryEnv: "beta",

  // Plausible — privacy-respecting analytics. The domain you registered in
  // the Plausible dashboard. For the PWA on GitHub Pages use the host name
  // ("greenworksmalta.github.io"); for the native wrap use the package id
  // ("com.greenworksmalta.maltiongthego") so the two streams stay separate.
  plausibleDomain: "",
  // Override only if self-hosting Plausible. Leave blank for plausible.io.
  plausibleApiHost: "",

  // RevenueCat public SDK keys (used only by the native iOS/Android wrap; the
  // web build ignores them). NOT secret — like Sentry DSNs, RevenueCat SDK keys
  // are designed to ship in client code. Get them at app.revenuecat.com →
  // Project → API keys (the "public app-specific" keys per platform).
  //   Android key starts with "goog_", iOS key starts with "appl_".
  revenueCatAndroidKey: "goog_jhgZoUtsVDgMOjJJchyjDnipGOc",
  revenueCatIosKey: "appl_DhfwdEANNzeMMkjinQwutEoCeyd",
};
