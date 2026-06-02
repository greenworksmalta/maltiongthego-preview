/* =========================================================================
   Malti — multi-lesson Maltese learning app
   Six lessons, sectioned home, Duolingo-style exercises, Maltese audio
   on every word and sentence. Tuned for dyslexia/ADHD: short flows,
   big tap targets, instant feedback, one thing per screen.
   ========================================================================= */
(function(){
"use strict";

// Bumped whenever lesson JSONs / audio / overviews / app code are updated, so the
// browser invalidates its cache for those assets. Add ?v=<VERSION> to fetch URLs.
//
// Source of truth is package.json's version. Format: semver, with a -beta.N
// suffix while we're pre-launch. Bumping requires updating ALL of:
//   - package.json "version"           (Capacitor reads this for the native build)
//   - VERSION below                    (in-app footer + ?v= cache buster)
//   - <script src="app.js?v=..."> tag in index.html
//   - CACHE_NAME in sw.js              (forces SW reinstall)
const VERSION = "1.0.0-beta.26";
// BUILD changes on EVERY content/code push (VERSION stays pinned to the native
// release). The footer shows it so you can confirm at a glance you're on the
// latest local/preview build — match it against the sw.js CACHE_NAME suffix.
const BUILD = "20260601jj";
// Bump ONLY when audio clips are regenerated (re-voiced). Audio filenames are
// sha1(mt) so a re-voiced clip keeps its name; without a changing query the
// browser/SW serve the OLD cached audio. play() busts on this.
const AUDIO_REV = "20260602a";
function v(url){ return url + (url.includes("?")?"&":"?") + "v=" + VERSION; }

// Lightweight UI strings table for the parts of the app that aren't data-driven.
// Keys are accessed via (I18N[State.lang] || I18N.en).<key>.
const I18N = {
  en: {
    done: "Done",
    sectionComplete: "Mela! Section complete.",
    brilliantWork: "Brilliant work!",
    xpEarned: "XP earned",
    totalXp: "Total XP",
    backToLesson: "Back",
    nextSection: "Next section →",
    nextExercise: "Next exercise →",
    nextLesson: "Next →",
    lessonComplete: "Complete! 🎉",
    skip: "Skip →",
    next: "Next",
    nextArrow: "Next →",
    previous: "← Previous",
    heroEyebrow: "Merħba 👋  Welcome",
    heroH1: "Settle in faster.",
    heroP: "Real Maltese for the café, the bus, the office, and your new neighbours. Three minutes at a time, native audio, no fluff. Start with the free Welcome below 👇",
    freeBadge: "FREE",
    statusDone: "Done",
    statusStart: "Start",
    overview: "Overview",
    overviewSub: "Listen to it explained in English",
    correct: "Sewwa!",
    notQuite: "Not quite.",
    correctIs: "Correct: ",
    checkForUpdates: "↻ Check for updates",
    updating: "Updating…",
    upToDate: "You're up to date",
    version: "Version",
    updatedTo: "✓ Updated to version",
    updateAvailable: "↻ Update available — tap to refresh",
    privacy: "Privacy",
    install: {
      title: "Add MaltiOnTheGo to your home screen",
      sub: "Faster to open, works offline, feels like a real app.",
      iosStep1: "Tap the Share button below ⬆️",
      iosStep2: "Choose 'Add to Home Screen'",
      androidStep1: "Tap the menu (⋮) above",
      androidStep2: "Choose 'Install app' or 'Add to Home screen'",
      maybeLater: "Maybe later",
      gotIt: "Got it",
    },
    unlock: "Unlock",
    paywall: {
      title: "Unlock the full course",
      sub: "The free Welcome stays free. Pick the option that fits.",
      starterTitle: "Starter pack",
      starterPrice: "€2.99",
      starterTag: "one-off",
      starterBody: "The First Words pack — three sections, yours forever. A taste of Maltese before you commit.",
      coreTitle: "Core pack",
      corePrice: "€2.99",
      coreTag: "one-off",
      coreBody: "The Everyday Malti pack — three sections, yours forever. Describing, family, food and dining out.",
      advancedTitle: "Advanced pack",
      advancedPrice: "€2.99",
      advancedTag: "one-off",
      advancedBody: "The Out & About pack — three sections, yours forever. Questions, eating out, shopping, time and directions.",
      monthlyTitle: "Monthly",
      monthlyPrice: "€4.99",
      monthlyTag: "per month",
      monthlyBody: "The full course, plus a fresh drop of new content every month — while you're subscribed.",
      yearlyTitle: "Yearly",
      yearlyPrice: "€49.99",
      yearlyTag: "per year — save 16%",
      yearlyBody: "Everything in Monthly, with two months free. Best for serious learners.",
      perksTitle: "Every subscription includes",
      perks: [
        "The full library — every section unlocked",
        "New content every month — fresh sections, extra exercises and simple conversations",
        "Phrase search — look up any word or phrase across the whole course",
        "New app features as they land, added automatically"
      ],
      cta: "Choose",
      restore: "Restore purchases",
      restoreNote: "Already bought on another device? Tap Restore.",
      manageSub: "Manage subscription",
      tierFree: "Free",
      tierStarter: "Starter pack",
      tierCore: "Core pack",
      tierAdvanced: "Advanced pack",
      tierMonthly: "Monthly",
      tierYearly: "Yearly",
      current: "Your plan",
      back: "← Back",
      restored: "Purchases restored.",
      nothingToRestore: "Nothing to restore yet.",
      comingSoon: "Real purchases turn on at App Store / Play launch. Tap Restore to sync your plan from the store.",
      devUnlock: "Dev unlock (preview only)",
    },
    search: {
      title: "Search",
      hint: "Find any phrase or topic from the course and jump straight to it.",
      placeholder: "Type a word in English or Maltese…",
      loading: "Loading…",
      noResults: "No matches found. Try a different word.",
      resultCount: "result",
      resultCountPlural: "results",
      inLesson: "In",
      topicsLabel: "Topics",
      phrasesLabel: "Phrases",
      locked: "Search",
      lockedSub: "Search every phrase and topic in the course and jump straight to it — included with a subscription.",
      lockedCta: "Subscribers only 🔒",
    },
  },
  es: {
    done: "¡Listo!",
    sectionComplete: "¡Mela! Sección completa.",
    brilliantWork: "¡Buen trabajo!",
    xpEarned: "XP ganados",
    totalXp: "XP total",
    backToLesson: "Volver a la lección",
    nextSection: "Siguiente sección →",
    nextLesson: "Siguiente lección →",
    lessonComplete: "¡Lección completa! 🎉",
    skip: "Saltar →",
    next: "Siguiente",
    nextArrow: "Siguiente →",
    previous: "← Anterior",
    heroEyebrow: "Merħba 👋  Bienvenido",
    heroH1: "Adáptate más rápido.",
    heroP: "Maltés real para la cafetería, el autobús, la oficina y tus nuevos vecinos. Tres minutos por lección, audio nativo, sin paja. Empieza con la Lección de Bienvenida gratis abajo 👇",
    freeBadge: "GRATIS",
    statusDone: "Listo",
    statusStart: "Empezar",
    overview: "Resumen",
    overviewSub: "Escucha la lección explicada en español",
    correct: "¡Sewwa!",
    notQuite: "No del todo.",
    correctIs: "Correcto: ",
    checkForUpdates: "↻ Buscar actualizaciones",
    updating: "Actualizando…",
    upToDate: "Estás al día",
    version: "Versión",
    updatedTo: "✓ Actualizado a la versión",
    updateAvailable: "↻ Actualización disponible — toca para refrescar",
    privacy: "Privacidad",
    install: {
      title: "Añade MaltiOnTheGo a tu pantalla de inicio",
      sub: "Se abre más rápido, funciona sin conexión y parece una app de verdad.",
      iosStep1: "Toca el botón Compartir abajo ⬆️",
      iosStep2: "Elige 'Añadir a la pantalla de inicio'",
      androidStep1: "Toca el menú (⋮) arriba",
      androidStep2: "Elige 'Instalar app' o 'Añadir a la pantalla de inicio'",
      maybeLater: "Quizás más tarde",
      gotIt: "Entendido",
    },
    unlock: "Desbloquear",
    paywall: {
      title: "Desbloquea el curso completo",
      sub: "La lección de bienvenida sigue siendo gratis. Elige lo que mejor te convenga.",
      starterTitle: "Pack inicial",
      starterPrice: "€2,99",
      starterTag: "pago único",
      starterBody: "Lecciones 1, 2 y 3 — tuyas para siempre. Una probada antes de suscribirte.",
      coreTitle: "Pack básico",
      corePrice: "€2,99",
      coreTag: "pago único",
      coreBody: "Lecciones 4, 5 y 6 — tuyas para siempre. Familia, comida y comer fuera.",
      advancedTitle: "Pack avanzado",
      advancedPrice: "€2,99",
      advancedTag: "pago único",
      advancedBody: "Lecciones 7, 8 y 9 — tuyas para siempre. Moverse, el mapa, la hora y las direcciones.",
      monthlyTitle: "Mensual",
      monthlyPrice: "€4,99",
      monthlyTag: "al mes",
      monthlyBody: "El curso completo, más contenido nuevo cada mes — mientras estés suscrito.",
      yearlyTitle: "Anual",
      yearlyPrice: "€49,99",
      yearlyTag: "al año — ahorra 16 %",
      yearlyBody: "Todo lo de Mensual, con dos meses gratis. Ideal si vas en serio.",
      perksTitle: "Cada suscripción incluye",
      perks: [
        "La biblioteca completa de lecciones — todas desbloqueadas",
        "Contenido nuevo cada mes — lecciones nuevas, ejercicios extra y conversaciones sencillas",
        "Búsqueda de frases — busca cualquier palabra o frase en todo el curso",
        "Nuevas funciones de la app a medida que llegan, añadidas automáticamente"
      ],
      cta: "Elegir",
      restore: "Restaurar compras",
      restoreNote: "¿Ya compraste en otro dispositivo? Toca Restaurar.",
      manageSub: "Gestionar suscripción",
      tierFree: "Gratis",
      tierStarter: "Pack inicial",
      tierCore: "Pack básico",
      tierAdvanced: "Pack avanzado",
      tierMonthly: "Mensual",
      tierYearly: "Anual",
      current: "Tu plan",
      back: "← Atrás",
      restored: "Compras restauradas.",
      nothingToRestore: "Nada que restaurar aún.",
      comingSoon: "Las compras reales se activan en el lanzamiento de App Store / Play. Toca Restaurar para sincronizar tu plan.",
      devUnlock: "Desbloqueo de desarrollo (solo vista previa)",
    },
    search: {
      title: "Buscar",
      hint: "Encuentra cualquier frase o tema del curso y salta directo.",
      placeholder: "Escribe una palabra en español o maltés…",
      loading: "Cargando…",
      noResults: "No se encontraron resultados. Prueba otra palabra.",
      resultCount: "resultado",
      resultCountPlural: "resultados",
      inLesson: "En",
      topicsLabel: "Temas",
      phrasesLabel: "Frases",
      locked: "Buscar",
      lockedSub: "Busca cualquier frase o tema del curso y salta directo — incluido con la suscripción.",
      lockedCta: "Solo suscriptores 🔒",
    },
  },
};

// ── State ─────────────────────────────────────
const State = {
  index: null,           // {lessons:[...]}
  lessons: {},           // {<lid>:<lang>: {...}} keyed by lesson id + language
  overviews: {},         // {<lid>:<lang>: {transcript:[...]}}
  manifest: null,        // {mt: filename}
  searchIndex: null,     // {lang, entries:[...]} — flattened phrase list, built lazily
  progress: load("progress") || {},   // {lessonId: {sectionId: pct}}
  xp: load("xp") || 0,
  lang: load("preferred_lang") || "en",  // global language preference
  // Snapshot of State.xp at the moment a section was first entered, so the
  // section-done screen can display the actual XP earned during that section
  // (correct answers + bonus) rather than just the +20 completion bonus.
  // Keyed by "lid:sid". Reset whenever the user re-enters a section.
  sectionStartXp: {},
  // Purchase entitlement. tier: 'free' | 'monthly' | 'yearly'.
  // packs: map of owned one-off pack keys, e.g. {starter:true, core:true}.
  // The native IAP plugin (added at native-wrap time) is the source of truth;
  // we mirror its state here so the JS UI can gate lessons without re-querying
  // the store on every render. Restore-purchases re-syncs from the store.
  entitlement: normalizeEntitlement(load("entitlement")),
};
function save(k,v){ try{localStorage.setItem("malti."+k, JSON.stringify(v));}catch(e){} }
function load(k){ try{const v=localStorage.getItem("malti."+k);return v?JSON.parse(v):null;}catch(e){return null;} }

// ── Tester unlock (web PWA only) ──────────────────────────────────────────
// The trap-door dev unlock was removed for production launch, but the team
// still needs a way to test paid lessons from a phone browser (iPhone has no
// internal-testing track for the PWA). Visiting the live URL with the right
// secret query param grants every entitlement + dev visibility on THIS device,
// stored in localStorage so subsequent visits stay unlocked. Native builds
// ignore this flag — they go through RevenueCat as usual.
//
// Usage on device:
//   https://greenworksmalta.github.io/MalteseLessons/?unlock=maltimt2026
//   https://greenworksmalta.github.io/MalteseLessons/?unlock=off   (clears it)
//
// The secret is intentionally not super-strong — it's a privacy fence, not a
// security boundary, and the source is public anyway. Change it in source if
// it ever leaks and bake a fresh URL.
const TESTER_UNLOCK_SECRET = "maltimt2026";
function applyTesterUnlock(){
  try {
    const params = new URLSearchParams(location.search);
    const v = params.get("unlock");
    if(v === TESTER_UNLOCK_SECRET){
      localStorage.setItem("malti.testerUnlock", "1");
      localStorage.setItem("malti.devUnlock", "1");
      // strip the secret out of the URL so it doesn't sit there in screenshots
      history.replaceState(null, "", location.pathname + location.hash);
    } else if(v === "off"){
      localStorage.removeItem("malti.testerUnlock");
      localStorage.removeItem("malti.devUnlock");
      localStorage.removeItem("malti.entitlement");
      history.replaceState(null, "", location.pathname + location.hash);
    }
    if(localStorage.getItem("malti.testerUnlock") === "1"){
      // Grant full access in-memory; persist so refresh keeps it. Native builds
      // overwrite this from RevenueCat customerInfo if a real purchase exists.
      State.entitlement = { tier: "yearly", packs: { starter: true, core: true, advanced: true } };
      save("entitlement", State.entitlement);
      return true;
    }
  } catch(e){ /* localStorage disabled / private browsing — ignore */ }
  return false;
}
const TESTER_UNLOCKED = applyTesterUnlock();
// Normalize stored entitlement to the current shape, migrating the legacy
// `starterPack: bool` field to the generalized `packs` map.
function normalizeEntitlement(e){
  e = e || {};
  const tier = (e.tier === "monthly" || e.tier === "yearly") ? e.tier : "free";
  const packs = Object.assign({}, e.packs);
  if(e.starterPack) packs.starter = true; // migrate legacy field
  return { tier: tier, packs: packs };
}

// One-off lesson packs (non-consumable IAPs). Each grants permanent access to
// its three lessons. Packs only ever cover already-released lessons; the newest
// content (Module 4+) stays subscription-only so the subscription always leads.
// Welcome (extra1) is free regardless and gated by the lesson's own `free` flag.
const PACKS = [
  { key: "starter",  lessons: ["lesson1", "lesson2", "lesson3"], productId: "com.greenworksmalta.maltiongthego.starter" },
  { key: "core",     lessons: ["lesson4", "lesson5", "lesson6"], productId: "com.greenworksmalta.maltiongthego.core" },
  { key: "advanced", lessons: ["lesson7", "lesson8", "lesson9"], productId: "com.greenworksmalta.maltiongthego.advanced" },
];
function ownsPack(key){ return !!(State.entitlement.packs && State.entitlement.packs[key]); }
function hasAnyPack(){ return PACKS.some(p => ownsPack(p.key)); }
function packForLesson(lid){ return PACKS.find(p => p.lessons.indexOf(lid) >= 0); }
function isSubscribed(){
  return State.entitlement.tier === "monthly" || State.entitlement.tier === "yearly";
}
function isLessonUnlocked(lid){
  const lesson = (State.index && State.index.lessons || []).find(l => l.id === lid);
  if(lesson && lesson.free) return true;
  if(isSubscribed()) return true;
  const pack = packForLesson(lid);
  if(pack && ownsPack(pack.key)) return true;
  return false;
}
// Short label for the user's current plan — subscription tier, or owned packs
// joined with "+". Reused by the paywall badge and the home footer plan link.
function planSummary(p){
  if(isSubscribed()) return p[State.entitlement.tier === "monthly" ? "tierMonthly" : "tierYearly"];
  const owned = PACKS.filter(x => ownsPack(x.key)).map(x => p["tier" + x.key.charAt(0).toUpperCase() + x.key.slice(1)]);
  return owned.length ? owned.join(" + ") : p.tierFree;
}
function setEntitlement(patch){
  State.entitlement = Object.assign({}, State.entitlement, patch);
  save("entitlement", State.entitlement);
}
// Dev mode — turned on by the "?dev=1" URL trick or by tapping the version
// label 7×. Lessons flagged `"dev": true` in index.json (e.g. unreleased
// monthly drops staged ahead of time) are hidden from the home screen and
// search for everyone EXCEPT dev-mode testers.
function isDevMode(){
  try { return localStorage.getItem("malti.devUnlock") === "1"; }
  catch(e){ return false; }
}
function isLessonVisible(L){
  return !(L && L.dev) || isDevMode();
}
// Resolve the cached lesson in the current language, falling back to English.
function currentLesson(lid){
  return State.lessons[lid + ":" + State.lang] || State.lessons[lid + ":en"] || State.lessons[lid];
}
function lessonProgress(lid){
  const p = State.progress[lid] || {};
  const lesson = currentLesson(lid);
  if(!lesson) return 0;
  const ids = lesson.sections.map(s=>s.id);
  if(!ids.length) return 0;
  const total = ids.reduce((a,id)=>a+(p[id]||0),0);
  return Math.round(total/ids.length);
}
function setSectionProgress(lid,sid,pct){
  if(!State.progress[lid]) State.progress[lid] = {};
  State.progress[lid][sid] = Math.max(State.progress[lid][sid]||0, Math.min(100, Math.round(pct)));
  save("progress", State.progress);
}
function addXp(n){ State.xp += n; save("xp", State.xp); }

// ── DOM helpers ───────────────────────────────
function el(tag, cls, txt){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(txt!==undefined) e.textContent = txt;
  return e;
}
const $app = () => document.getElementById("app");

// ── Audio ─────────────────────────────────────
const player = document.getElementById("player");
let currentBtn = null;
function play(mt, opts){
  if(!mt) return;
  opts = opts || {};
  // Human-recorded clip wins over the Azure-generated one if mapped.
  const recorded = State.recorded && State.recorded[mt];
  let src;
  if(recorded){
    src = "audio/recorded/" + recorded;
  } else {
    const file = State.manifest && State.manifest[mt];
    if(!file){ console.warn("No audio for:", mt); return; }
    src = "audio/" + file;
  }
  if(currentBtn){ currentBtn.classList.remove("playing"); currentBtn=null; }
  try{
    player.pause();
    player.src = src + (src.includes("?") ? "&" : "?") + "a=" + AUDIO_REV;
    player.currentTime = 0;
    // Slower playback for short MC clips (article + word combos), where the default
    // -8% SSML rate still feels rushed to learners parsing a single chunk.
    player.playbackRate = (typeof opts.rate === "number") ? opts.rate : 1;
    const p = player.play();
    if(p && p.catch) p.catch(e=>console.warn("play failed", e));
  }catch(e){ console.warn(e); }
}
function playBtn(btn, mt, opts){
  play(mt, opts);
  if(currentBtn) currentBtn.classList.remove("playing");
  currentBtn = btn;
  btn.classList.add("playing");
}
player.addEventListener("ended", ()=>{ if(currentBtn){ currentBtn.classList.remove("playing"); currentBtn=null; } });
function audioBtn(mt, opts){
  opts = opts || {};
  const b = el("button", "audio-btn"+(opts.size?" "+opts.size:""), opts.label||"🔊");
  b.setAttribute("aria-label","Play "+mt);
  const playOpts = (typeof opts.rate === "number") ? {rate: opts.rate} : undefined;
  b.addEventListener("click", e=>{ e.stopPropagation(); playBtn(b, mt, playOpts); });
  return b;
}

// ── Force update (clears SW + caches and reloads) ────
// Critical for PWAs saved to the home screen, where Safari/Chrome aggressively
// cache the bundle and the user has no easy way to refresh.
async function forceUpdate(button){
  const t = I18N[State.lang] || I18N.en;
  if(button){ button.textContent = t.updating; button.disabled = true; }
  try {
    if("serviceWorker" in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if("caches" in window){
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch(e){ console.warn("Update failed", e); }
  // Hard reload — bypass http cache. The query param ensures the HTML itself
  // is fetched fresh; the SW registration above means the next load builds
  // the cache from scratch with the new content. The "?u=..." marker is what
  // showUpdateConfirmation() looks for after the reload to flash the banner.
  location.replace(location.pathname + "?u=" + Date.now() + location.hash);
}

// After a force-update reload, show a top banner with the new version so the
// user sees confirmation immediately — the page reloads to scrolltop, and the
// version footer is at the bottom of home, so without this you'd have to
// scroll all the way down to verify the bump took effect.
function showUpdateConfirmation(){
  if(!/[?&]u=/.test(location.search)) return;
  const t = I18N[State.lang] || I18N.en;
  const banner = el("div","update-banner");
  banner.textContent = (t.updatedTo || "✓ Updated to version") + " " + VERSION;
  document.body.appendChild(banner);
  requestAnimationFrame(()=>banner.classList.add("show"));
  const dismiss = ()=>{
    banner.classList.remove("show");
    setTimeout(()=>banner.remove(), 300);
  };
  banner.addEventListener("click", dismiss);
  setTimeout(dismiss, 4000);
  // Strip the ?u= marker so a subsequent manual reload doesn't re-show the banner.
  history.replaceState(null, "", location.pathname + location.hash);
}

// Register the service worker and listen for new versions becoming available
// while the page is open. When a new SW is installed (and an old one is still
// controlling the page), show a top banner inviting the user to refresh.
// Replaces the inline registration that used to live in index.html.
function registerServiceWorker(){
  if(!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").then(reg => {
    // First-load case: a new SW was queued from a previous session.
    if(reg.waiting && navigator.serviceWorker.controller){
      showUpdateAvailableBanner();
    }
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if(!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        // 'installed' + an existing controller means there's a fresh SW
        // ready, but the page is still served by the old one. Time to prompt.
        if(newWorker.state === "installed" && navigator.serviceWorker.controller){
          showUpdateAvailableBanner();
        }
      });
    });
    // Background polling so the banner can fire mid-session if the user
    // leaves the app open for a long time. Hourly is plenty.
    setInterval(() => reg.update().catch(()=>{}), 60 * 60 * 1000);
  }).catch(e => console.warn("SW register failed", e));
}

// Top banner: "↻ Update available — tap to refresh". Persistent (no auto-
// dismiss) — the user has to either accept the update or tap × to defer.
function showUpdateAvailableBanner(){
  if(document.querySelector(".update-banner.upgrade")) return;  // already showing
  const t = I18N[State.lang] || I18N.en;
  const banner = el("div","update-banner upgrade");
  banner.textContent = t.updateAvailable || "↻ Update available — tap to refresh";
  // Tiny × to dismiss without applying. The next normal reload still picks up
  // the new SW, so dismissing isn't dangerous.
  const close = el("button","update-banner-close","×");
  close.setAttribute("aria-label","Dismiss");
  close.addEventListener("click", e => {
    e.stopPropagation();
    banner.classList.remove("show");
    setTimeout(()=>banner.remove(), 300);
  });
  banner.appendChild(close);
  document.body.appendChild(banner);
  requestAnimationFrame(()=>banner.classList.add("show"));
  banner.addEventListener("click", () => {
    // Reuse the same ?u= reload trick as forceUpdate() so showUpdateConfirmation
    // fires after the reload to confirm the new version is live.
    location.replace(location.pathname + "?u=" + Date.now() + location.hash);
  });
}

// ── Install prompt ────────────────────────────
// Shown once per browser (until dismissed) to explain how to add the PWA to
// the home screen. iOS Safari needs manual instructions; Android Chrome can
// use beforeinstallprompt for a native dialog.
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  // Don't show immediately on first load — wait for user engagement.
  setTimeout(() => maybeShowInstallPrompt(), 4000);
});

function isStandalone(){
  return window.matchMedia && window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}
function isIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function isAndroid(){
  return /Android/.test(navigator.userAgent);
}
// True when running inside the Capacitor native wrapper (the App Store / Play
// build), as opposed to the PWA in a mobile browser. Capacitor injects a
// global `Capacitor` object with isNativePlatform().
function isNativeApp(){
  try { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  catch(e){ return false; }
}

function maybeShowInstallPrompt(){
  if(isNativeApp()) return;                          // native app — already "installed", no A2HS prompt
  if(isStandalone()) return;                         // already installed
  if(load("install_dismissed_at")) {
    // Suppress for 14 days after dismissal
    const since = Date.now() - load("install_dismissed_at");
    if(since < 14 * 24 * 60 * 60 * 1000) return;
  }
  showInstallPrompt();
}

function showInstallPrompt(){
  const t = (I18N[State.lang] || I18N.en).install;
  const el2 = document.getElementById("install-prompt");
  el2.innerHTML = "";

  const closeB = el("button","close","×");
  closeB.setAttribute("aria-label","Close");
  closeB.addEventListener("click", dismissInstallPrompt);
  el2.appendChild(closeB);

  el2.appendChild(el("h3","",t.title));
  el2.appendChild(el("p","",t.sub));

  const steps = [];
  if(isIOS()){
    steps.push([" 📤", t.iosStep1]);
    steps.push(["➕", t.iosStep2]);
  } else if(isAndroid() && deferredInstallPrompt){
    // Native install will be triggered by the primary button
  } else {
    steps.push(["⋮", t.androidStep1]);
    steps.push(["➕", t.androidStep2]);
  }
  steps.forEach(([ic, txt])=>{
    const r = el("div","row");
    const ico = el("div","icon-step", ic);
    const tx = el("div","step-text", txt);
    r.appendChild(ico); r.appendChild(tx);
    el2.appendChild(r);
  });

  const actions = el("div","actions");
  const later = el("button","",t.maybeLater);
  later.addEventListener("click", dismissInstallPrompt);
  actions.appendChild(later);

  if(deferredInstallPrompt){
    const installB = el("button","primary",t.gotIt);
    installB.addEventListener("click", async ()=>{
      try {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
      } catch(e){}
      deferredInstallPrompt = null;
      dismissInstallPrompt();
    });
    actions.appendChild(installB);
  } else {
    const okB = el("button","primary",t.gotIt);
    okB.addEventListener("click", dismissInstallPrompt);
    actions.appendChild(okB);
  }
  el2.appendChild(actions);
  el2.classList.add("show");
  el2.setAttribute("aria-hidden","false");
}

function dismissInstallPrompt(){
  const el2 = document.getElementById("install-prompt");
  el2.classList.remove("show");
  el2.setAttribute("aria-hidden","true");
  save("install_dismissed_at", Date.now());
}

// ── Routing ───────────────────────────────────
function go(hash){ location.hash = hash; }
window.addEventListener("hashchange", route);

function route(){
  hideFeedback();
  // Reset scroll to the top on every navigation. Without this, navigating from
  // a long-scrolled page (e.g. the home list) into a shorter screen leaves the
  // viewport stuck at the bottom of the new content.
  try { window.scrollTo(0, 0); } catch(e) {}
  // Strip query string off the hash before splitting routes — paywall uses
  // ?from=<lid> as a soft analytics breadcrumb and ?dev=1 to enable dev unlock.
  const raw = location.hash.replace(/^#\/?/, "") || "home";
  const h = raw.split("?")[0];
  const parts = h.split("/").filter(Boolean);
  if(parts[0]==="home" || !parts.length) return renderHome();
  if(parts[0]==="paywall") return renderPaywall();
  if(parts[0]==="search") return renderSearch();
  if(parts[0]==="lesson"){
    const lid = parts[1];
    if(!lid) return renderHome();
    return loadLesson(lid).then(()=>{
      if(parts[2]==="overview") return renderOverview(lid, parts[3] || "en");
      if(parts[2]==="section") return renderSection(lid, parts[3], parts[4]||"intro", parseInt(parts[5]||"0",10));
      return renderLessonHome(lid);
    }).catch(e=>{
      $app().innerHTML = "<p>Could not load lesson. Refresh and try again.</p><p class='muted'>"+(e.message||e)+"</p>";
    });
  }
  return renderHome();
}

async function loadLesson(lid, lang){
  lang = lang || State.lang || "en";
  const cacheKey = lid + ":" + lang;
  if(State.lessons[cacheKey]) return State.lessons[cacheKey];
  // For non-English, try the language-specific file first; fall back to English silently.
  if(lang !== "en"){
    try {
      const r = await fetch("lessons/" + lid + "." + lang + ".json?b=" + BUILD);
      if(r.ok){
        const data = await r.json();
        State.lessons[cacheKey] = data;
        return data;
      }
    } catch(e){ /* fall through to English */ }
  }
  const r = await fetch("lessons/" + lid + ".json?b=" + BUILD);
  if(!r.ok) throw new Error("Missing lesson: " + lid);
  const data = await r.json();
  State.lessons[lid + ":en"] = data;
  if(lang !== "en") State.lessons[cacheKey] = data; // mark Spanish lookup as fallback to English so we don't refetch
  return data;
}
async function loadOverview(lid, lang){
  lang = lang || "en";
  const cacheKey = lid + ":" + lang;
  if(State.overviews[cacheKey]) return State.overviews[cacheKey];
  // English uses the bare filename; other languages use lid.<lang>.json
  const filename = lang === "en" ? lid + ".json" : lid + "." + lang + ".json";
  const r = await fetch("lessons/overviews/" + filename + "?b=" + BUILD);
  if(!r.ok) throw new Error("Missing overview: " + lid + " (" + lang + ")");
  const data = await r.json();
  State.overviews[cacheKey] = data;
  return data;
}

// ── Top bar / feedback ────────────────────────
// `backHash === null` means we're on the home screen itself — no back arrow,
// and no home shortcut (we're already there). Every other screen gets a small
// 🏠 button so testers/users can jump straight home without back-stepping.
function topbar(title, backHash, nextSecHash){
  const bar = el("div","topbar");
  const back = el("button","back", backHash ? "←" : "");
  back.setAttribute("aria-label","Back");
  if(backHash){ back.addEventListener("click", ()=>go(backHash)); }
  else { back.style.visibility="hidden"; }
  bar.appendChild(back);
  bar.appendChild(el("div","title", title || "MaltiOnTheGo"));
  if(backHash){
    const home = el("button","home-btn","🏠");
    home.setAttribute("aria-label","Home");
    home.addEventListener("click", ()=>go("/home"));
    bar.appendChild(home);
  }
  // Next section lives here, next to Home, so it's out of the way of the
  // per-item Previous/Next/Skip controls under the card.
  if(nextSecHash){
    const ns = el("button","home-btn nextsec-btn","⏭️");
    ns.setAttribute("aria-label","Next section");
    ns.title = "Next section";
    ns.addEventListener("click", ()=>go(nextSecHash));
    bar.appendChild(ns);
  }
  bar.appendChild(el("div","xp", "⭐ "+State.xp));
  return bar;
}
function progressBar(pct){
  const wrap = el("div","progress");
  const fill = el("div");
  fill.style.width = (pct||0)+"%";
  wrap.appendChild(fill);
  return wrap;
}

const $fb = () => document.getElementById("feedback");
function showFeedback(good, title, detail, onNext, opts){
  const fb = $fb();
  fb.className = "feedback show "+(good?"good":"bad");
  fb.innerHTML = "";
  const row = el("div","row");
  const txt = el("div","");
  txt.appendChild(el("h3","",title));
  if(detail){ txt.appendChild(el("p","",detail)); }
  row.appendChild(txt);
  // On a WRONG answer with no explicit button label, offer a real retry: use the
  // same "Try again ↺" phrase the other exercises use and re-render the current
  // step (route()) instead of advancing. Correct answers, and wrong answers that
  // already supply their own retry (opts.label), are unchanged.
  const retryDefault = (good === false) && !(opts && opts.label);
  const nx = el("button","next", (opts && opts.label) || (good ? "Next →" : "Try again ↺"));
  nx.addEventListener("click", ()=>{
    hideFeedback();
    if(retryDefault){ route(); } else { onNext && onNext(); }
  });
  row.appendChild(nx);
  fb.appendChild(row);
}
function hideFeedback(){ $fb().classList.remove("show","good","bad"); }

// ── Paywall ───────────────────────────────────
// Three tiers + Restore. Real purchase wiring lives in the native Capacitor IAP
// plugin (added at native-wrap time); the buttons below call a single
// purchase(productId) hook that we stub for the web build. The hook is the only
// place that talks to the store, so adding the plugin later is one-call wide.
// Subscription store product IDs (informational; one-off pack IDs live on PACKS).
const IAP_PRODUCTS = {
  monthly: "com.greenworksmalta.maltiongthego.sub.monthly",
  yearly:  "com.greenworksmalta.maltiongthego.sub.yearly",
};

/* ── Billing ──────────────────────────────────────────────────────────────
   RevenueCat (@revenuecat/purchases-capacitor) on the native iOS/Android wrap;
   a no-op preview stub on the web PWA. The web build NEVER touches the store,
   so the live GitHub Pages site is completely unaffected by anything here.

   All store/product config lives in the RevenueCat dashboard — see
   app-assets/REVENUECAT-SETUP.md. We gate on RevenueCat *entitlements* and buy
   via *packages* (by identifier), so this code doesn't hard-code store IDs.
   API keys are public (like a Sentry DSN) and read from app-config.js.
   NOTE: native IAP can't be verified in the web sandbox — test on a device
   build with the RevenueCat project configured before trusting it.
--------------------------------------------------------------------------- */

// RevenueCat entitlement identifier -> how it maps onto State.entitlement.
const RC_ENTITLEMENTS = {
  subscription:  { type: "sub" },
  pack_starter:  { type: "pack", pack: "starter" },
  pack_core:     { type: "pack", pack: "core" },
  pack_advanced: { type: "pack", pack: "advanced" },
};
// Our paywall tier key -> RevenueCat package identifier (set in the RC offering).
const RC_PACKAGES = {
  monthly: "$rc_monthly",
  yearly:  "$rc_annual",
  starter: "starter",
  core:    "core",
  advanced: "advanced",
};

function isNativePlatform(){
  return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
}
function rcPurchases(){
  return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases) || null;
}

const Billing = {
  ready: false,
  offering: null,

  async init(){
    if(!isNativePlatform()) return;                 // web PWA: nothing to do
    const P = rcPurchases();
    if(!P){ console.warn("[billing] RevenueCat plugin missing from this build"); return; }
    const cfg = window.MALTI_CONFIG || {};
    const isIos = window.Capacitor.getPlatform && window.Capacitor.getPlatform() === "ios";
    const key = isIos ? cfg.revenueCatIosKey : cfg.revenueCatAndroidKey;
    if(!key){ console.warn("[billing] no RevenueCat API key in app-config.js"); return; }
    try{
      await P.configure({ apiKey: key });
      this.ready = true;
      await this.refreshOfferings();
      const { customerInfo } = await P.getCustomerInfo();
      applyRcEntitlements(customerInfo);
    }catch(e){ console.warn("[billing] init failed", e); }
  },

  async refreshOfferings(){
    const P = rcPurchases(); if(!P) return;
    try{
      const offerings = await P.getOfferings();
      this.offering = (offerings && offerings.current) || null;
    }catch(e){ console.warn("[billing] getOfferings failed", e); }
  },

  packageForKey(key){
    const wantId = RC_PACKAGES[key] || key;
    const pkgs = (this.offering && this.offering.availablePackages) || [];
    return pkgs.find(p => p.identifier === wantId)
        || pkgs.find(p => p.product && p.product.identifier === wantId)
        || null;
  },

  async purchase(key){
    const P = rcPurchases(); if(!P) throw new Error("billing unavailable");
    if(!this.offering) await this.refreshOfferings();
    const pkg = this.packageForKey(key);
    if(!pkg) throw new Error("no RevenueCat package for '" + key + "'");
    const res = await P.purchasePackage({ aPackage: pkg });
    applyRcEntitlements(res.customerInfo);
    return res.customerInfo;
  },

  async restore(){
    const P = rcPurchases(); if(!P) return { restored: false };
    const { customerInfo } = await P.restorePurchases();
    applyRcEntitlements(customerInfo);
    return { restored: hasAnyPack() || isSubscribed() };
  },
};

// Translate a RevenueCat customerInfo into our local entitlement state.
function applyRcEntitlements(customerInfo){
  const active = (customerInfo && customerInfo.entitlements && customerInfo.entitlements.active) || {};
  let tier = "free";
  const packs = {};
  Object.keys(active).forEach(entId => {
    const map = RC_ENTITLEMENTS[entId];
    if(!map) return;
    if(map.type === "sub"){
      const prod = active[entId].productIdentifier || "";
      tier = /year|annual/i.test(prod) ? "yearly" : "monthly";
    } else if(map.type === "pack"){
      packs[map.pack] = true;
    }
  });
  setEntitlement({ tier: tier, packs: packs });
}

// Called by the paywall buttons. Native → RevenueCat; web → preview stub.
function purchase(tier){
  const key = tier && tier.key;
  trackEvent("purchase_clicked", { product: key, tier: State.entitlement.tier });
  if(!isNativePlatform()){
    alert("Purchases turn on in the app-store build.\n\nPlan: " + ((tier && tier.title) || key));
    return;
  }
  Billing.purchase(key).then(() => {
    renderPaywall();
  }).catch(e => {
    if(e && /cancel/i.test(e.message || "")) return;   // user backed out — silent
    console.warn("[billing] purchase failed", e);
    alert("Sorry — that didn't go through. Please try again.");
  });
}
// Restore re-syncs entitlement from the store. Web build no-ops.
function restorePurchases(){
  trackEvent("restore_clicked");
  if(!isNativePlatform()) return Promise.resolve({ restored: false });
  return Billing.restore();
}

function renderPaywall(){
  // The router strips the query off the hash before dispatch; we re-parse the
  // raw hash here to surface the lesson the user tapped on as a track prop.
  const fromMatch = location.hash.match(/[?&]from=([\w-]+)/);
  trackEvent("paywall_viewed", {
    from: fromMatch ? fromMatch[1] : "direct",
    tier: State.entitlement.tier,
    packs: PACKS.filter(x => ownsPack(x.key)).map(x => x.key).join(",") || "none",
  });

  const root = $app();
  root.innerHTML = "";
  root.appendChild(topbar("MaltiOnTheGo", "/home"));

  const t = I18N[State.lang] || I18N.en;
  const p = t.paywall;

  const hero = el("div","paywall-hero");
  hero.appendChild(el("h1","", p.title));
  hero.appendChild(el("p","", p.sub));
  root.appendChild(hero);

  // Current-plan badge (only meaningful once the user has bought something —
  // free-tier users don't need to be told they're on the free tier).
  const ent = State.entitlement;
  const hasAny = hasAnyPack() || isSubscribed();
  if(hasAny){
    const badge = el("div","paywall-current");
    badge.textContent = p.current + ": " + planSummary(p);
    root.appendChild(badge);
  }

  // One-off pack cards are built from PACKS; a subscription owns everything, so
  // every pack reads as "owned" while subscribed. The two subscription cards
  // follow, with Monthly featured.
  const packTiers = PACKS.map(pk => ({
    key: pk.key,
    title: p[pk.key + "Title"], price: p[pk.key + "Price"], tag: p[pk.key + "Tag"], body: p[pk.key + "Body"],
    owned: ownsPack(pk.key) || isSubscribed(),
    productId: pk.productId,
  }));
  const tiers = packTiers.concat([
    {
      key: "monthly",
      title: p.monthlyTitle, price: p.monthlyPrice, tag: p.monthlyTag, body: p.monthlyBody,
      owned: ent.tier === "monthly",
      productId: IAP_PRODUCTS.monthly,
      featured: true,
    },
    {
      key: "yearly",
      title: p.yearlyTitle, price: p.yearlyPrice, tag: p.yearlyTag, body: p.yearlyBody,
      owned: ent.tier === "yearly",
      productId: IAP_PRODUCTS.yearly,
    },
  ]);

  const list = el("div","paywall-tiers");
  tiers.forEach(tier => {
    const card = el("div","paywall-tier" + (tier.featured ? " featured" : "") + (tier.owned ? " owned" : ""));
    const head = el("div","paywall-tier-head");
    head.appendChild(el("h2","", tier.title));
    const priceRow = el("div","paywall-price-row");
    priceRow.appendChild(el("span","paywall-price", tier.price));
    priceRow.appendChild(el("span","paywall-tag", tier.tag));
    head.appendChild(priceRow);
    card.appendChild(head);
    card.appendChild(el("p","paywall-body", tier.body));
    const btn = el("button","paywall-cta", tier.owned ? "✓" : p.cta);
    btn.disabled = !!tier.owned;
    btn.addEventListener("click", () => purchase(tier));
    card.appendChild(btn);
    list.appendChild(card);
  });
  root.appendChild(list);

  // Subscriber perks — what a Monthly/Yearly plan adds beyond the one-off
  // starter pack: monthly content drops, phrase search and future features.
  if(p.perks && p.perks.length){
    const perks = el("div","paywall-perks");
    perks.appendChild(el("h3","", p.perksTitle));
    p.perks.forEach(txt => {
      const row = el("div","paywall-perk");
      row.appendChild(el("span","tick","✓"));
      row.appendChild(el("span","", txt));
      perks.appendChild(row);
    });
    root.appendChild(perks);
  }

  // Restore — required by Apple, expected by Google.
  const restoreWrap = el("div","paywall-restore");
  restoreWrap.appendChild(el("p","muted", p.restoreNote));
  const rb = el("button","paywall-restore-btn", p.restore);
  rb.addEventListener("click", async () => {
    rb.disabled = true;
    const orig = rb.textContent;
    rb.textContent = "…";
    const res = await restorePurchases();
    rb.disabled = false;
    rb.textContent = orig;
    alert(res.restored ? p.restored : p.nothingToRestore);
    if(res.restored) renderPaywall();
  });
  restoreWrap.appendChild(rb);
  root.appendChild(restoreWrap);

  // Tiny disclaimer + manage-sub deep-link for the store.
  const meta = el("div","paywall-meta");
  meta.appendChild(el("p","muted small", p.comingSoon));
  root.appendChild(meta);

  // (Production: the hidden ?dev=1 / 7-tap unlock and its in-paywall tier-toggle
  // panel were removed before launch. Real testing uses sandbox accounts.)
}

// ── Search ────────────────────────────────────
// Strip diacritics so "ġ"/"ż"/"ċ" and Spanish accents all match plain ASCII
// typing — learners rarely type the Maltese special characters. The dotted
// letters decompose via NFD; "ħ" (h-with-stroke) does not, so it's mapped by
// hand to plain "h".
function normalizeSearch(s){
  return String(s == null ? "" : s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ħ/g, "h")
    .trim();
}

// Build the search index, once per language, cached on State. It holds two
// lists:
//   topics  — one entry per lesson and per section, searchable by title +
//             subtitle (e.g. typing "numbers" finds the "Numbers 1–30"
//             section); tapping jumps straight into it.
//   entries — every {mt, en} phrase pair (vocab / dialogue / letter words).
// A lesson file's `en` field holds whatever that file's language is (English
// in lessonN.json, Spanish in lessonN.es.json), stored here as `tr`.
async function buildSearchIndex(){
  const lang = State.lang || "en";
  if(State.searchIndex && State.searchIndex.lang === lang) return State.searchIndex;
  const entries = [];
  const topics = [];
  const seen = new Set();
  for(const meta of (State.index && State.index.lessons || [])){
    if(!isLessonVisible(meta)) continue;   // keep dev-only lessons out of search
    let lesson;
    try { lesson = await loadLesson(meta.id, lang); }
    catch(e){ continue; }
    const lessonTitle = (lang === "es" && meta.titleEs) ? meta.titleEs : meta.title;
    const lessonSub = (lang === "es" && meta.subtitleEs) ? meta.subtitleEs : (meta.subtitle || "");
    topics.push({
      kind: "lesson", icon: meta.icon || "📘",
      title: lessonTitle, sub: lessonSub,
      lid: meta.id, lessonTitle: lessonTitle, hash: "/lesson/" + meta.id,
      nsearch: normalizeSearch(lessonTitle + " " + lessonSub),
    });
    // Phrases are deduped globally — the first lesson that teaches a phrase wins.
    const add = (mt, tr) => {
      if(!mt || !tr) return;
      const nmt = normalizeSearch(mt), ntr = normalizeSearch(tr);
      const key = nmt + "|" + ntr;
      if(seen.has(key)) return;
      seen.add(key);
      entries.push({ mt: mt, tr: tr, lid: meta.id, lessonTitle: lessonTitle, nmt: nmt, ntr: ntr });
    };
    for(const sec of (lesson.sections || [])){
      // Deep-link to the section only if it has a step flow; otherwise fall
      // back to the lesson home so we never land on an empty section screen.
      const hasFlow = !!(SECTION_FLOWS[sec.id] && SECTION_FLOWS[sec.id].length);
      topics.push({
        kind: "section", icon: sec.icon || "📘",
        title: sec.title || "", sub: sec.subtitle || "",
        lid: meta.id, lessonTitle: lessonTitle,
        hash: hasFlow ? "/lesson/" + meta.id + "/section/" + sec.id : "/lesson/" + meta.id,
        nsearch: normalizeSearch((sec.title || "") + " " + (sec.subtitle || "")),
      });
      (sec.vocab || []).forEach(x => add(x.mt, x.en));
      (sec.dialogue || []).forEach(x => add(x.mt, x.en));
      (sec.letters || []).forEach(L => (L.words || []).forEach(w => add(w.mt, w.en)));
    }
  }
  State.searchIndex = { lang: lang, entries: entries, topics: topics };
  return State.searchIndex;
}

// Rank a query against one or more normalized text fields:
// exact > starts-with > word-start > substring. Returns 0 for no match.
function scoreSearch(fields, q){
  let score = 0;
  for(const f of fields){
    if(f === q) score = Math.max(score, 100);
    else if(f.startsWith(q)) score = Math.max(score, 70);
    else if(f.includes(" " + q)) score = Math.max(score, 50);
    else if(f.includes(q)) score = Math.max(score, 30);
  }
  return score;
}

// Topic matches — lessons and sections by title/subtitle.
function searchTopics(index, query){
  const q = normalizeSearch(query);
  if(!q) return [];
  const scored = [];
  for(const tp of index.topics){
    const score = scoreSearch([tp.nsearch], q);
    if(score) scored.push({ tp: tp, score: score });
  }
  scored.sort((a, b) => b.score - a.score || a.tp.title.localeCompare(b.tp.title));
  return scored.slice(0, 8).map(s => s.tp);
}

// Phrase matches — searches both the Maltese and the translation, so the
// learner can type in either language.
function searchPhrases(index, query){
  const q = normalizeSearch(query);
  if(!q) return [];
  const scored = [];
  for(const e of index.entries){
    const score = scoreSearch([e.nmt, e.ntr], q);
    if(score) scored.push({ e: e, score: score });
  }
  scored.sort((a, b) => b.score - a.score || a.e.tr.localeCompare(b.e.tr));
  return scored.slice(0, 50).map(s => s.e);
}

function renderSearch(){
  const root = $app();
  root.innerHTML = "";
  const t = I18N[State.lang] || I18N.en;
  const ts = t.search;
  root.appendChild(topbar(ts.title, "/home"));

  // Subscription gate — search is a subscriber-only perk. Starter-pack and
  // free users see an upgrade prompt instead.
  if(!isSubscribed()){
    const lock = el("div","search-lock");
    lock.appendChild(el("div","search-lock-icon","🔎"));
    lock.appendChild(el("h2","", ts.locked));
    lock.appendChild(el("p","", ts.lockedSub));
    const cta = el("button","btn", ts.lockedCta);
    cta.addEventListener("click", ()=>go("/paywall?from=search"));
    lock.appendChild(cta);
    root.appendChild(lock);
    return;
  }

  root.appendChild(el("p","search-hint", ts.hint));

  const box = el("div","search-box");
  const input = document.createElement("input");
  input.type = "search";
  input.className = "search-input";
  input.placeholder = ts.placeholder;
  input.setAttribute("autocomplete","off");
  input.setAttribute("autocapitalize","off");
  input.setAttribute("autocorrect","off");
  box.appendChild(input);
  root.appendChild(box);

  const status = el("div","search-status");
  root.appendChild(status);
  const results = el("div","search-results");
  root.appendChild(results);

  let index = null;

  function renderResults(){
    const q = input.value;
    results.innerHTML = "";
    if(!normalizeSearch(q)){ status.textContent = ""; return; }
    if(!index){ status.textContent = ts.loading; return; }
    const topics = searchTopics(index, q);
    const phrases = searchPhrases(index, q);
    const total = topics.length + phrases.length;
    if(!total){ status.textContent = ts.noResults; return; }
    status.textContent = total + " " + (total === 1 ? ts.resultCount : ts.resultCountPlural);

    // Topics first — broader navigational matches (lessons & sections).
    if(topics.length){
      results.appendChild(el("div","search-group-label", ts.topicsLabel));
      for(const tp of topics){
        const card = el("button","search-result topic");
        card.appendChild(el("div","search-result-icon", tp.icon));
        const txt = el("div","search-result-text");
        txt.appendChild(el("span","search-mt", tp.title));
        if(tp.sub) txt.appendChild(el("span","search-tr", tp.sub));
        // Section topics show which lesson they live in; lesson topics don't
        // (the title already is the lesson).
        if(tp.kind === "section"){
          txt.appendChild(el("span","search-where", ts.inLesson + " " + tp.lessonTitle));
        }
        card.appendChild(txt);
        card.appendChild(el("div","chev","›"));
        card.addEventListener("click", ()=>go(tp.hash));
        results.appendChild(card);
      }
    }

    if(phrases.length){
      results.appendChild(el("div","search-group-label", ts.phrasesLabel));
      for(const h of phrases){
        const card = el("button","search-result");
        const txt = el("div","search-result-text");
        txt.appendChild(el("span","search-mt", h.mt));
        txt.appendChild(el("span","search-tr", h.tr));
        txt.appendChild(el("span","search-where", ts.inLesson + " " + h.lessonTitle));
        card.appendChild(txt);
        card.appendChild(el("div","chev","›"));
        card.addEventListener("click", ()=>go("/lesson/" + h.lid));
        results.appendChild(card);
      }
    }
  }

  input.addEventListener("input", renderResults);

  // Build the index lazily on first open, then re-render any pending query.
  buildSearchIndex().then(idx => {
    index = idx;
    renderResults();
  }).catch(e => {
    status.textContent = ts.noResults;
  });

  try { input.focus(); } catch(e) {}
}

function renderHome(){
  const root = $app();
  root.innerHTML = "";
  root.appendChild(topbar("MaltiOnTheGo", null));

  // Tester-unlock breadcrumb so the team can see at a glance that they're
  // running on the unlocked web preview, not a real signed-in user. Only
  // shown when applyTesterUnlock() granted access on this device.
  if(TESTER_UNLOCKED){
    const tag = el("div","tester-banner","🧪 Tester unlock active — full access. Append ?unlock=off to clear.");
    root.appendChild(tag);
  }

  // Branded splash hero — uses the generated splash.png so the wordmark + balcony
  // illustration hits the user the moment they open the app.
  const heroSplash = el("div","hero-branded");
  const img = document.createElement("img");
  img.src = v("splash.png");
  img.alt = "MaltiOnTheGo — Maltese for life and work in Malta";
  heroSplash.appendChild(img);
  root.appendChild(heroSplash);

  // Welcome card under the splash — calm cream gradient with navy headline
  // and a red accent. Pulls from the logo's full palette without dominating.
  const tHome = I18N[State.lang] || I18N.en;
  const hero = el("div","hero-welcome");
  hero.appendChild(el("span","eyebrow", tHome.heroEyebrow));
  hero.appendChild(el("h1","", tHome.heroH1));
  hero.appendChild(el("p","", tHome.heroP));
  hero.appendChild(el("span","accent-bar"));
  root.appendChild(hero);

  // Language toggle — sets the default for all lessons (persisted in
  // localStorage as preferred_lang). Per-lesson toggles inside a lesson
  // home still work and override for that view.
  const langWrap = el("div","lang-toggle");
  const langLabels = {en: "🇬🇧 English", es: "🇪🇸 Español"};
  ["en", "es"].forEach(L => {
    const b = el("button","lang-btn"+(L === State.lang ? " active" : ""), langLabels[L]);
    b.addEventListener("click", () => {
      if(L === State.lang) return;
      State.lang = L;
      save("preferred_lang", L);
      renderHome();
    });
    langWrap.appendChild(b);
  });
  root.appendChild(langWrap);

  // Phrase search entry — a subscriber perk. Subscribers get a search
  // affordance; everyone else sees a locked teaser. Both route to /search,
  // which gates itself and shows the upgrade prompt to non-subscribers.
  const tSearch = tHome.search;
  const subbed = isSubscribed();
  const searchEntry = el("button","search-entry" + (subbed ? "" : " locked"));
  searchEntry.appendChild(el("span","search-entry-icon","🔎"));
  const seMeta = el("div","search-entry-meta");
  seMeta.appendChild(el("strong","", tSearch.title));
  seMeta.appendChild(el("span","", subbed ? tSearch.hint : tSearch.lockedCta));
  searchEntry.appendChild(seMeta);
  searchEntry.appendChild(el("span","chev", subbed ? "›" : "🔒"));
  searchEntry.addEventListener("click", ()=>go("/search"));
  root.appendChild(searchEntry);

  // Group by module — numeric modules ("1", "2", "3") render as "Module N",
  // non-numeric ones ("Extras") render under their own label. We bucket by the
  // language-specific module name so Spanish users see "El Curso", etc.
  const moduleKey = (L) => (State.lang === "es" && L.moduleEs) ? L.moduleEs : L.module;
  const byMod = {};
  // Dev-only lessons (index.json `"dev": true`) are hidden unless dev mode is on.
  const visibleLessons = State.index.lessons.filter(isLessonVisible);
  for(const L of visibleLessons){
    const k = moduleKey(L);
    (byMod[k] = byMod[k] || []).push(L);
  }
  // Sort: free / starter group first (so newcomers see it on top), then numeric
  // modules in order, then any other non-numeric groups alphabetically. Detect
  // starters by the lesson's `free` flag rather than regex-matching the module
  // name — otherwise the welcome card sorts wrong in non-English locales (the
  // Spanish module is "Empieza Aquí · Gratis", which doesn't match /free|start here/).
  const starterMods = new Set();
  for(const L of visibleLessons){
    if(L.free) starterMods.add(moduleKey(L));
  }
  const isStarter = (k) => starterMods.has(k);
  // If index.json defines an explicit packOrder, honour it (lets named packs
  // like "First Words / Everyday Malti / Out & About" render in intended order
  // instead of alphabetically). Falls back to the legacy free-first/numeric sort.
  const packOrder = (State.index && State.index.packOrder) || null;
  const modKeys = Object.keys(byMod).sort((a, b) => {
    if(packOrder){
      const ia = packOrder.indexOf(a), ib = packOrder.indexOf(b);
      if(ia !== -1 || ib !== -1){
        if(ia === -1) return 1;
        if(ib === -1) return -1;
        return ia - ib;
      }
    }
    if(isStarter(a) && !isStarter(b)) return -1;
    if(!isStarter(a) && isStarter(b)) return 1;
    const an = parseInt(a), bn = parseInt(b);
    const aNum = !isNaN(an), bNum = !isNaN(bn);
    if(aNum && bNum) return an - bn;
    if(aNum && !bNum) return -1;
    if(!aNum && bNum) return 1;
    return String(a).localeCompare(String(b));
  });
  modKeys.forEach(mod=>{
    const isNumeric = !isNaN(parseInt(mod));
    const label = isNumeric ? (State.lang === "es" ? "Módulo " : "Module ") + mod : String(mod);
    root.appendChild(el("div","module-label",label));
    const list = el("div","section-list");
    for(const L of byMod[mod]){
      const unlocked = isLessonUnlocked(L.id);
      const card = el("button","section-card" + (L.free ? " is-free" : "") + (unlocked ? "" : " is-locked"));
      const ic = el("div","icon"); ic.textContent = L.icon || "📘";
      const meta = el("div","meta");
      // Title row carries an optional FREE pill so the free starter is visually marked.
      const titleRow = el("div","title-row");
      const lessonTitle = (State.lang === "es" && L.titleEs) ? L.titleEs : L.title;
      const lessonSubtitle = (State.lang === "es" && L.subtitleEs) ? L.subtitleEs : L.subtitle;
      titleRow.appendChild(el("strong","", lessonTitle));
      if(L.free){
        const badge = el("span","badge-free", tHome.freeBadge || "FREE");
        titleRow.appendChild(badge);
      } else if(!unlocked){
        titleRow.appendChild(el("span","badge-lock", "🔒"));
      }
      meta.appendChild(titleRow);
      meta.appendChild(el("span","", lessonSubtitle));
      // progress (cached if lesson loaded; otherwise unknown)
      const pct = lessonProgress(L.id);
      const bw = el("div","barwrap"); const bf = el("div"); bf.style.width = pct+"%"; bw.appendChild(bf);
      meta.appendChild(bw);
      if(unlocked){
        meta.appendChild(el("span","pct", pct>=100 ? ("✓ "+tHome.statusDone) : (pct>0 ? pct+"%" : tHome.statusStart)));
      } else {
        meta.appendChild(el("span","pct locked-pct", tHome.unlock || "Unlock"));
      }
      const chev = el("div","chev","›");
      card.appendChild(ic); card.appendChild(meta); card.appendChild(chev);
      card.addEventListener("click", ()=>{
        if(!unlocked){ go("/paywall?from=" + L.id); return; }
        go("/lesson/"+L.id);
      });
      list.appendChild(card);
    }
    root.appendChild(list);
  });

  // Footer with manual update + version display + privacy link.
  const t = I18N[State.lang] || I18N.en;
  const footer = el("div","app-footer");
  const updBtn = el("button","update", t.checkForUpdates);
  updBtn.addEventListener("click", () => forceUpdate(updBtn));
  footer.appendChild(updBtn);
  // Static version label in the footer. The hidden 7-tap tester unlock was
  // removed before production launch to close a payment-bypass; testing now
  // uses real sandbox accounts (Play license testers / Apple sandbox testers).
  const verSpan = el("span","ver", t.version + " " + VERSION + " · build " + BUILD);
  footer.appendChild(verSpan);
  // Manage-plan link — opens the paywall as a settings surface. Only after
  // launch will this also expose the store's native "Manage subscription" deep
  // link; for now it's the single entry point to see and change the plan.
  const planLink = document.createElement("a");
  planLink.className = "privacy-link";
  planLink.href = "#/paywall";
  const tp = (t.paywall || {});
  planLink.textContent = (tp.current || "Plan") + ": " + planSummary(tp);
  footer.appendChild(planLink);
  // Privacy link — opens the static page; deep-links the user's preferred lang.
  const privacy = document.createElement("a");
  privacy.className = "privacy-link";
  privacy.href = "privacy.html#" + (State.lang || "en");
  privacy.textContent = t.privacy;
  footer.appendChild(privacy);
  root.appendChild(footer);
}

// ── Lesson home (sections) ────────────────────
function renderLessonHome(lid){
  const lesson = currentLesson(lid);
  const root = $app();
  root.innerHTML = "";
  root.appendChild(topbar(lesson.title, "/home"));

  const hero = el("div","hero");
  hero.appendChild(el("h1","",lesson.title));
  hero.appendChild(el("p","",lesson.subtitle));
  root.appendChild(hero);

  // Language toggle — appears whenever the lesson supports more than one language.
  const lessonMeta = (State.index.lessons || []).find(l => l.id === lid) || {};
  const availableLangs = lessonMeta.languages || ["en"];
  if(availableLangs.length > 1){
    const labels = {en: "🇬🇧 English", es: "🇪🇸 Español"};
    const langWrap = el("div","lang-toggle");
    availableLangs.forEach(L => {
      const b = el("button","lang-btn"+(L === State.lang ? " active" : ""), labels[L] || L.toUpperCase());
      b.addEventListener("click", async ()=>{
        if(L === State.lang) return;
        State.lang = L;
        save("preferred_lang", L);
        // Pre-load the lesson in the new language so re-render reads from cache
        try { await loadLesson(lid, L); } catch(e){}
        renderLessonHome(lid);
      });
      langWrap.appendChild(b);
    });
    root.appendChild(langWrap);
  }

  root.appendChild(progressBar(lessonProgress(lid)));

  // Overview card — always shown first
  const tLh = I18N[State.lang] || I18N.en;
  const oc = el("button","overview-card");
  const oi = el("div","icon"); oi.textContent = "🎧";
  const om = el("div","meta");
  om.appendChild(el("strong","", tLh.overview));
  om.appendChild(el("span","", tLh.overviewSub));
  const ochev = el("div","chev","›");
  oc.appendChild(oi); oc.appendChild(om); oc.appendChild(ochev);
  oc.addEventListener("click", ()=>go("/lesson/"+lid+"/overview"));
  root.appendChild(oc);

  const list = el("div","section-list");
  for(const sec of lesson.sections){
    const card = el("button","section-card");
    const pct = (State.progress[lid]||{})[sec.id]||0;
    if(pct>=100) card.classList.add("done");
    const ic = el("div","icon"); ic.textContent = sec.icon || "📘";
    const meta = el("div","meta");
    meta.appendChild(el("strong","",sec.title));
    meta.appendChild(el("span","",sec.subtitle||""));
    const bw = el("div","barwrap"); const bf = el("div"); bf.style.width = pct+"%"; bw.appendChild(bf);
    meta.appendChild(bw);
    meta.appendChild(el("span","pct", pct>=100 ? "✓ Done" : (pct>0 ? pct+"%" : "Start")));
    const chev = el("div","chev","›");
    card.appendChild(ic); card.appendChild(meta); card.appendChild(chev);
    card.addEventListener("click", ()=>go("/lesson/"+lid+"/section/"+sec.id));
    list.appendChild(card);
  }
  root.appendChild(list);
}

// ── Overview helpers ──────────────────────────
// Convert inline markdown-ish **word** to highlighted span. Escapes everything else.
function renderInline(text){
  if(!text) return "";
  // Escape HTML
  const esc = String(text)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  // Replace **word** with <span class="hl">word</span>
  return esc.replace(/\*\*([^*]+?)\*\*/g, '<span class="hl">$1</span>');
}

// ── Overview / podcast player ─────────────────
async function renderOverview(lid, lang){
  lang = lang || "en";
  const root = $app();
  root.innerHTML = "";
  root.appendChild(topbar("Overview", "/lesson/"+lid));

  let ov;
  try { ov = await loadOverview(lid, lang); }
  catch(e){
    // Fall back to English if the requested language doesn't exist
    if(lang !== "en"){
      try { ov = await loadOverview(lid, "en"); lang = "en"; }
      catch(e2){
        root.appendChild(el("p","muted","Could not load this overview. Refresh and try again."));
        return;
      }
    } else {
      root.appendChild(el("p","muted","Could not load this overview. Refresh and try again."));
      return;
    }
  }
  const lesson = currentLesson(lid);
  // Discover available languages from the index entry; default to ["en"]
  const lessonMeta = (State.index.lessons || []).find(l => l.id === lid) || {};
  const availableLangs = lessonMeta.languages || ["en"];

  // Stop other audio
  if(currentBtn){ currentBtn.classList.remove("playing"); currentBtn=null; }
  player.pause();

  // Hero
  const hero = el("div","hero");
  hero.appendChild(el("div","sub","Listen as you go"));
  hero.appendChild(el("h1","",ov.title || (lesson.title+" — Overview")));
  hero.appendChild(el("p","",ov.subtitle || "An English-narrated walk-through with Maltese examples."));
  root.appendChild(hero);

  // Language toggle (only shown when the lesson has more than one language)
  if(availableLangs.length > 1){
    const langWrap = el("div","lang-toggle");
    const labels = {en: "🇬🇧 English", es: "🇪🇸 Español"};
    availableLangs.forEach(L=>{
      const b = el("button","lang-btn"+(L===lang?" active":""), labels[L] || L.toUpperCase());
      b.addEventListener("click", ()=>{
        if(L === lang) return;
        // Save preference globally + re-render at the requested language
        State.lang = L;
        save("preferred_lang", L);
        go("/lesson/"+lid+"/overview/"+L);
      });
      langWrap.appendChild(b);
    });
    root.appendChild(langWrap);
  }

  // Build segment timing estimates from char counts
  const segs = ov.transcript.filter(s => s && (s.en || s.mt));
  const totalChars = segs.reduce((a,s) => a + (s.en||s.mt||"").length + 6, 0);
  // We'll set real durations once metadata loads.

  // Audio element (separate from the small mt clip player)
  const audioFile = lang === "en" ? "narration_"+lid+".mp3" : "narration_"+lid+"_"+lang+".mp3";
  const audio = new Audio(v("audio/"+audioFile));
  audio.preload = "metadata";
  audio.playbackRate = parseFloat(load("speed_"+lid) || "1") || 1;

  // Real per-segment timings produced by generate_narration.py (per-segment
  // TTS renders → exact MP3 byte-size → exact ms duration). When this JSON is
  // available we use it as the source of truth for highlight sync, replacing
  // the legacy character-proportional estimate (which drifted over time).
  const timingsFile = lang === "en"
    ? "narration_"+lid+".timings.json"
    : "narration_"+lid+"_"+lang+".timings.json";
  let realTimings = null;       // [{i, start, end}] from the JSON if present
  let timingsByIdx = null;      // map of transcript-idx -> {start, end}
  fetch(v("audio/"+timingsFile))
    .then(r => r.ok ? r.json() : null)
    .then(j => {
      if(!j || !Array.isArray(j.segments)) return;
      realTimings = j.segments;
      timingsByIdx = {};
      realTimings.forEach(t => { timingsByIdx[t.i] = {start: t.start/1000, end: t.end/1000}; });
      // Re-apply timings into the segTimes the renderer reads. If metadata
      // already loaded the estimate, this overwrite is what cancels drift.
      applyRealTimingsIfReady();
    })
    .catch(()=>{ /* missing or invalid timings — silently fall back to estimate */ });

  // Player widget
  const pl = el("div","player");
  const ctrls = el("div","controls");
  const back15 = el("button","skip","-15");
  back15.setAttribute("aria-label","Back 15 seconds");
  const playB = el("button","play-big","▶");
  playB.setAttribute("aria-label","Play / Pause");
  const fwd15 = el("button","skip","+15");
  fwd15.setAttribute("aria-label","Forward 15 seconds");
  const meta = el("div","meta");
  meta.appendChild(el("div","t", ov.title || (lesson.title+" — Overview")));
  const subTime = el("div","s","loading…");
  meta.appendChild(subTime);
  ctrls.appendChild(back15); ctrls.appendChild(playB); ctrls.appendChild(fwd15); ctrls.appendChild(meta);
  pl.appendChild(ctrls);

  const bar = el("div","bar");
  const range = document.createElement("input");
  range.type = "range"; range.min = 0; range.max = 1000; range.value = 0; range.step = 1;
  range.setAttribute("aria-label","Seek");
  const tEl = el("div","time","0:00");
  bar.appendChild(tEl);
  bar.appendChild(range);
  const dEl = el("div","time","--:--");
  bar.appendChild(dEl);
  pl.appendChild(bar);

  // Track whether the user is actively dragging the slider, so timeupdate
  // doesn't snap the thumb back while they're moving it.
  let isSeeking = false;
  const startSeek = ()=>{ isSeeking = true; };
  const commitSeek = ()=>{
    if(audio.duration>0) audio.currentTime = (range.value/1000) * audio.duration;
    isSeeking = false;
  };
  range.addEventListener("pointerdown", startSeek);
  range.addEventListener("touchstart", startSeek, {passive:true});
  range.addEventListener("input", ()=>{
    // Live-preview the time label while dragging
    if(audio.duration>0) tEl.textContent = fmt((range.value/1000) * audio.duration);
  });
  range.addEventListener("change", commitSeek);
  range.addEventListener("pointerup", commitSeek);
  range.addEventListener("touchend", commitSeek);
  range.addEventListener("pointercancel", ()=>{ isSeeking = false; });

  const speedRow = el("div","speed");
  [0.85, 1.0, 1.15, 1.3].forEach(rate=>{
    const b = el("button","", rate.toFixed(2).replace(/\.?0+$/,"")+"×");
    if(Math.abs(audio.playbackRate - rate) < 0.01) b.classList.add("active");
    b.addEventListener("click", ()=>{
      audio.playbackRate = rate; save("speed_"+lid, String(rate));
      [...speedRow.children].forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
    });
    speedRow.appendChild(b);
  });
  pl.appendChild(speedRow);
  root.appendChild(pl);

  // Chapter jump bar — derived from "header" segments. Sits below the player so
  // the listener can leap straight to a section without dragging the scrubber.
  const headerIdxs = [];
  segs.forEach((s, i) => { if (s.kind === "header") headerIdxs.push(i); });
  const chWrap = el("div","chapters");
  const chButtons = [];
  if(headerIdxs.length > 1){
    chWrap.appendChild(el("div","label","Jump to a section"));
    headerIdxs.forEach(i=>{
      const text = (segs[i].en || segs[i].mt || "").replace(/[^\p{L}\p{N} —&-]/gu," ").replace(/\s+/g," ").trim();
      const b = el("button","ch");
      const tt = el("span","tt", text.length>32 ? text.slice(0,32)+"…" : text);
      b.appendChild(tt);
      const tspan = el("span","t","");
      b.appendChild(tspan);
      b.addEventListener("click", ()=>{
        if(!segTimes[i]) return;
        audio.currentTime = segTimes[i].start;
        audio.play().catch(()=>{});
        // scroll the active segment into view
        if(segEls[i]){
          setTimeout(()=>segEls[i].scrollIntoView({behavior:"smooth", block:"center"}), 80);
        }
      });
      chWrap.appendChild(b);
      chButtons.push({segIdx: i, btn: b, timeEl: tspan});
    });
    root.appendChild(chWrap);
  }

  // Transcript — support kind classes (header, rule, key, tip, warn, fact, win)
  // and inline **word** → highlighted span.
  const tr = el("div","transcript");
  const segEls = segs.map(s => {
    const lang = s.en ? "en" : "mt";
    const kind = s.kind ? " "+s.kind : "";
    const e = el("div","seg "+lang+kind);
    e.innerHTML = renderInline(s.en || s.mt);
    tr.appendChild(e);
    return e;
  });
  root.appendChild(tr);

  // Click any segment to seek to its estimated time
  let segTimes = []; // [{start, end}] per segment, set on metadata load

  function recomputeTimes(){
    // Prefer the real per-segment timings from narration_<lid>.timings.json.
    // segs is a filtered view of ov.transcript (segments with spoken text);
    // the timings JSON's `i` field is the index in the original transcript,
    // so we walk ov.transcript in lockstep with the filter to zip them up.
    if(timingsByIdx){
      const next = [];
      let lastEnd = 0;
      ov.transcript.forEach((s, origIdx) => {
        if(!(s && (s.en || s.mt))) return;
        const t = timingsByIdx[origIdx];
        if(t){
          next.push({start: t.start, end: t.end});
          lastEnd = t.end;
        } else {
          // Rare: a segment isn't in the timings JSON. Keep the renderer happy
          // with a zero-width slot at the last known position.
          next.push({start: lastEnd, end: lastEnd});
        }
      });
      segTimes = next;
      return;
    }
    // Fallback: character-proportional estimate (drifts over long narrations
    // but works when timings JSON is missing — e.g. before regen has run).
    const dur = audio.duration;
    if(!dur || !isFinite(dur) || dur<=0) return;
    let t = 0;
    segTimes = segs.map(s=>{
      const len = (s.en||s.mt||"").length + 6;
      const slice = (len / totalChars) * dur;
      const start = t; const end = t + slice;
      t = end;
      return {start, end};
    });
  }

  function applyRealTimingsIfReady(){
    // Called when timings JSON arrives after metadata may already have loaded.
    recomputeTimes();
    chButtons.forEach(c=>{
      if(segTimes[c.segIdx]) c.timeEl.textContent = " · "+fmt(segTimes[c.segIdx].start);
    });
  }

  function fmt(sec){
    if(!isFinite(sec) || sec<0) sec = 0;
    const m = Math.floor(sec/60), s = Math.floor(sec%60);
    return m+":"+(s<10?"0"+s:s);
  }

  audio.addEventListener("loadedmetadata", ()=>{
    recomputeTimes();
    dEl.textContent = fmt(audio.duration);
    subTime.textContent = "Duration "+fmt(audio.duration);
    // Fill in chapter time stamps now that we know durations
    chButtons.forEach(c=>{
      if(segTimes[c.segIdx]) c.timeEl.textContent = " · "+fmt(segTimes[c.segIdx].start);
    });
  });

  function updateChapterActive(idx){
    if(!chButtons.length) return;
    // Find the most recent header at or before idx
    let activeChapter = -1;
    chButtons.forEach((c, ci) => { if(c.segIdx <= idx) activeChapter = ci; });
    chButtons.forEach((c, ci)=>{
      c.btn.classList.toggle("active", ci===activeChapter);
    });
  }

  let lastIdx = -1;
  audio.addEventListener("timeupdate", ()=>{
    // While the user is dragging the scrubber, don't fight them by overwriting it
    if(!isSeeking && audio.duration>0){
      range.value = Math.round((audio.currentTime/audio.duration)*1000);
      tEl.textContent = fmt(audio.currentTime);
    }
    if(!segTimes.length) return;
    const t = audio.currentTime;
    let idx = segTimes.findIndex(r => t >= r.start && t < r.end);
    if(idx === -1 && t >= segTimes[segTimes.length-1].end) idx = segTimes.length-1;
    if(idx !== lastIdx && idx>=0){
      if(lastIdx>=0) segEls[lastIdx].classList.remove("active");
      segEls[idx].classList.add("active");
      for(let i=0;i<idx;i++) segEls[i].classList.add("played");
      // mark later segments as un-played in case the user scrubbed backwards
      for(let i=idx+1;i<segEls.length;i++) segEls[i].classList.remove("played");
      const rect = segEls[idx].getBoundingClientRect();
      if(rect.top < 200 || rect.bottom > window.innerHeight - 80){
        segEls[idx].scrollIntoView({behavior:"smooth", block:"center"});
      }
      updateChapterActive(idx);
      lastIdx = idx;
    }
  });
  // Also update on seeked (when the user drops the scrubber) so the highlight follows immediately
  audio.addEventListener("seeked", ()=>{
    if(!segTimes.length) return;
    const t = audio.currentTime;
    let idx = segTimes.findIndex(r => t >= r.start && t < r.end);
    if(idx === -1) idx = 0;
    if(lastIdx>=0) segEls[lastIdx].classList.remove("active");
    segEls[idx].classList.add("active");
    for(let i=0;i<segEls.length;i++) segEls[i].classList.toggle("played", i<idx);
    updateChapterActive(idx);
    lastIdx = idx;
  });

  // Screen Wake Lock — narrations run 3-5 min and testers were having their
  // iPhone screen dim/sleep mid-play. The Wake Lock API (iOS 16.4+, modern
  // Android) tells the OS to keep the display awake while audio is playing.
  // Released on pause/ended/route-change. Acquired silently — if the API is
  // missing or the request fails, we just keep playing (worst case: phone
  // sleeps as before). Re-acquired on visibilitychange because iOS drops the
  // lock when the tab is backgrounded.
  let wakeLock = null;
  async function acquireWakeLock(){
    try {
      if(!("wakeLock" in navigator)) return;
      if(wakeLock) return;                          // already held
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", ()=>{ wakeLock = null; });
    } catch(e){ /* user gesture missing, perms denied, unsupported — ignore */ }
  }
  function releaseWakeLock(){
    if(wakeLock){
      wakeLock.release().catch(()=>{});
      wakeLock = null;
    }
  }
  // If the tab is backgrounded and then refocused while the audio is still
  // playing, iOS revokes the lock — re-acquire so the screen stays awake.
  const onVisibility = () => {
    if(document.visibilityState === "visible" && !audio.paused && !audio.ended){
      acquireWakeLock();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  // Safety net: drop the lock if the user navigates away from the overview
  // (the audio object lives on in JS but we stop owning its UI).
  const onHashChange = () => releaseWakeLock();
  window.addEventListener("hashchange", onHashChange, { once: true });

  audio.addEventListener("play", ()=>{
    playB.textContent = "❚❚";
    acquireWakeLock();
  });
  audio.addEventListener("pause", ()=>{
    playB.textContent = "▶";
    releaseWakeLock();
  });
  audio.addEventListener("ended", ()=>{
    playB.textContent = "▶";
    releaseWakeLock();
    setSectionProgress(lid, "_overview", 100);
    addXp(15);
    // Wire Next to actually return to the lesson home — the empty callback
    // here used to just dismiss the toast, leaving the user stranded.
    showFeedback(true,"Done!", "Overview finished. +15 XP", ()=>go("/lesson/"+lid));
  });

  playB.addEventListener("click", ()=>{
    if(audio.paused) audio.play().catch(e=>console.warn(e));
    else audio.pause();
  });
  back15.addEventListener("click", ()=>{ audio.currentTime = Math.max(0, audio.currentTime - 15); });
  fwd15.addEventListener("click", ()=>{ audio.currentTime = Math.min(audio.duration||0, audio.currentTime + 15); });

  segEls.forEach((e, i)=>{
    e.addEventListener("click", ()=>{
      if(!segTimes[i]) return;
      audio.currentTime = segTimes[i].start;
      audio.play().catch(()=>{});
    });
  });

  // Pause this player and free it when leaving the page
  window.addEventListener("hashchange", function once(){
    audio.pause();
    audio.src = "";
    window.removeEventListener("hashchange", once);
  });
}

// ── Generic section auto-registration ─────────
// The original app hardcodes a flow + renderers + step-counts per section id
// (SECTION_FLOWS / STEP_RENDERERS / STEP_COUNTS). That breaks for NEW section
// ids — both in the reorg and, crucially, for OTA-delivered content that ships
// after the app is built. This makes any unknown section "just work" by deriving
// its flow from its DATA SHAPE and reusing the existing generic renderers.
//
// Detection (a section can contribute several steps, in this order):
//   dialogue[]            → "dialogue" (tap-to-hear) + "listen" (listen & pick)
//   passage{lines}        → "passage"  (reuses alphabet:passage)
//   letters[]             → "letter"   (reuses alphabet:letter) + "match"
//   groups[]              → "list"     (reuses vocabulary:list)
//   rules[]               → "rules"    (reuses renderGrammarRulesStep)
//   vocab[] / items[]     → "flash"    (reuses weekend:flash, reading either field)
// For a section with a HARDCODED flow, drop steps whose backing data is absent
// (reorg may have stripped a field, e.g. dialogue). Maps each step name to the
// section field it requires; if that field is missing/empty, the step is removed
// from the flow so the learner never lands on a renderer that throws.
const STEP_DATA_REQUIRES = {
  listen: "dialogue", build: "dialogue", dialogue: "dialogue",
  passage: "passage", letter: "letters", match: "letters",
  ordinals: "ordinals", plurals: "plurals", winds: "winds",
  regions: "regions", hours: "hours", patterns: "patterns",
  // exercise steps (ex3/ex4/…/ex8) require an `exercises` array; drop them if a
  // section reuses a hardcoded flow id but carries no exercises (id collision safety).
  ex1:"exercises", ex2:"exercises", ex3:"exercises", ex4:"exercises", ex5:"exercises",
  ex6:"exercises", ex7:"exercises", ex8:"exercises", ex9:"exercises",
};
function pruneDeadSteps(sec){
  const flow = SECTION_FLOWS[sec.id];
  if(!Array.isArray(flow)) return;
  const kept = flow.filter(step => {
    const need = STEP_DATA_REQUIRES[step];
    if(!need) return true;                       // step has no data dependency we track
    const v = sec[need];
    return Array.isArray(v) ? v.length > 0 : !!v;
  });
  if(kept.length !== flow.length){
    SECTION_FLOWS[sec.id] = kept.length ? kept : ["flash"]; // never leave it empty
  }
}

// ── Data-driven graded exercises (keystone extension) ────────────────────────
// Lets ANY section — known-id, new-id, or OTA-delivered — carry graded exercises
// as PURE DATA. A section gains `exercises: [{id, type, ...}]`; each type-tagged
// exercise is auto-wired to its existing maker and APPENDED to the section's flow
// (after the presentation steps), so "practice follows presentation" within a
// section. Gated on a `type` field, so legacy exercises (grammar/pronouns/… — wired
// via hardcoded SECTION_FLOWS, no `type`) are NEVER touched. Idempotent.
//   type "mc"      → makeMcStep         · ex.items[{word,answer,en}], ex.choices, ex.opts
//   type "bucket"  → makeBucketSortStep · ex.items[{word,answer}], ex.choices, ex.batch
//   type "article" → makeArticleBuildStep · ex.items[{word,answer,en}], ex.choices
//   type "match"   → makeMatchStep      · ex.items[…], ex.leftField/rightField, ex.title
//   type "build"   → makeBuildStep      · ex.items[{mt,en}]
//   type "listen"  → makeListenStep     · ex.items[{mt,en}]
// match/build/listen makers read a SECTION field (not the exercises array), so we
// expose ex.items under a derived field name; renderer+count wiring is idempotent.
function wireDataExercise(sec, ex){
  const fid = sec.id + ":" + ex.id;
  if(STEP_RENDERERS[fid]) return;          // already wired (global) — idempotent
  const itemsOf = s => ((s.exercises || []).find(e => e.id === ex.id) || {}).items || [];
  switch(ex.type){
    case "mc":
      STEP_RENDERERS[fid] = makeMcStep(ex.id, ex.opts || {});
      STEP_COUNTS[fid] = s => Math.min(ex.max || 10, itemsOf(s).length) || 1;
      break;
    case "bucket": {
      const batch = ex.batch || 6;
      STEP_RENDERERS[fid] = makeBucketSortStep(ex.id, {batch, ...(ex.opts||{})});
      STEP_COUNTS[fid] = s => Math.ceil(itemsOf(s).length / batch) || 1;
      break;
    }
    case "article":
      STEP_RENDERERS[fid] = makeArticleBuildStep(ex.id);
      STEP_COUNTS[fid] = s => itemsOf(s).length || 1;
      break;
    case "match":
      STEP_RENDERERS[fid] = makeMatchStep("_mx_" + ex.id, ex.leftField || "mt", ex.rightField || "en", ex.title || "Match the pairs");
      STEP_COUNTS[fid] = () => 1;
      break;
    case "build":
      STEP_RENDERERS[fid] = makeBuildStep("_bd_" + ex.id);
      STEP_COUNTS[fid] = s => Math.min(ex.max || 8, itemsOf(s).length) || 1;
      break;
    case "listen":
      STEP_RENDERERS[fid] = makeListenStep("_ls_" + ex.id);
      STEP_COUNTS[fid] = s => Math.min(ex.max || 6, itemsOf(s).length) || 1;
      break;
    default: return;                       // unknown type → not ours; leave alone
  }
}
function appendDataExercises(sec){
  if(!Array.isArray(sec.exercises) || !sec.exercises.length) return;
  const flow = SECTION_FLOWS[sec.id];
  if(!Array.isArray(flow)) return;
  sec.exercises.forEach(ex => {
    if(!ex || !ex.id || !ex.type) return;  // only OUR type-tagged exercises
    // Field-injection for the field-based makers — done on EVERY call so a freshly
    // loaded lesson object (e.g. after a language switch) is always populated.
    if(ex.type === "match")  sec["_mx_" + ex.id] = ex.items;
    if(ex.type === "build")  sec["_bd_" + ex.id] = ex.items;
    if(ex.type === "listen") sec["_ls_" + ex.id] = ex.items;
    wireDataExercise(sec, ex);
    if(STEP_RENDERERS[sec.id + ":" + ex.id] && !flow.includes(ex.id)) flow.push(ex.id);
  });
}

// Registration is idempotent and never overrides an already-defined id.
function ensureSectionRegistered(sec){
  if(!sec || !sec.id) return;
  if(SECTION_FLOWS[sec.id]){
    // KNOWN (hardcoded) flow — but the section's DATA may have been trimmed in the
    // reorg (e.g. a reused 'phrases' section kept its vocab but lost its dialogue).
    // Prune any flow step whose required data is now missing, so we never advance
    // into a renderer that reads an absent field and dead-ends on "could not load".
    pruneDeadSteps(sec);
    appendDataExercises(sec);   // append any data-driven graded exercises
    return;
  }

  const id = sec.id;
  const flow = [];

  // Helper: a flash renderer that reads whichever list field exists.
  const flashField = Array.isArray(sec.vocab) ? "vocab"
                   : Array.isArray(sec.items) ? "items" : null;

  if(Array.isArray(sec.dialogue) && sec.dialogue.length){
    flow.push("dialogue");
    STEP_RENDERERS[id+":dialogue"] = STEP_RENDERERS["weekend:dialogue"];
    STEP_COUNTS[id+":dialogue"] = () => 1;
    if(sec.dialogue.length >= 2){
      flow.push("listen");
      STEP_RENDERERS[id+":listen"] = makeListenStep("dialogue");
      STEP_COUNTS[id+":listen"] = s => Math.min(6, s.dialogue.length);
    }
  }
  if(sec.passage && Array.isArray(sec.passage.lines)){
    flow.push("passage");
    STEP_RENDERERS[id+":passage"] = STEP_RENDERERS["alphabet:passage"];
    STEP_COUNTS[id+":passage"] = () => 1;
  }
  if(Array.isArray(sec.letters) && sec.letters.length && typeof sec.letters[0] === "object"){
    flow.push("letter");
    STEP_RENDERERS[id+":letter"] = STEP_RENDERERS["alphabet:letter"];
    STEP_COUNTS[id+":letter"] = s => s.letters.length;
    flow.push("match");
    STEP_RENDERERS[id+":match"] = STEP_RENDERERS["alphabet:match"];
    STEP_COUNTS[id+":match"] = () => 6;
  }
  if(flashField){
    flow.push("flash");
    // weekend:flash reads sec.vocab; for sections that use `items` we need a
    // tiny adapter that flashes from `items` instead.
    if(flashField === "vocab"){
      STEP_RENDERERS[id+":flash"] = STEP_RENDERERS["weekend:flash"];
    } else {
      STEP_RENDERERS[id+":flash"] = (root, sec2, i, onNext) => {
        if(i===0 && sec2.intro){
          const head = el("div","card");
          head.appendChild(el("p","muted", sec2.intro));
          root.appendChild(head);
        }
        const item = sec2.items[i];
        root.appendChild(renderFlash(item.mt, item.en, `Word ${i+1} of ${sec2.items.length}`));
        setTimeout(()=>play(item.mt), 250);
        root.appendChild(nextBtn("Next →", onNext));
      };
    }
    STEP_COUNTS[id+":flash"] = s => (s[flashField]||[]).length;
  }
  if(Array.isArray(sec.groups) && sec.groups.length){
    flow.push("list");
    STEP_RENDERERS[id+":list"] = STEP_RENDERERS["vocabulary:list"];
    STEP_COUNTS[id+":list"] = () => 1;
  }
  if(Array.isArray(sec.rules) && sec.rules.length){
    flow.push("rules");
    STEP_RENDERERS[id+":rules"] = renderGrammarRulesStep;
    STEP_COUNTS[id+":rules"] = s => s.rules.length;
  }

  // Fallback: a section with none of the above but with an `intro`/`facts` —
  // show a simple read-only card so it never dead-ends on "not available".
  if(!flow.length){
    flow.push("info");
    STEP_RENDERERS[id+":info"] = (root, sec2, i, onNext) => {
      const card = el("div","card");
      if(sec2.subtitle) card.appendChild(el("h3","",sec2.subtitle));
      if(sec2.intro) card.appendChild(el("p","",sec2.intro));
      (sec2.facts||[]).forEach(f => card.appendChild(el("p","",f)));
      root.appendChild(card);
      root.appendChild(nextBtn("Done →", onNext));
    };
    STEP_COUNTS[id+":info"] = () => 1;
  }

  SECTION_FLOWS[id] = flow;
  appendDataExercises(sec);   // append any data-driven graded exercises after presentation
}

// ── Section dispatcher ────────────────────────
function renderSection(lid, sid, step, idx){
  const lesson = currentLesson(lid);
  const sec = lesson.sections.find(s=>s.id===sid);
  if(!sec) return go("/lesson/"+lid);

  ensureSectionRegistered(sec);

  const { nextSid } = findNext(lid, sid);   // next SECTION → button now lives in the topbar
  const root = $app();
  root.innerHTML = "";
  root.appendChild(topbar(sec.title, "/lesson/"+lid, nextSid ? ("/lesson/"+lid+"/section/"+nextSid) : null));

  const flow = SECTION_FLOWS[sid] || [];
  if((step==="intro" || !step) && flow.length){
    step = flow[0]; idx = 0;
  }
  const stepIdx = flow.indexOf(step);
  // Snapshot the XP baseline the moment the user enters a section's first
  // step. The done screen later subtracts this from State.xp to show the
  // real per-section gain. Re-entry (e.g. revisiting a finished section)
  // overwrites the baseline so the next done screen reflects the new run.
  if(stepIdx === 0 && idx === 0){
    State.sectionStartXp[lid+":"+sid] = State.xp;
  }
  if(flow.length){
    root.appendChild(progressBar(Math.round((stepIdx/flow.length)*100)));
  }

  const renderer = STEP_RENDERERS[sid+":"+step];
  if(!renderer){
    root.appendChild(el("p","muted","(This step isn't available yet.)"));
    const back = el("button","btn","← Back");
    back.addEventListener("click", ()=>go("/lesson/"+lid));
    root.appendChild(back);
    return;
  }
  const _beforeRenderer = root.childElementCount;
  renderer(root, sec, idx, ()=>nextStep(lid, sid, step, idx, sec, flow));
  // Guarantee the section's intro shows on its FIRST screen, whatever the
  // renderer does. Skip if the renderer already printed it (no duplicates).
  if(stepIdx === 0 && idx === 0 && sec.intro && !root.textContent.includes(sec.intro)){
    const introCard = el("div","card");
    introCard.appendChild(el("p","muted", sec.intro));
    root.insertBefore(introCard, root.children[_beforeRenderer] || null);
  }

  // Bottom navigation row, four affordances in order:
  //   ← Previous       step back one PORTION within this section (prev item, or
  //                    last item of the previous exercise). Hidden on the very
  //                    first portion of the section.
  //   Next →           step forward one PORTION (next item, or first item of the
  //                    next exercise) — the symmetric partner to Previous.
  //   Next exercise →  skip the rest of this exercise's items and jump to the
  //                    first portion of the NEXT exercise type in the section.
  //   Next section →   leave this section for the next one in the lesson.
  const t = I18N[State.lang] || I18N.en;
  const prevHash   = prevStepHash(lid, sid, step, idx, sec, flow);  // back one item
  const nextExHash = nextExerciseHash(lid, sid, step, flow);        // skip to next exercise
  // Two-row nav under the card:
  //   row 1: ← Previous | Next →   — move through the items of this exercise
  //   row 2: Skip →                — jump to the next exercise (hidden on the last)
  // Next section lives in the topbar (by Home). "Next" advances+completes via
  // nextStep so progress/XP stay correct. In-card Next/Skip buttons are gone
  // (nextBtn/skipBtn are no-ops now), so this is the single control surface.
  const nav = el("div","prev-wrap nav-col");
  const row1 = el("div","nav-row");
  if(prevHash){
    const back = el("button","btn-prev", t.previous);
    back.addEventListener("click", ()=>go(prevHash));
    row1.appendChild(back);
  }
  const nx = el("button","btn-prev btn-next", (t.next || "Next") + " →");
  nx.addEventListener("click", ()=>nextStep(lid, sid, step, idx, sec, flow));
  row1.appendChild(nx);
  nav.appendChild(row1);
  if(nextExHash){
    const sk = el("button","btn-prev btn-skip", (t.skip || "Skip") + " →");
    sk.addEventListener("click", ()=>go(nextExHash));
    nav.appendChild(sk);
  }
  root.appendChild(nav);
}

// Jump to the next EXERCISE TYPE in this section: always the first index of the
// next step in the flow, skipping any remaining items of the current exercise.
// Returns null on the last step (callers fall back to "Next section"). This is
// what the bottom-row "Next exercise →" button uses — distinct from the in-card
// "Next" which walks item-by-item within the same exercise.
function nextExerciseHash(lid, sid, step, flow){
  const i = flow.indexOf(step);
  if(i>=0 && i+1 < flow.length){
    return "/lesson/"+lid+"/section/"+sid+"/"+flow[i+1]+"/0";
  }
  return null;
}

// Forward within the SAME section: next index in this step, else first index of
// the next step. Returns null at the last step+idx (use "Next section" there).
function nextStepHash(lid, sid, step, idx, sec, flow){
  const count = (STEP_COUNTS[sid+":"+step] ? STEP_COUNTS[sid+":"+step](sec) : 1);
  if(idx+1 < count){
    return "/lesson/"+lid+"/section/"+sid+"/"+step+"/"+(idx+1);
  }
  const i = flow.indexOf(step);
  if(i>=0 && i+1 < flow.length){
    return "/lesson/"+lid+"/section/"+sid+"/"+flow[i+1]+"/0";
  }
  return null;
}

function nextStep(lid, sid, step, idx, sec, flow){
  const stepCount = (STEP_COUNTS[sid+":"+step] ? STEP_COUNTS[sid+":"+step](sec) : 1);
  if(idx+1 < stepCount){
    go("/lesson/"+lid+"/section/"+sid+"/"+step+"/"+(idx+1));
    return;
  }
  // update progress
  if(flow.length){
    const pct = Math.round(((flow.indexOf(step)+1)/flow.length)*100);
    setSectionProgress(lid, sid, pct);
  }
  const i = flow.indexOf(step);
  if(i+1 < flow.length){
    go("/lesson/"+lid+"/section/"+sid+"/"+flow[i+1]+"/0");
  } else {
    setSectionProgress(lid, sid, 100);
    addXp(20);
    const baseline = State.sectionStartXp[lid+":"+sid];
    const earned = (typeof baseline === "number") ? (State.xp - baseline) : 20;
    showSectionDone(lid, sid, earned);
  }
}

// Walk backwards through the flow: prior index in the same step, or the last
// index of the previous step. If we're at the very first step+idx, return null
// so callers can hide the button (or fall back to "back to lesson").
function prevStepHash(lid, sid, step, idx, sec, flow){
  if(idx > 0){
    return "/lesson/"+lid+"/section/"+sid+"/"+step+"/"+(idx-1);
  }
  const i = flow.indexOf(step);
  if(i > 0){
    const prevStepName = flow[i-1];
    const prevSec = sec; // same section
    const prevCount = (STEP_COUNTS[sid+":"+prevStepName] ? STEP_COUNTS[sid+":"+prevStepName](prevSec) : 1);
    return "/lesson/"+lid+"/section/"+sid+"/"+prevStepName+"/"+Math.max(0, prevCount-1);
  }
  return null;
}

// Find the next section (within the lesson) and the next lesson (in the
// index, respecting dev visibility). Returns {nextSid, nextLid} — either may
// be null if there's nothing after the current spot. `sid` may be undefined
// for legacy callers; in that case we skip the next-section calculation.
function findNext(lid, sid){
  const lesson = currentLesson(lid);
  let nextSid = null;
  if(lesson && sid && Array.isArray(lesson.sections)){
    const i = lesson.sections.findIndex(s => s.id === sid);
    if(i >= 0 && i + 1 < lesson.sections.length){
      nextSid = lesson.sections[i + 1].id;
    }
  }
  // Visible-lesson order matches the home screen — module-grouped (extras
  // first, then "The Course"), with dev-flagged lessons hidden for everyone
  // except dev-mode users. Find the current lesson in that order and pick
  // the next one.
  const visible = (State.index && State.index.lessons || []).filter(isLessonVisible);
  // Match home-render order: group by module, keep within-module order.
  const byModule = {};
  visible.forEach(L => {
    const m = L.module || "_";
    (byModule[m] = byModule[m] || []).push(L);
  });
  const flat = [];
  // Modules in encounter order from the index — same as the home screen iterates them.
  const seenModules = new Set();
  visible.forEach(L => {
    const m = L.module || "_";
    if(seenModules.has(m)) return;
    seenModules.add(m);
    (byModule[m] || []).forEach(x => flat.push(x));
  });
  const li = flat.findIndex(L => L.id === lid);
  const nextLid = (li >= 0 && li + 1 < flat.length) ? flat[li + 1].id : null;
  return { nextSid, nextLid };
}

function showSectionDone(lid, sid, earnedXp){
  // Backwards-compatible: `sid` was added when we introduced the
  // next-section/next-lesson buttons; legacy callers pass earnedXp as the
  // second arg, so detect that shape and swap.
  if(typeof sid === "number" || (typeof sid === "undefined" && typeof earnedXp === "undefined")){
    earnedXp = sid; sid = null;
  }
  const t = I18N[State.lang] || I18N.en;
  const root = $app();
  root.innerHTML = "";
  root.appendChild(topbar(t.done, "/lesson/"+lid));
  const { nextSid, nextLid } = findNext(lid, sid);
  const lessonDone = !nextSid;       // last section of the lesson?
  const ds = el("div","done-screen");
  ds.appendChild(el("div","emoji","🎉"));
  ds.appendChild(el("h1","", lessonDone ? t.lessonComplete : t.sectionComplete));
  ds.appendChild(el("p","",t.brilliantWork));
  const stats = el("div","stats");
  // Fall back to +20 (the section bonus) if the caller didn't pass a baseline,
  // so legacy callers / external nav still produce a sensible display.
  const earnedLabel = "+" + (typeof earnedXp === "number" ? earnedXp : 20);
  const s1 = el("div","stat"); s1.appendChild(el("strong","",earnedLabel)); s1.appendChild(el("span","",t.xpEarned));
  const s2 = el("div","stat"); s2.appendChild(el("strong","",String(State.xp))); s2.appendChild(el("span","",t.totalXp));
  stats.appendChild(s1); stats.appendChild(s2);
  ds.appendChild(stats);
  // Primary CTA — keep the user moving. If there's a next section, that's
  // the obvious next step; if not, the next lesson; if neither, just "Back".
  if(nextSid){
    const nx = el("button","btn",t.nextSection);
    nx.addEventListener("click", ()=>go("/lesson/"+lid+"/section/"+nextSid));
    ds.appendChild(nx);
  } else if(nextLid){
    const nx = el("button","btn",t.nextLesson);
    nx.addEventListener("click", ()=>go("/lesson/"+nextLid));
    ds.appendChild(nx);
  }
  // Demote "Back to lesson" to secondary when there's a more interesting
  // next-step button above it. Keeps the screen from looking like two
  // equally-weighted CTAs competing.
  const back = el("button","btn"+((nextSid || nextLid) ? " secondary" : ""),t.backToLesson);
  back.addEventListener("click", ()=>go("/lesson/"+lid));
  ds.appendChild(back);
  root.appendChild(ds);
}

/* ============================================================
   Section flows + step counts
   ============================================================ */
const SECTION_FLOWS = {
  // Lesson 1
  phrases:        ["flash","listen","build"],
  alphabet:       ["letter","match","passage"],
  grammar:        ["rules","ex3","ex4","ex5"],
  days:           ["flash","match","scramble"],
  // Lesson 2
  serquni:        ["flash","dialogue","listen"],
  colours:        ["card"],
  adjectives:     ["pair"],
  numbers:        ["flash","ordinals"],
  months:         ["flash","match"],
  // Lesson 3
  pronouns:       ["flash","ex1"],
  demonstratives: ["rules","ex2","ex3"],
  syllables:      ["card"],
  // Lesson 4
  family:         ["flash","plurals"],
  hobbies:        ["flash","dialogue"],
  possessive:     ["examples","pronouns"],
  attached:       ["examples","ex6","ex7"],
  // Lesson 5
  fruit:          ["card"],
  vegetables:     ["card"],
  imperative:     ["card","ex8"],
  present:        ["rules","ex9"],
  // Lesson 6
  table:          ["card"],
  food:           ["flash"],
  questions:      ["flash","passage"],
  ghpresent:      ["rules","ex5","ex6"],
  // Lesson 7
  transport:      ["card"],
  weekend:        ["flash","dialogue"],
  seasons:        ["card"],
  particles:      ["flash","examples","ex7"],
  // Lesson 8
  datetime:       ["flash"],
  partarticle:    ["flash","ex3"],
  map:            ["facts","vocab","regions"],
  places:         ["flash"],
  // Lesson 9
  directions:     ["flash","dialogue","winds"],
  timeexp:        ["flash"],
  time:           ["hours","patterns","ex8"],
  // Extras
  polite:         ["flash","dialogue"],
  cafe:           ["flash","dialogue"],
  work:           ["flash","dialogue"],
  shopping:       ["flash","dialogue"],
  // Study aids — Vocabulary (shared across lessons) + per-lesson Grammar
  vocabulary:     ["list"],
  grammarwelcome: ["rules"],
  grammar2:       ["rules"],
  grammar3:       ["rules"],
  grammar4:       ["rules"],
  grammar5:       ["rules"],
  grammar6:       ["rules"],
  grammar7:       ["rules"],
  grammar8:       ["rules"],
  grammar9:       ["rules"],
  // Module 4 (lessons 10-12) — dev-only, staged ahead of release
  grammar10:      ["rules"],
  grammar11:      ["rules"],
  grammar12:      ["rules"],
};

const STEP_COUNTS = {
  // Lesson 1
  "phrases:flash": s => s.vocab.length,
  "phrases:listen": s => Math.min(8, s.dialogue.length),
  "phrases:build": s => Math.min(5, s.dialogue.length),
  "alphabet:letter": s => s.letters.length,
  "alphabet:match": s => 6,
  "alphabet:passage": s => 1,
  "grammar:rules": s => s.rules.length,
  "grammar:ex3": s => Math.ceil(s.exercises.find(e=>e.id==="ex3").items.length/6), // bucket-sort rounds of 6
  "grammar:ex4": s => Math.min(8, s.exercises.find(e=>e.id==="ex4").items.length), // tap-to-build, 1 per screen
  "grammar:ex5": s => Math.min(8, s.exercises.find(e=>e.id==="ex5").items.length),
  "days:flash": s => s.items.length,
  "days:match": s => Math.min(6, s.items.length),   // listen & pick rounds
  "days:scramble": s => Math.min(5, s.items.length),
  // Lesson 2
  "serquni:flash": s => s.vocab.length,
  "serquni:dialogue": s => 1,
  "serquni:listen": s => Math.min(6, s.dialogue.length),
  "colours:card": s => s.items.length,
  "adjectives:pair": s => s.pairs.length,
  "numbers:flash": s => s.items.length,
  "numbers:ordinals": s => s.ordinals.length,
  "months:flash": s => s.items.length,
  "months:match": s => Math.min(6, s.items.length),   // listen & pick rounds
  // Lesson 3
  "pronouns:flash": s => s.items.length,
  "pronouns:ex1": s => Math.min(8, s.exercises[0].items.length),
  "demonstratives:rules": s => s.rules.length,
  "demonstratives:ex2": s => Math.ceil(s.exercises.find(e=>e.id==="ex2").items.length/6), // bucket-sort rounds
  "demonstratives:ex3": s => Math.ceil(s.exercises.find(e=>e.id==="ex3").items.length/6),
  "syllables:card": s => Math.min(12, s.items.length),
  // Lesson 4
  "family:flash": s => s.vocab.length,
  "family:plurals": s => Math.min(8, s.plurals.length),
  "hobbies:flash": s => s.vocab.length,
  "hobbies:dialogue": s => 1,
  "possessive:examples": s => 1,
  "possessive:pronouns": () => 1,
  "attached:examples": s => 1,
  "attached:ex6": s => s.exercises.find(e=>e.id==="ex6").items.length,
  "attached:ex7": s => s.exercises.find(e=>e.id==="ex7").items.length,
  // Lesson 5
  "fruit:card": s => s.items.length,
  "vegetables:card": s => s.items.length,
  "imperative:card": s => s.items.length,
  "imperative:ex8": s => s.exercises[0].items.length,
  "present:rules": s => s.rules.length,
  "present:ex9": s => s.exercises[0].items.length,
  // Lesson 6
  "table:card": s => s.items.length,
  "food:flash": s => s.vocab.length,
  "questions:flash": () => 1,
  "questions:passage": s => 1,
  "ghpresent:rules": s => s.rules.length,
  "ghpresent:ex5": s => s.exercises.find(e=>e.id==="ex5").items.length,
  "ghpresent:ex6": s => s.exercises.find(e=>e.id==="ex6").items.length,
  // Lesson 7
  "transport:card": s => s.items.length,
  "weekend:flash": s => s.vocab.length,
  "weekend:dialogue": s => 1,
  "seasons:card": s => s.items.length,
  "particles:flash": s => s.items.length,
  "particles:examples": s => 1,
  "particles:ex7": s => s.exercises[0].items.length,
  // Lesson 8
  "datetime:flash": s => s.vocab.length,
  "partarticle:flash": s => s.items.length,
  "partarticle:ex3": s => s.exercises[0].items.length,
  "map:facts": s => 1,
  "map:vocab": s => s.vocab.length,
  "map:regions": s => s.regions.length,
  "places:flash": s => s.items.length,
  // Lesson 9
  "directions:flash": s => s.vocab.length,
  "directions:dialogue": s => 1,
  "directions:winds": s => s.winds.length,
  "timeexp:flash": s => s.vocab.length,
  "time:hours": s => s.hours.length,
  "time:patterns": s => s.patterns.length,
  "time:ex8": s => s.exercises[0].items.length,
  // Extras — all four sections use the same vocab+dialogue pattern as 'weekend'
  "polite:flash": s => s.vocab.length, "polite:dialogue": s => 1,
  "cafe:flash": s => s.vocab.length, "cafe:dialogue": s => 1,
  "work:flash": s => s.vocab.length, "work:dialogue": s => 1,
  "shopping:flash": s => s.vocab.length, "shopping:dialogue": s => 1,
  // Study aids
  "vocabulary:list": s => 1,
  "grammarwelcome:rules": s => s.rules.length,
  "grammar2:rules": s => s.rules.length,
  "grammar3:rules": s => s.rules.length,
  "grammar4:rules": s => s.rules.length,
  "grammar5:rules": s => s.rules.length,
  "grammar6:rules": s => s.rules.length,
  "grammar7:rules": s => s.rules.length,
  "grammar8:rules": s => s.rules.length,
  "grammar9:rules": s => s.rules.length,
  "grammar10:rules": s => s.rules.length,
  "grammar11:rules": s => s.rules.length,
  "grammar12:rules": s => s.rules.length,
};

/* ============================================================
   Generic step renderers
   ============================================================ */

// vocab/items flashcard (mt + en visible)
function renderFlash(mt, en, hint, secondary){
  const card = el("div","flash");
  if(hint) card.appendChild(el("div","hint", hint));
  card.appendChild(el("div","mtword", mt));
  if(secondary) card.appendChild(el("div","alt", secondary));
  card.appendChild(el("div","enword", en));
  card.appendChild(audioBtn(mt));
  card.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(mt); });
  return card;
}

// Localized labels for the navigation buttons rendered by nextBtn().
// Source-of-truth labels are still authored in English at every call site;
// nextBtn translates to State.lang at render time.
const NAV_I18N = {
  es: {
    "Next →": "Siguiente →",
    "Next season →": "Siguiente estación →",
    "Next colour →": "Siguiente color →",
    "Next pair →": "Siguiente par →",
    "Next rule →": "Siguiente regla →",
    "Next letter →": "Siguiente letra →",
    "Next region →": "Siguiente región →",
    "Done →": "Listo →",
    "Continue →": "Continuar →",
    "Try the exercises →": "Prueba los ejercicios →",
    "Try the exercise →": "Prueba el ejercicio →",
    "Next": "Siguiente",
  },
};
// In-card forward + skip buttons were replaced by the persistent two-row nav
// (← Previous | Next → , then Skip →) that renderSection draws under every card,
// with Next section in the topbar. These helpers now render nothing so the
// controls don't double up. Kept as no-ops because ~40 renderers still call them.
function nextBtn(label, onNext){ return document.createComment("nav"); }
function skipBtn(onNext){ return document.createComment("nav"); }

// Listen-and-pick with given items array (each having mt/en).
// On a wrong answer the learner gets a "Try again" option (re-renders this same
// step with a fresh shuffle) instead of being pushed straight on.
function makeListenStep(field){
  const render = (root, sec, idx, onNext) => {
    const items = sec[field];
    const correct = items[idx % items.length];
    const distractors = items.filter(x=>x!==correct).sort(()=>Math.random()-.5).slice(0,3);
    const opts = [correct, ...distractors].sort(()=>Math.random()-.5);
    const card = el("div","card");
    card.appendChild(el("h3","","Listen and pick the meaning"));
    const row = el("div","row");
    row.appendChild(audioBtn(correct.mt, {size:"lg"}));
    row.appendChild(el("div","grow muted","Tap the speaker, then choose."));
    card.appendChild(row);
    root.appendChild(card);
    const retry = () => { root.innerHTML = ""; render(root, sec, idx, onNext); };
    const choices = el("div","choices col");
    opts.forEach(o=>{
      const b = el("button","choice", o.en);
      b.addEventListener("click", ()=>{
        if(o===correct){
          b.classList.add("right"); addXp(5);
          showFeedback(true,"Sewwa! Correct.", correct.mt+" → "+correct.en, onNext);
        } else {
          b.classList.add("wrong");
          // Wrong → offer a retry. showFeedback's button re-renders this step.
          showFeedback(false,"Not quite — try again.", "Tap the speaker again and listen carefully.", retry, {label:"Try again ↺"});
        }
        [...choices.children].forEach(c=>{ if(c!==b) c.classList.add("dim"); c.disabled=true; });
      });
      choices.appendChild(b);
    });
    card.appendChild(choices);
    root.appendChild(skipBtn(onNext));
    setTimeout(()=>play(correct.mt), 300);
  };
  return render;
}

// Tap-to-build sentence
function makeBuildStep(field){
  return (root, sec, idx, onNext) => {
    const items = sec[field];
    const item = items[idx % items.length];
    const tokens = item.mt.split(/\s+/);
    let shuffled = [...tokens].sort(()=>Math.random()-.5);
    if(shuffled.join(" ") === tokens.join(" ")) shuffled.reverse();
    const card = el("div","card");
    card.appendChild(el("h3","","Build the Maltese sentence"));
    card.appendChild(el("p","mtline", item.en));
    const built = el("div","built"); card.appendChild(built);
    const pool = el("div","pool"); card.appendChild(pool);
    root.appendChild(card);
    const placed = [];
    shuffled.forEach((t)=>{
      const tile = el("button","tile",t);
      tile.addEventListener("click", ()=>{
        if(tile.classList.contains("used")) return;
        tile.classList.add("used");
        const pt = el("button","tile",t);
        const entry = {tile, pt, t};
        placed.push(entry);
        pt.addEventListener("click", ()=>{
          const k = placed.indexOf(entry);
          if(k>=0){ entry.tile.classList.remove("used"); placed.splice(k,1); pt.remove(); }
        });
        built.appendChild(pt);
      });
      pool.appendChild(tile);
    });
    const check = el("button","btn","Check");
    check.addEventListener("click", ()=>{
      const got = placed.map(p=>p.t).join(" ").trim();
      const want = tokens.join(" ").trim();
      if(got===want){
        addXp(10); play(item.mt);
        showFeedback(true,"Mela! Spot on.", item.mt+" — "+item.en, onNext);
      } else {
        showFeedback(false,"Not quite.","Correct: "+item.mt, onNext);
      }
    });
    root.appendChild(check);
    root.appendChild(skipBtn(onNext));
  };
}

// Slower playback for MC grammar audio. The default -8% SSML rate still feels
// rushed when the clip is a 1–2 syllable article+word combo and the learner is
// trying to identify the article. ~14% slower at runtime gives them time to parse.
const MC_RATE = 0.86;

// Multiple-choice exercise (looking up exercises[].id)
// Bucket-sort: tap each word into the correct article bucket. Used for the
// il-/l- article exercise — an interaction the paper slides can't do. Shows a few
// words at a time; the whole exercise is one step (idx ignored). `buckets` are the
// article forms; each item has {word, answer}. Audio plays the full form (answer+word).
function makeBucketSortStep(exId, opts){
  opts = opts || {};
  const N = opts.batch || 6;           // words per round
  return (root, sec, idx, onNext) => {
    const ex = sec.exercises.find(e=>e.id===exId);
    const buckets = ex.choices.slice();
    // take a batch (idx-based so revisits vary), wrap around
    const start = (idx*N) % ex.items.length;
    const batch = [];
    for(let i=0;i<Math.min(N, ex.items.length);i++) batch.push(ex.items[(start+i)%ex.items.length]);
    const card = el("div","card");
    card.appendChild(el("h3","", ex.title));
    card.appendChild(el("p","muted", ex.instructions || "First pick the word, then pick the article that should go with it."));
    root.appendChild(card);
    // word chips
    const pool = el("div","pool bucket-pool");
    // bucket columns
    const bwrap = el("div","bucket-row");
    const bucketEls = {};
    buckets.forEach(b=>{
      const col = el("div","bucket");
      col.appendChild(el("div","bucket-label", b));
      const drop = el("div","bucket-drop");
      col.appendChild(drop); bucketEls[b]=drop; bwrap.appendChild(col);
    });
    let selected=null, placed=0;
    // On select, play only the BARE word — playing the full article+word here
    // would give away the answer before the learner picks the article. The full
    // correct form plays after a correct bucket choice (below).
    function select(chip){ if(selected) selected.classList.remove("sel"); selected=chip; chip.classList.add("sel"); play(chip.dataset.word); }
    batch.forEach(it=>{
      const chip = el("button","tile bucket-chip", it.word);
      // Reveal-audio concatenates answer+word ONLY when the answer is an article
      // (ends in "-", e.g. il-/l-/id-) → speaks "il-ktieb". For category buckets
      // (e.g. "Changes"/"Never changes") the answer isn't an article, so speak the
      // bare word instead of a nonsense concatenation.
      // Reveal/audio on a correct drop:
      //  - sayAnswerWord (demonstratives): "din werqa" (answer + space + word)
      //  - article (answer ends in "-"): "il-ktieb"
      //  - else: the bare word (category buckets like Changes/Stays)
      const fullForm = (opts.sayAnswerWord && it.answer) ? (it.answer + " " + it.word)
                     : (it.answer && /-$/.test(it.answer)) ? it.answer + it.word
                     : it.word;
      chip.dataset.answer = it.answer; chip.dataset.word = it.word; chip.dataset.full = fullForm;
      if(opts.sayAnswerWord && it.answer){ chip.dataset.reveal = fullForm; }
      // revealFem: a colour that CHANGES carries its feminine form (it.fem). On a
      // correct drop we voice the feminine and show "aħmar → ħamra".
      if(opts.revealFem && it.fem){ chip.dataset.say = it.fem; chip.dataset.reveal = it.word + " → " + it.fem; }
      chip.addEventListener("click", ()=>{ if(!chip.classList.contains("done")) select(chip); });
      pool.appendChild(chip);
    });
    card.appendChild(pool); card.appendChild(bwrap);
    buckets.forEach(b=>{
      bucketEls[b].parentElement.addEventListener("click", ()=>{
        if(!selected) return;
        const correct = selected.dataset.answer === b;
        if(correct){
          selected.classList.add("done","right"); selected.classList.remove("sel");
          play(selected.dataset.say || selected.dataset.full);   // reveal full/feminine audio
          const moved = el("span","tile mini", selected.dataset.reveal || selected.textContent);
          bucketEls[b].appendChild(moved);
          selected.disabled=true; selected=null; placed++; addXp(3);
          if(placed===batch.length){ showFeedback(true,"Sewwa!","All sorted.", onNext); }
        } else {
          const s=selected; s.classList.add("wrong"); setTimeout(()=>s.classList.remove("wrong","sel"),600); selected=null;
        }
      });
    });
    root.appendChild(skipBtn(onNext));
  };
}

// Article tap-to-build: assemble the full form by tapping the article tile then
// the word (e.g. id- + dar -> id-dar). Different from the slide multiple-choice;
// reinforces the sound-doubling. Each item {word, answer(article)}.
function makeArticleBuildStep(exId){
  return (root, sec, idx, onNext) => {
    const ex = sec.exercises.find(e=>e.id===exId);
    const item = ex.items[idx % ex.items.length];
    const full = item.answer + item.word;
    const card = el("div","card");
    card.appendChild(el("h3","", ex.title));
    card.appendChild(el("p","muted","Tap the article that goes with the word."));
    const prompt = el("div","row");
    prompt.appendChild(el("div","grow mtline", "___ " + item.word));
    if(item.en) prompt.appendChild(el("div","muted", item.en));
    card.appendChild(prompt);
    const built = el("div","built"); card.appendChild(built);
    root.appendChild(card);
    // offer a few article options (correct + distractors from choices)
    const others = ex.choices.filter(c=>c!==item.answer).sort(()=>Math.random()-.5).slice(0,3);
    const opts=[item.answer,...others].sort(()=>Math.random()-.5);
    const pool=el("div","pool");
    let chosenArticle=null;
    opts.forEach(a=>{
      const t=el("button","tile",a);
      t.addEventListener("click", ()=>{
        chosenArticle=a; [...pool.children].forEach(c=>c.classList.remove("sel")); t.classList.add("sel");
        built.innerHTML=""; built.appendChild(el("span","tile",a)); built.appendChild(el("span","tile",item.word));
        // auto-check
        if(a===item.answer){ addXp(5); play(full); showFeedback(true,"Sewwa!", full+(item.en?" — "+item.en:""), onNext); }
        else { t.classList.add("wrong"); showFeedback(false,"Not quite — try again.", "Listen for the doubled sound.", ()=>{ root.innerHTML=""; STEP_RENDERERS[sec.id+":"+exId]&&makeArticleBuildStep(exId)(root,sec,idx,onNext); }, {label:"Try again ↺"}); }
      });
      pool.appendChild(t);
    });
    card.appendChild(pool);
    root.appendChild(skipBtn(onNext));
  };
}

function makeMcStep(exId, opts){
  opts = opts || {};
  const wordField = opts.wordField || "word";          // field that holds the displayed Maltese
  const subField = opts.subField || "en";              // english/secondary
  const audioCombine = opts.audioCombine || null;      // function(item)->string to play
  return (root, sec, idx, onNext) => {
    const ex = sec.exercises.find(e=>e.id===exId);
    const item = ex.items[idx % ex.items.length];
    const card = el("div","card");
    card.appendChild(el("h3","",ex.title));
    if(ex.instructions) card.appendChild(el("p","muted",ex.instructions));
    const wordRow = el("div","row");
    const audioStr = audioCombine ? audioCombine(item) : item[wordField];
    // Full correct phrase to voice AFTER a correct answer (e.g. "ktieb aħmar"),
    // when opts.audioAnswer is set. Prefer an explicit item.mt; else assemble
    // respecting blankAfter (noun + answer) vs default (answer + noun). The top
    // prompt button still plays only audioStr, so the answer isn't given away.
    const answerAudio = item.mt || (opts.blankAfter ? (item[wordField] + " " + item.answer)
                                                    : (item.answer + " " + item[wordField]));
    wordRow.appendChild(audioBtn(audioStr, {size:"lg", rate: MC_RATE}));
    const w = el("div","grow");
    // Prompt text: a custom displayFn wins; else fill-in-the-blank. `blankAfter`
    // (JSON-friendly) puts the blank AFTER the word — needed because Maltese
    // adjectives/colours FOLLOW the noun (tadama ____, not ____ tadama).
    const promptText = opts.displayFn ? opts.displayFn(item)
      : opts.blankAfter ? (item[wordField] + " ____")
      : ("____ " + item[wordField]);
    w.appendChild(el("div","mtline", promptText));
    if(item[subField]) w.appendChild(el("div","muted", item[subField]));
    wordRow.appendChild(w);
    card.appendChild(wordRow);
    root.appendChild(card);

    const chips = el("div","chips");
    ex.choices.forEach(c=>{
      const b = el("button","chip", c);
      b.addEventListener("click", ()=>{
        if(c===item.answer){
          b.classList.add("right"); addXp(5);
          play(opts.audioAnswer ? answerAudio : audioStr, {rate: MC_RATE});
          showFeedback(true,"Sewwa!", (opts.audioAnswer ? answerAudio : item.answer)+(opts.detailFn? " "+opts.detailFn(item):""), onNext);
        } else {
          b.classList.add("wrong");
          [...chips.children].forEach(x=>{ if(x.textContent===item.answer) x.classList.add("right"); });
          showFeedback(false,"Not quite.","Correct: "+item.answer, onNext);
        }
        [...chips.children].forEach(x=>x.disabled=true);
      });
      chips.appendChild(b);
    });
    card.appendChild(chips);
    root.appendChild(skipBtn(onNext));
  };
}

// ── Lesson 1 renderers ─────────────────────────
const STEP_RENDERERS = {};

STEP_RENDERERS["phrases:flash"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Word ${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next", onNext));
};
STEP_RENDERERS["phrases:listen"] = makeListenStep("dialogue");
STEP_RENDERERS["phrases:build"] = makeBuildStep("dialogue");

STEP_RENDERERS["alphabet:letter"] = (root, sec, idx, onNext) => {
  const L = sec.letters[idx];
  const card = el("div","letter-card");
  card.appendChild(el("div","big", L.upper));
  if(L.upper.toLowerCase() !== L.lower) card.appendChild(el("div","lower", L.lower));
  // Bare speaker icon — matches the audio buttons used everywhere else; the
  // literal "sound" word looked broken on the big letter card.
  card.appendChild(audioBtn(L.lower, {size:"lg"}));
  const ex = el("div","examples");
  L.words.forEach(w=>{
    const r = el("div","ex");
    r.appendChild(audioBtn(w.mt));
    const tx = el("div",""); tx.appendChild(el("div","mt", w.mt));
    r.appendChild(tx);
    r.appendChild(el("div","en", w.en));
    r.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(w.mt); });
    ex.appendChild(r);
  });
  card.appendChild(ex);
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.letters.length));
  root.appendChild(nextBtn(idx+1===sec.letters.length ? "Done →" : "Next letter →", onNext));
  setTimeout(()=>play(L.lower), 250);
};

STEP_RENDERERS["alphabet:match"] = (root, sec, idx, onNext) => {
  const all = sec.letters;
  // Key the tested letter to idx so the 6 rounds are stable and Previous/Next
  // are deterministic (distractors stay shuffled for variety).
  const letter = all[idx % all.length];
  const word = letter.words[idx % letter.words.length];
  const distractors = all.filter(l=>l!==letter).sort(()=>Math.random()-.5).slice(0,3).map(l=>l.upper);
  const opts = [letter.upper, ...distractors].sort(()=>Math.random()-.5);
  const card = el("div","card");
  card.appendChild(el("h3","","Listen — which letter does it start with?"));
  const row = el("div","row");
  row.appendChild(audioBtn(word.mt, {size:"lg"}));
  row.appendChild(el("div","grow muted","Tap to hear."));
  card.appendChild(row);
  root.appendChild(card);
  const grid = el("div","choices");
  opts.forEach(o=>{
    const b = el("button","choice", o);
    b.style.fontSize="1.6rem"; b.style.fontWeight="800";
    b.addEventListener("click", ()=>{
      if(o===letter.upper){
        b.classList.add("right"); addXp(5);
        showFeedback(true,"Sewwa!", word.mt+" → "+word.en+" (starts with "+letter.upper+")", onNext);
      } else {
        b.classList.add("wrong");
        showFeedback(false,"Not quite.", word.mt+" starts with "+letter.upper, onNext);
      }
      [...grid.children].forEach(c=>{ if(c!==b) c.classList.add("dim"); c.disabled=true; });
    });
    grid.appendChild(b);
  });
  card.appendChild(grid);
  setTimeout(()=>play(word.mt), 350);
};

STEP_RENDERERS["alphabet:passage"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h3","",sec.passage.title));
  card.appendChild(el("p","muted","Tap each line to hear it."));
  root.appendChild(card);
  sec.passage.lines.forEach(line=>{
    const r = el("div","passage-line");
    r.appendChild(audioBtn(line.mt));
    const t = el("div","txt");
    t.appendChild(el("span","mt", line.mt));
    t.appendChild(el("span","en", line.en));
    r.appendChild(t);
    r.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(line.mt); });
    root.appendChild(r);
  });
  root.appendChild(nextBtn("Done →", onNext));
};

STEP_RENDERERS["grammar:rules"] = (root, sec, idx, onNext) => {
  const r = sec.rules[idx];
  const card = el("div","card rule");
  card.appendChild(el("h2","",r.title));
  card.appendChild(el("p","",r.explanation));
  if(r.letters && r.letters.length){
    const ll = el("div","letters");
    r.letters.forEach(L=>ll.appendChild(el("span","",L)));
    card.appendChild(ll);
  }
  const ex = el("div","examples-grid");
  (r.examples||[]).forEach(e=>{
    const row = el("div","ex");
    const audioStr = e.full || e.mt || e.phrase || e.word;
    row.appendChild(audioBtn(audioStr));
    const fx = el("div","grow"); fx.appendChild(el("span","full", e.full || e.phrase || e.mt || e.word));
    row.appendChild(fx);
    row.appendChild(el("div","en", e.en));
    row.addEventListener("click", evt=>{ if(evt.target.tagName!=="BUTTON") play(audioStr); });
    ex.appendChild(row);
  });
  card.appendChild(ex);
  root.appendChild(card);
  root.appendChild(nextBtn(idx+1===sec.rules.length ? "Try the exercises →" : "Next rule →", onNext));
};

// ex3 (il-/l-, 2 buckets) -> bucket-sort; ex4/ex5 (many article forms) -> tap-to-build.
// Both are interactions the paper slides can't do (sorting / assembling), replacing
// the slide-style multiple-choice. Same content, our own format.
STEP_RENDERERS["grammar:ex3"] = makeBucketSortStep("ex3");
STEP_RENDERERS["grammar:ex4"] = makeArticleBuildStep("ex4");
STEP_RENDERERS["grammar:ex5"] = makeArticleBuildStep("ex5");

STEP_RENDERERS["days:flash"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Day ${idx+1} of ${sec.items.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next", onNext));
};

STEP_RENDERERS["days:match"] = makeListenStep("items");  // listen & pick (slides use 'qabbel' match — ours is audio-led)

STEP_RENDERERS["days:scramble"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx % sec.items.length];
  const article = item.mt.split("-")[0]+"-";
  const dayName = item.mt.split("-")[1];
  const letters = (item.scrambled || dayName).split("");
  const card = el("div","card");
  card.appendChild(el("h3","","Unscramble the day"));
  const row = el("div","row");
  row.appendChild(audioBtn(item.mt, {size:"lg"}));
  row.appendChild(el("div","grow mtline", item.en+" → "+article+"___"));
  card.appendChild(row);
  const built = el("div","built"); card.appendChild(built);
  const pool = el("div","pool");
  const placed = [];
  letters.forEach(L=>{
    const t = el("button","tile",L);
    t.addEventListener("click", ()=>{
      if(t.classList.contains("used")) return;
      t.classList.add("used");
      const pt = el("button","tile",L);
      const e = {L, t, pt}; placed.push(e);
      pt.addEventListener("click", ()=>{
        const k = placed.indexOf(e);
        if(k>=0){ e.t.classList.remove("used"); placed.splice(k,1); pt.remove(); }
      });
      built.appendChild(pt);
    });
    pool.appendChild(t);
  });
  card.appendChild(pool);
  root.appendChild(card);
  const check = el("button","btn","Check");
  check.addEventListener("click", ()=>{
    const got = placed.map(p=>p.L).join("").toLowerCase();
    const want = dayName.toLowerCase();
    if(got===want){
      addXp(10); play(item.mt);
      showFeedback(true,"Sewwa! "+item.mt, item.en, onNext);
    } else {
      showFeedback(false,"Not quite.","Correct: "+item.mt, onNext);
    }
  });
  root.appendChild(check);
  root.appendChild(skipBtn(onNext));
};

// Generic match-pairs step
function makeMatchStep(itemsField, leftField, rightField, headline, getXp){
  return (root, sec, idx, onNext) => {
    const items = sec[itemsField].slice();
    const card = el("div","card");
    card.appendChild(el("h3","",headline));
    card.appendChild(el("p","muted","Tap a Maltese item, then tap its English."));
    root.appendChild(card);
    const wrapper = el("div","match");
    const left = items.map(i=>i[leftField]).sort(()=>Math.random()-.5);
    const right = items.map(i=>i[rightField]).sort(()=>Math.random()-.5);
    const lc = el("div",""); lc.style.display="grid"; lc.style.gap="8px";
    const rc = el("div",""); rc.style.display="grid"; rc.style.gap="8px";
    let selL=null, selR=null, matched=0;
    function check(){
      if(!selL || !selR) return;
      const l = selL.dataset.l, r = selR.dataset.r;
      const ok = items.some(i => i[leftField]===l && i[rightField]===r);
      if(ok){
        selL.classList.add("right"); selR.classList.add("right");
        // Voice ONE side (no overlap): for opposite/synonym matches (rightField
        // != "en") play the OPPOSITE the learner just matched; for Maltese↔English
        // matches play the Maltese (left).
        play(rightField !== "en" && r ? r : l);
        matched++; selL=null; selR=null;
        if(matched===items.length){
          addXp(getXp ? getXp(items) : 15);
          showFeedback(true,"Perfect!","All matched.", onNext);
        }
      } else {
        const a=selL,b=selR; a.classList.add("wrong"); b.classList.add("wrong");
        setTimeout(()=>{ a.classList.remove("wrong","sel"); b.classList.remove("wrong","sel"); },700);
        selL=null; selR=null;
      }
    }
    left.forEach(v=>{
      const b = el("button","",v); b.dataset.l=v;
      b.addEventListener("click", ()=>{
        if(b.classList.contains("right")) return;
        if(selL) selL.classList.remove("sel");
        selL=b; b.classList.add("sel"); play(v);
        check();
      });
      lc.appendChild(b);
    });
    right.forEach(v=>{
      const b = el("button","",v); b.dataset.r=v;
      b.addEventListener("click", ()=>{
        if(b.classList.contains("right")) return;
        if(selR) selR.classList.remove("sel");
        selR=b; b.classList.add("sel");
        check();
      });
      rc.appendChild(b);
    });
    wrapper.appendChild(lc); wrapper.appendChild(rc);
    card.appendChild(wrapper);
    root.appendChild(skipBtn(onNext));
  };
}

/* ============================================================
   Lesson 2 renderers
   ============================================================ */

STEP_RENDERERS["serquni:flash"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Word ${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next", onNext));
};
STEP_RENDERERS["serquni:dialogue"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h3","","The dialogue — read & listen"));
  card.appendChild(el("p","muted","Tap each line to hear it spoken."));
  root.appendChild(card);
  sec.dialogue.forEach(line=>{
    const r = el("div","passage-line");
    r.appendChild(audioBtn(line.mt));
    const t = el("div","txt");
    t.appendChild(el("span","mt", line.mt));
    t.appendChild(el("span","en", line.en));
    r.appendChild(t);
    r.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(line.mt); });
    root.appendChild(r);
  });
  root.appendChild(nextBtn("Done →", onNext));
};
STEP_RENDERERS["serquni:listen"] = makeListenStep("dialogue");

STEP_RENDERERS["colours:card"] = (root, sec, idx, onNext) => {
  const c = sec.items[idx];
  const card = el("div","card");
  const head = el("div","row");
  const sw = el("div","colour-swatch");
  sw.style.background = colourMap(c.en);
  head.appendChild(sw);
  const titleWrap = el("div","grow");
  titleWrap.appendChild(el("h2","",c.en));
  head.appendChild(titleWrap);
  head.appendChild(audioBtn(c.mt, {size:"lg"}));
  card.appendChild(head);
  const forms = el("div","forms");
  ["mt","feminine","plural"].forEach(k=>{
    if(!c[k]) return;
    const r = el("div","form-row");
    r.appendChild(audioBtn(c[k]));
    r.appendChild(el("div","label", k==="mt"?"Masc":(k==="feminine"?"Fem":"Plural")));
    r.appendChild(el("div","mtform", c[k]));
    forms.appendChild(r);
  });
  card.appendChild(forms);
  if(c.examples && c.examples.length){
    card.appendChild(el("h3","","Examples"));
    c.examples.forEach(e=>{
      const r = el("div","form-row");
      r.appendChild(audioBtn(e.mt));
      r.appendChild(el("div","mtform", e.mt));
      r.appendChild(el("div","en", e.en));
      forms.appendChild(r);
    });
  }
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.items.length));
  root.appendChild(nextBtn(idx+1===sec.items.length ? "Done →" : "Next colour →", onNext));
  setTimeout(()=>play(c.mt), 250);
};
function colourMap(en){
  const m = {white:"#ffffff",black:"#222",red:"#d23e3e",yellow:"#f6c83b","light blue":"#7fc6e8",green:"#5fb86b",grey:"#9ea4ad",blue:"#3267cf",pink:"#f1a3c2",purple:"#824aa9",orange:"#e98e2a",brown:"#88542e"};
  return m[en.toLowerCase()] || "#ddd";
}

STEP_RENDERERS["adjectives:pair"] = (root, sec, idx, onNext) => {
  const p = sec.pairs[idx];
  const card = el("div","card");
  card.appendChild(el("h3","","Opposite pair"));
  [p.a, p.b].forEach((side,i)=>{
    const sub = el("div","");
    sub.style.padding = "12px"; sub.style.borderRadius = "12px";
    sub.style.background = i===0?"#e9f5f5":"#fff5e6";
    sub.style.marginBottom = "10px";
    const head = el("div","row");
    head.appendChild(audioBtn(side.mt, {size:"lg"}));
    head.appendChild(el("div","grow mtline", side.mt+" — "+side.en.replace(/ \(m\)/, "")));
    sub.appendChild(head);
    [["Masc",side.mt],["Fem",side.feminine],["Plural",side.plural]].forEach(([lbl,val])=>{
      if(!val) return;
      const r = el("div","form-row");
      r.appendChild(audioBtn(val));
      r.appendChild(el("div","label", lbl));
      r.appendChild(el("div","mtform", val));
      sub.appendChild(r);
    });
    card.appendChild(sub);
  });
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.pairs.length));
  root.appendChild(nextBtn(idx+1===sec.pairs.length ? "Done →" : "Next pair →", onNext));
  setTimeout(()=>play(p.a.mt), 250);
};

STEP_RENDERERS["numbers:flash"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  const card = el("div","card number-card");
  card.appendChild(el("div","num", String(item.n)));
  card.appendChild(el("div","mtword", item.mt));
  card.appendChild(el("div","enword", item.en));
  card.appendChild(audioBtn(item.mt, {size:"lg"}));
  card.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(item.mt); });
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.items.length));
  root.appendChild(nextBtn("Next →", onNext));
  setTimeout(()=>play(item.mt), 250);
};
STEP_RENDERERS["numbers:ordinals"] = (root, sec, idx, onNext) => {
  if(idx===0 && sec.ordinalsIntro){
    const head = el("div","card");
    head.appendChild(el("h3","","Ordinal numbers"));
    head.appendChild(el("p","muted", sec.ordinalsIntro));
    root.appendChild(head);
  }
  const item = sec.ordinals[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Ordinal ${idx+1} of ${sec.ordinals.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};

STEP_RENDERERS["months:flash"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Month ${idx+1} of ${sec.items.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
STEP_RENDERERS["months:match"] = makeListenStep("items");  // listen & pick (replaces 'qabbel'-style match)

/* ============================================================
   Lesson 3 renderers
   ============================================================ */

STEP_RENDERERS["pronouns:flash"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  const second = item.alt && item.alt!==item.mt ? item.alt : null;
  root.appendChild(renderFlash(item.mt, item.en, `${idx+1} of ${sec.items.length}`, second));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
STEP_RENDERERS["pronouns:ex1"] = (root, sec, idx, onNext) => {
  const ex = sec.exercises[0];
  const item = ex.items[idx % ex.items.length];
  const card = el("div","card");
  card.appendChild(el("h3","",ex.title));
  if(ex.instructions) card.appendChild(el("p","muted",ex.instructions));
  const row = el("div","row");
  row.appendChild(audioBtn(item.sentence, {size:"lg"}));
  const w = el("div","grow");
  w.appendChild(el("div","mtline", item.sentence));
  w.appendChild(el("div","muted", item.en));
  row.appendChild(w);
  card.appendChild(row);
  root.appendChild(card);
  const chips = el("div","chips");
  ex.choices.forEach(c=>{
    const b = el("button","chip", c);
    b.addEventListener("click", ()=>{
      if(c===item.answer){
        b.classList.add("right"); addXp(5); play(item.full || item.answer);
        showFeedback(true,"Sewwa!", item.full || (item.answer+" replaces it."), onNext);
      } else {
        b.classList.add("wrong");
        [...chips.children].forEach(x=>{ if(x.textContent===item.answer) x.classList.add("right"); });
        showFeedback(false,"Not quite.", "Correct: "+item.answer, onNext);
      }
      [...chips.children].forEach(x=>x.disabled=true);
    });
    chips.appendChild(b);
  });
  card.appendChild(chips);
  root.appendChild(skipBtn(onNext));
  setTimeout(()=>play(item.sentence), 350);
};

STEP_RENDERERS["demonstratives:rules"] = (root, sec, idx, onNext) => {
  const r = sec.rules[idx];
  const card = el("div","card rule");
  card.appendChild(el("h2","",r.title));
  card.appendChild(el("p","",r.explanation));
  const forms = el("div","forms");
  r.items.forEach(it=>{
    const fr = el("div","form-row");
    fr.appendChild(audioBtn(it.mt));
    fr.appendChild(el("div","mtform", it.mt));
    fr.appendChild(el("div","en", it.en));
    forms.appendChild(fr);
  });
  card.appendChild(forms);
  card.appendChild(el("h3","","Examples"));
  const exg = el("div","examples-grid");
  r.examples.forEach(e=>{
    const row = el("div","ex");
    row.appendChild(audioBtn(e.phrase));
    const fx = el("div","grow"); fx.appendChild(el("span","full",e.phrase));
    row.appendChild(fx);
    row.appendChild(el("div","en", e.en));
    row.addEventListener("click", evt=>{ if(evt.target.tagName!=="BUTTON") play(e.phrase); });
    exg.appendChild(row);
  });
  card.appendChild(exg);
  root.appendChild(card);
  root.appendChild(nextBtn(idx+1===sec.rules.length ? "Try the exercises →" : "Next →", onNext));
};
// Audio plays just the noun (which is in the manifest) — combining article+noun
// produces strings like "dan ktieb" that we don't have MP3s for.
// dan/din/dawn (and dak/dik/dawk) -> bucket-sort (3 buckets); replaces slide-style MC.
STEP_RENDERERS["demonstratives:ex2"] = makeBucketSortStep("ex2", {sayAnswerWord:true});
STEP_RENDERERS["demonstratives:ex3"] = makeBucketSortStep("ex3", {sayAnswerWord:true});

STEP_RENDERERS["syllables:card"] = (root, sec, idx, onNext) => {
  if(idx===0 && (sec.intro || (sec.facts && sec.facts.length))){
    const head = el("div","card");
    if(sec.subtitle) head.appendChild(el("h3","",sec.subtitle));
    if(sec.intro) head.appendChild(el("p","",sec.intro));
    (sec.facts||[]).forEach(f => head.appendChild(el("p","muted","• "+f)));
    root.appendChild(head);
  }
  const item = sec.items[idx];
  const card = el("div","card syllable-card");
  card.appendChild(el("div","word", item.word));
  // Show the syllable split right away — tapping to reveal was confusing.
  // The audio button + the card itself both replay the word.
  const split = el("div","split", item.syllables || item.word);
  card.appendChild(split);
  card.appendChild(audioBtn(item.word, {size:"lg"}));
  card.addEventListener("click", e=>{
    if(e.target.tagName==="BUTTON") return;
    play(item.word);
  });
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+Math.min(12,sec.items.length)));
  root.appendChild(nextBtn("Next →", onNext));
  setTimeout(()=>play(item.word), 250);
};

/* ============================================================
   Lesson 4 renderers
   ============================================================ */

STEP_RENDERERS["family:flash"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
STEP_RENDERERS["family:plurals"] = (root, sec, idx, onNext) => {
  const items = sec.plurals;
  const item = items[idx % items.length];
  const distractors = items.filter(x=>x!==item).sort(()=>Math.random()-.5).slice(0,3).map(x=>x.plural);
  const opts = [item.plural, ...distractors].sort(()=>Math.random()-.5);
  const card = el("div","card");
  card.appendChild(el("h3","","What's the plural?"));
  const row = el("div","row");
  row.appendChild(audioBtn(item.singular, {size:"lg"}));
  const w = el("div","grow");
  w.appendChild(el("div","mtline", item.singular));
  w.appendChild(el("div","muted", item.en));
  row.appendChild(w);
  card.appendChild(row);
  root.appendChild(card);
  const ch = el("div","choices col");
  opts.forEach(o=>{
    const b = el("button","choice", o);
    b.addEventListener("click", ()=>{
      if(o===item.plural){
        b.classList.add("right"); addXp(5); play(item.plural);
        showFeedback(true,"Sewwa!", item.singular+" → "+item.plural, onNext);
      } else {
        b.classList.add("wrong");
        showFeedback(false,"Not quite.", "Correct: "+item.plural, onNext);
      }
      [...ch.children].forEach(c=>{ if(c!==b) c.classList.add("dim"); c.disabled=true; });
    });
    ch.appendChild(b);
  });
  card.appendChild(ch);
  root.appendChild(skipBtn(onNext));
  setTimeout(()=>play(item.singular), 350);
};

STEP_RENDERERS["hobbies:flash"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Hobby ${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
STEP_RENDERERS["hobbies:dialogue"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h3","","Dialogue — read & listen"));
  root.appendChild(card);
  sec.dialogue.forEach(line=>{
    const r = el("div","passage-line");
    r.appendChild(audioBtn(line.mt));
    const t = el("div","txt");
    t.appendChild(el("span","mt", line.mt));
    t.appendChild(el("span","en", line.en));
    r.appendChild(t);
    r.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(line.mt); });
    root.appendChild(r);
  });
  root.appendChild(nextBtn("Done →", onNext));
};

STEP_RENDERERS["possessive:examples"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h2","","Using ta'"));
  card.appendChild(el("p","",sec.intro));
  root.appendChild(card);
  root.appendChild(el("h3","","Examples"));
  sec.examples.forEach(e=>{
    const r = el("div","passage-line");
    r.appendChild(audioBtn(e.phrase));
    const t = el("div","txt");
    t.appendChild(el("span","mt", e.phrase));
    t.appendChild(el("span","en", e.en));
    r.appendChild(t);
    r.addEventListener("click", evt=>{ if(evt.target.tagName!=="BUTTON") play(e.phrase); });
    root.appendChild(r);
  });
  root.appendChild(nextBtn("Continue →", onNext));
};
STEP_RENDERERS["possessive:pronouns"] = (root, sec, idx, onNext) => {
  // The whole possessive paradigm on ONE screen (tiegħi, tiegħek, tiegħu…),
  // each with its example phrase. Tap a row to hear the phrase.
  const card = el("div","card");
  card.appendChild(el("h3","","Possessives: tiegħi, tiegħek, tiegħu…"));
  card.appendChild(el("p","muted","All the forms together. Tap any to hear it."));
  sec.possessives.forEach((item, i) => {
    const ex = sec.examples_pronouns ? sec.examples_pronouns[i] : null;
    const phrase = ex ? ex.phrase : item.mt;
    // Append mtform + en directly so .form-row's flex aligns every row:
    // [audio] phrase ................ meaning(right)
    const r = el("div","form-row");
    r.appendChild(audioBtn(phrase));
    r.appendChild(el("div","mtform", phrase));
    r.appendChild(el("div","en", ex ? ex.en : item.en));
    card.appendChild(r);
  });
  root.appendChild(card);
};

STEP_RENDERERS["attached:examples"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h2","","Attached pronouns"));
  card.appendChild(el("p","",sec.intro));
  root.appendChild(card);
  sec.examples.forEach(e=>{
    const r = el("div","form-row");
    r.appendChild(audioBtn(e.short));
    r.appendChild(el("div","mtform", e.short));
    r.appendChild(el("div","en", e.long+" — "+e.en));
    root.appendChild(r);
  });
  root.appendChild(nextBtn("Try the exercises →", onNext));
};
STEP_RENDERERS["attached:ex6"] = makeMcStep("ex6", {
  wordField: "long",
  subField: "en",
  displayFn: it => it.long+" → ?",
  audioCombine: it => it.answer
});
STEP_RENDERERS["attached:ex7"] = makeMcStep("ex7", {
  wordField: "long",
  subField: "en",
  displayFn: it => it.long+" → ?",
  audioCombine: it => it.answer
});

/* ============================================================
   Lesson 5 renderers
   ============================================================ */

function multiFormFruitVeg(root, sec, idx, onNext){
  const item = sec.items[idx];
  const card = el("div","card");
  const head = el("div","row");
  head.appendChild(audioBtn(item.singular, {size:"lg"}));
  const w = el("div","grow");
  w.appendChild(el("div","mtline", item.singular));
  w.appendChild(el("div","muted", item.en));
  head.appendChild(w);
  card.appendChild(head);
  [["Singular",item.singular],["Collective",item.collective],["Plural",item.plural]].forEach(([lbl,val])=>{
    if(!val) return;
    const r = el("div","form-row");
    r.appendChild(audioBtn(val));
    r.appendChild(el("div","label", lbl));
    r.appendChild(el("div","mtform", val));
    card.appendChild(r);
  });
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.items.length));
  root.appendChild(nextBtn(idx+1===sec.items.length ? "Done →" : "Next →", onNext));
  setTimeout(()=>play(item.singular), 250);
}
STEP_RENDERERS["fruit:card"] = multiFormFruitVeg;
STEP_RENDERERS["vegetables:card"] = multiFormFruitVeg;

STEP_RENDERERS["imperative:card"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  const card = el("div","card");
  const head = el("div","row");
  head.appendChild(audioBtn(item.singular, {size:"lg"}));
  const w = el("div","grow");
  w.appendChild(el("div","mtline", item.en));
  head.appendChild(w);
  card.appendChild(head);
  [["Singular",item.singular],["Plural",item.plural]].forEach(([lbl,val])=>{
    const r = el("div","form-row");
    r.appendChild(audioBtn(val));
    r.appendChild(el("div","label", lbl));
    r.appendChild(el("div","mtform", val));
    card.appendChild(r);
  });
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.items.length));
  root.appendChild(nextBtn(idx+1===sec.items.length ? "Done →" : "Next →", onNext));
  setTimeout(()=>play(item.singular), 250);
};
STEP_RENDERERS["imperative:ex8"] = (root, sec, idx, onNext) => {
  const ex = sec.exercises[0];
  const item = ex.items[idx % ex.items.length];
  const card = el("div","card");
  card.appendChild(el("h3","",ex.title));
  if(ex.instructions) card.appendChild(el("p","muted",ex.instructions));
  const row = el("div","row");
  row.appendChild(audioBtn(item.imperative, {size:"lg"}));
  const w = el("div","grow");
  w.appendChild(el("div","mtline", item.imperative));
  w.appendChild(el("div","muted", item.en));
  row.appendChild(w);
  card.appendChild(row);
  root.appendChild(card);
  const ch = el("div","chips");
  ex.choices.forEach(c=>{
    const b = el("button","chip", c==="singular"?"singular (you)":"plural (you all)");
    b.dataset.v = c;
    b.addEventListener("click", ()=>{
      if(c===item.answer){
        b.classList.add("right"); addXp(5); play(item.imperative);
        showFeedback(true,"Sewwa!", item.imperative+" — "+item.answer, onNext);
      } else {
        b.classList.add("wrong");
        showFeedback(false,"Not quite.","Correct: "+item.answer, onNext);
      }
      [...ch.children].forEach(x=>x.disabled=true);
    });
    ch.appendChild(b);
  });
  card.appendChild(ch);
  root.appendChild(skipBtn(onNext));
  setTimeout(()=>play(item.imperative), 300);
};

function conjTableRule(root, rule, idx, total){
  const card = el("div","card rule");
  card.appendChild(el("h2","",rule.title));
  const t = el("div","conj-table");
  rule.rows.forEach(r=>{
    t.appendChild(el("div","person", r.person));
    t.appendChild(el("div","form-cell", r.form));
    t.appendChild(audioBtn(r.form));
  });
  card.appendChild(t);
  return card;
}
STEP_RENDERERS["present:rules"] = (root, sec, idx, onNext) => {
  root.appendChild(conjTableRule(root, sec.rules[idx], idx, sec.rules.length));
  root.appendChild(nextBtn(idx+1===sec.rules.length ? "Try the exercise →" : "Next rule →", onNext));
};
STEP_RENDERERS["present:ex9"] = (root, sec, idx, onNext) => {
  const ex = sec.exercises[0];
  const item = ex.items[idx % ex.items.length];
  const card = el("div","card");
  card.appendChild(el("h3","",ex.title));
  if(ex.instructions) card.appendChild(el("p","muted",ex.instructions));
  card.appendChild(el("div","mtline", item.pronoun+" __"));
  card.appendChild(el("div","muted", item.en));
  root.appendChild(card);
  const ch = el("div","chips");
  ex.choices.forEach(c=>{
    const b = el("button","chip", c);
    b.addEventListener("click", ()=>{
      if(c===item.answer){
        b.classList.add("right"); addXp(5); play(item.pronoun + " " + item.answer);
        showFeedback(true,"Sewwa!", item.pronoun+" "+item.answer, onNext);
      } else {
        b.classList.add("wrong");
        [...ch.children].forEach(x=>{ if(x.textContent===item.answer) x.classList.add("right"); });
        showFeedback(false,"Not quite.","Correct: "+item.answer, onNext);
      }
      [...ch.children].forEach(x=>x.disabled=true);
    });
    ch.appendChild(b);
  });
  card.appendChild(ch);
  root.appendChild(skipBtn(onNext));
};

/* ============================================================
   Lesson 6 renderers
   ============================================================ */

STEP_RENDERERS["table:card"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  const card = el("div","card");
  const head = el("div","row");
  head.appendChild(audioBtn(item.singular, {size:"lg"}));
  const w = el("div","grow");
  w.appendChild(el("div","mtline", item.singular));
  w.appendChild(el("div","muted", item.en));
  head.appendChild(w);
  card.appendChild(head);
  if(item.singular!==item.plural){
    const r = el("div","form-row");
    r.appendChild(audioBtn(item.plural));
    r.appendChild(el("div","label","Plural"));
    r.appendChild(el("div","mtform", item.plural));
    card.appendChild(r);
  }
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.items.length));
  root.appendChild(nextBtn(idx+1===sec.items.length ? "Done →" : "Next →", onNext));
  setTimeout(()=>play(item.singular), 250);
};

STEP_RENDERERS["food:flash"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};

STEP_RENDERERS["questions:flash"] = (root, sec, idx, onNext) => {
  // All the question words on ONE screen, each with an example. Tap to hear.
  const card = el("div","card");
  card.appendChild(el("h3","","The question words"));
  card.appendChild(el("p","muted","Tap any row to hear the example."));
  sec.items.forEach(item => {
    const audioStr = item.example || item.mt;
    const r = el("div","form-row");
    r.appendChild(audioBtn(audioStr));
    r.appendChild(el("div","mtform", item.example || item.mt));
    r.appendChild(el("div","en", item.mt + " = " + item.en));
    card.appendChild(r);
  });
  root.appendChild(card);
};
STEP_RENDERERS["questions:passage"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h3","",sec.passage.title));
  root.appendChild(card);
  sec.passage.lines.forEach(line=>{
    const r = el("div","passage-line");
    r.appendChild(audioBtn(line.mt));
    const t = el("div","txt");
    t.appendChild(el("span","mt", line.mt));
    t.appendChild(el("span","en", line.en));
    r.appendChild(t);
    r.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(line.mt); });
    root.appendChild(r);
  });
  if(sec.passage.questions && sec.passage.questions.length){
    root.appendChild(el("h3","","Questions and answers"));
    sec.passage.questions.forEach(q=>{
      const c2 = el("div","card");
      const qr = el("div","row");
      qr.appendChild(audioBtn(q.q));
      const qw = el("div","grow");
      qw.appendChild(el("div","mtline", q.q));
      qw.appendChild(el("div","muted", q.qen));
      qr.appendChild(qw);
      c2.appendChild(qr);
      const ar = el("div","row");
      ar.style.marginTop="8px";
      ar.appendChild(audioBtn(q.a));
      const aw = el("div","grow");
      aw.appendChild(el("div","mtline", q.a));
      aw.appendChild(el("div","muted", q.aen));
      ar.appendChild(aw);
      c2.appendChild(ar);
      root.appendChild(c2);
    });
  }
  root.appendChild(nextBtn("Done →", onNext));
};

STEP_RENDERERS["ghpresent:rules"] = (root, sec, idx, onNext) => {
  root.appendChild(conjTableRule(root, sec.rules[idx], idx, sec.rules.length));
  root.appendChild(nextBtn(idx+1===sec.rules.length ? "Try the exercises →" : "Next rule →", onNext));
};
STEP_RENDERERS["ghpresent:ex5"] = (root, sec, idx, onNext) => {
  const ex = sec.exercises.find(e=>e.id==="ex5");
  const item = ex.items[idx % ex.items.length];
  const card = el("div","card");
  card.appendChild(el("h3","",ex.title));
  if(ex.instructions) card.appendChild(el("p","muted",ex.instructions));
  card.appendChild(el("div","mtline", item.pronoun+" __"));
  card.appendChild(el("div","muted", item.en));
  root.appendChild(card);
  const ch = el("div","chips");
  ex.choices.forEach(c=>{
    const b = el("button","chip", c);
    b.addEventListener("click", ()=>{
      if(c===item.answer){
        b.classList.add("right"); addXp(5); play(item.pronoun + " " + item.answer);
        showFeedback(true,"Sewwa!", item.pronoun+" "+item.answer, onNext);
      } else {
        b.classList.add("wrong");
        [...ch.children].forEach(x=>{ if(x.textContent===item.answer) x.classList.add("right"); });
        showFeedback(false,"Not quite.","Correct: "+item.answer, onNext);
      }
      [...ch.children].forEach(x=>x.disabled=true);
    });
    ch.appendChild(b);
  });
  card.appendChild(ch);
  root.appendChild(skipBtn(onNext));
};
STEP_RENDERERS["ghpresent:ex6"] = (root, sec, idx, onNext) => {
  const ex = sec.exercises.find(e=>e.id==="ex6");
  const item = ex.items[idx % ex.items.length];
  const card = el("div","card");
  card.appendChild(el("h3","",ex.title));
  if(ex.instructions) card.appendChild(el("p","muted",ex.instructions));
  card.appendChild(el("div","mtline", item.sentence));
  card.appendChild(el("div","muted", item.en));
  root.appendChild(card);
  const ch = el("div","chips");
  ex.choices.forEach(c=>{
    const b = el("button","chip", c);
    b.addEventListener("click", ()=>{
      if(c===item.answer){
        b.classList.add("right"); addXp(5); play(item.answer);
        showFeedback(true,"Sewwa!", item.answer+" — "+item.en, onNext);
      } else {
        b.classList.add("wrong");
        [...ch.children].forEach(x=>{ if(x.textContent===item.answer) x.classList.add("right"); });
        showFeedback(false,"Not quite.","Correct: "+item.answer, onNext);
      }
      [...ch.children].forEach(x=>x.disabled=true);
    });
    ch.appendChild(b);
  });
  card.appendChild(ch);
  root.appendChild(skipBtn(onNext));
};

/* ============================================================
   Lesson 7 renderers
   ============================================================ */

// transport:card — singular/plural pair (reuses lesson 6 pattern)
STEP_RENDERERS["transport:card"] = STEP_RENDERERS["table:card"];

STEP_RENDERERS["weekend:flash"] = (root, sec, idx, onNext) => {
  if(idx===0 && sec.intro){
    const head = el("div","card");
    head.appendChild(el("p","muted", sec.intro));
    root.appendChild(head);
  }
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Phrase ${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
STEP_RENDERERS["weekend:dialogue"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h3","","Mini-dialogue"));
  card.appendChild(el("p","muted","Tap each line to hear it spoken."));
  root.appendChild(card);
  sec.dialogue.forEach(line=>{
    const r = el("div","passage-line");
    r.appendChild(audioBtn(line.mt));
    const t = el("div","txt");
    t.appendChild(el("span","mt", line.mt));
    t.appendChild(el("span","en", line.en));
    r.appendChild(t);
    r.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(line.mt); });
    root.appendChild(r);
  });
  root.appendChild(nextBtn("Done →", onNext));
};

// seasons:card — one season + its vocab list per page
STEP_RENDERERS["seasons:card"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  const card = el("div","card");
  const head = el("div","row");
  head.appendChild(audioBtn(item.mt, {size:"lg"}));
  const w = el("div","grow");
  const title = el("div","mtline", (item.icon ? item.icon+" " : "") + item.mt);
  w.appendChild(title);
  w.appendChild(el("div","muted", item.en));
  head.appendChild(w);
  card.appendChild(head);
  if(item.vocab && item.vocab.length){
    const forms = el("div","forms");
    forms.style.marginTop = "10px";
    item.vocab.forEach(v=>{
      const r = el("div","form-row");
      r.appendChild(audioBtn(v.mt));
      r.appendChild(el("div","mtform", v.mt));
      r.appendChild(el("div","en", v.en));
      forms.appendChild(r);
    });
    card.appendChild(forms);
  }
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.items.length));
  root.appendChild(nextBtn(idx+1===sec.items.length ? "Done →" : "Next →", onNext));
  setTimeout(()=>play(item.mt), 250);
};

// particles:flash — small word + meaning
STEP_RENDERERS["particles:flash"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Particle ${idx+1} of ${sec.items.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
STEP_RENDERERS["particles:examples"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h3","","Examples in real sentences"));
  card.appendChild(el("p","muted","Tap each line to hear it."));
  root.appendChild(card);
  sec.examples.forEach(e=>{
    const r = el("div","passage-line");
    r.appendChild(audioBtn(e.phrase));
    const t = el("div","txt");
    t.appendChild(el("span","mt", e.phrase));
    t.appendChild(el("span","en", e.en));
    r.appendChild(t);
    r.addEventListener("click", evt=>{ if(evt.target.tagName!=="BUTTON") play(e.phrase); });
    root.appendChild(r);
  });
  root.appendChild(nextBtn("Try the exercise →", onNext));
};
// Generic sentence multiple-choice — used by particles:ex7, partarticle:ex3, time:ex8.
// `opts.noPromptAudio` suppresses the speaker button + auto-play for the prompt.
// We use it for time:ex8 because the prompt there is a digital time string like
// "7:30 pm" which Maltese TTS pronounces wrong; the only audio worth hearing is
// the Maltese answer ("Is-sebgħa u nofs"), which still plays on a correct pick.
function makeSentenceMcStep(exId, opts){
  opts = opts || {};
  return (root, sec, idx, onNext) => {
    const ex = sec.exercises.find(e=>e.id===exId) || sec.exercises[0];
    const item = ex.items[idx % ex.items.length];
    const card = el("div","card");
    card.appendChild(el("h3","",ex.title));
    if(ex.instructions) card.appendChild(el("p","muted",ex.instructions));
    const row = el("div","row");
    if(!opts.noPromptAudio){
      row.appendChild(audioBtn(item.sentence, {size:"lg", rate: MC_RATE}));
    }
    const w = el("div","grow");
    w.appendChild(el("div","mtline", item.sentence));
    if(item.en) w.appendChild(el("div","muted", item.en));
    row.appendChild(w);
    card.appendChild(row);
    root.appendChild(card);
    const ch = el("div","chips");
    ex.choices.forEach(c=>{
      const b = el("button","chip", c);
      b.addEventListener("click", ()=>{
        if(c===item.answer){
          b.classList.add("right"); addXp(5); play(item.answer, {rate: MC_RATE});
          showFeedback(true,"Sewwa!", item.answer, onNext);
        } else {
          b.classList.add("wrong");
          [...ch.children].forEach(x=>{ if(x.textContent===item.answer) x.classList.add("right"); });
          showFeedback(false,"Not quite.","Correct: "+item.answer, onNext);
        }
        [...ch.children].forEach(x=>x.disabled=true);
      });
      ch.appendChild(b);
    });
    card.appendChild(ch);
    root.appendChild(skipBtn(onNext));
    if(!opts.noPromptAudio){
      setTimeout(()=>play(item.sentence, {rate: MC_RATE}), 350);
    }
  };
}
STEP_RENDERERS["particles:ex7"] = makeSentenceMcStep("ex7");

/* ============================================================
   Lesson 8 renderers
   ============================================================ */
STEP_RENDERERS["datetime:flash"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
// partarticle:flash — show long form → short fused form
STEP_RENDERERS["partarticle:flash"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  const card = el("div","card");
  const head = el("div","row");
  head.appendChild(audioBtn(item.short, {size:"lg"}));
  const w = el("div","grow");
  w.appendChild(el("div","mtline", item.long+" → "+item.short));
  w.appendChild(el("div","muted", item.en));
  head.appendChild(w);
  card.appendChild(head);
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.items.length));
  root.appendChild(nextBtn("Next →", onNext));
  setTimeout(()=>play(item.short), 250);
};
STEP_RENDERERS["partarticle:ex3"] = makeSentenceMcStep("ex3");

STEP_RENDERERS["map:facts"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h2","","About Malta"));
  (sec.facts||[]).forEach(f=>{
    const p = el("p","",f);
    card.appendChild(p);
  });
  root.appendChild(card);
  root.appendChild(nextBtn("Continue →", onNext));
};
STEP_RENDERERS["map:vocab"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
// map:regions — show region name + list of localities (no audio per locality, just region)
STEP_RENDERERS["map:regions"] = (root, sec, idx, onNext) => {
  const region = sec.regions[idx];
  const card = el("div","card");
  card.appendChild(el("h2","",region.name));
  card.appendChild(el("p","muted","Localities in this area:"));
  const grid = el("div","");
  grid.style.display = "flex";
  grid.style.flexWrap = "wrap";
  grid.style.gap = "8px";
  region.places.forEach(p=>{
    const chip = el("div","");
    chip.style.padding = "8px 12px";
    chip.style.borderRadius = "99px";
    chip.style.background = "var(--bg)";
    chip.style.border = "1px solid var(--line)";
    chip.style.color = "var(--primary-2)";
    chip.style.fontWeight = "600";
    chip.style.fontSize = ".95rem";
    chip.textContent = p;
    grid.appendChild(chip);
  });
  card.appendChild(grid);
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.regions.length));
  root.appendChild(nextBtn(idx+1===sec.regions.length ? "Done →" : "Next region →", onNext));
};

// places:flash — name + kind + descriptive note
STEP_RENDERERS["places:flash"] = (root, sec, idx, onNext) => {
  const item = sec.items[idx];
  const card = el("div","card");
  const head = el("div","row");
  head.appendChild(audioBtn(item.mt, {size:"lg"}));
  const w = el("div","grow");
  w.appendChild(el("div","mtline", item.mt));
  w.appendChild(el("div","muted", item.en));
  head.appendChild(w);
  card.appendChild(head);
  if(item.kind){
    const k = el("div","");
    k.style.marginTop = "10px";
    k.style.fontSize = ".82rem";
    k.style.fontWeight = "700";
    k.style.color = "var(--accent)";
    k.style.letterSpacing = ".04em";
    k.textContent = item.kind;
    card.appendChild(k);
  }
  if(item.note){
    const n = el("p","",item.note);
    n.style.marginTop = "6px";
    card.appendChild(n);
  }
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.items.length));
  root.appendChild(nextBtn(idx+1===sec.items.length ? "Done →" : "Next →", onNext));
  setTimeout(()=>play(item.mt), 250);
};

/* ============================================================
   Lesson 9 renderers
   ============================================================ */
STEP_RENDERERS["directions:flash"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
STEP_RENDERERS["directions:dialogue"] = (root, sec, idx, onNext) => {
  const card = el("div","card");
  card.appendChild(el("h3","","Asking for directions"));
  card.appendChild(el("p","muted","Tap each line to hear it."));
  root.appendChild(card);
  sec.dialogue.forEach(line=>{
    const r = el("div","passage-line");
    r.appendChild(audioBtn(line.mt));
    const t = el("div","txt");
    t.appendChild(el("span","mt", line.mt));
    t.appendChild(el("span","en", line.en));
    r.appendChild(t);
    r.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(line.mt); });
    root.appendChild(r);
  });
  root.appendChild(nextBtn("Continue →", onNext));
};
STEP_RENDERERS["directions:winds"] = (root, sec, idx, onNext) => {
  const item = sec.winds[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Wind ${idx+1} of ${sec.winds.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};

STEP_RENDERERS["timeexp:flash"] = (root, sec, idx, onNext) => {
  const item = sec.vocab[idx];
  root.appendChild(renderFlash(item.mt, item.en, `${idx+1} of ${sec.vocab.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
STEP_RENDERERS["time:hours"] = (root, sec, idx, onNext) => {
  const item = sec.hours[idx];
  const card = el("div","card number-card");
  card.appendChild(el("div","num", item.n===0 ? "12" : String(item.n)));
  card.appendChild(el("div","mtword", item.mt));
  card.appendChild(el("div","enword", item.en));
  card.appendChild(audioBtn(item.mt, {size:"lg"}));
  card.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(item.mt); });
  root.appendChild(card);
  root.appendChild(el("p","muted center", (idx+1)+" / "+sec.hours.length));
  root.appendChild(nextBtn("Next →", onNext));
  setTimeout(()=>play(item.mt), 250);
};
STEP_RENDERERS["time:patterns"] = (root, sec, idx, onNext) => {
  const item = sec.patterns[idx];
  root.appendChild(renderFlash(item.mt, item.en, `Pattern ${idx+1} of ${sec.patterns.length}`));
  setTimeout(()=>play(item.mt), 250);
  root.appendChild(nextBtn("Next →", onNext));
};
// time:ex8 prompts are digital times like "7:30 pm" — Maltese TTS reading those
// sounds nothing like the spoken Maltese form, so we skip the prompt audio and
// only play the Maltese answer when the learner picks correctly.
STEP_RENDERERS["time:ex8"] = makeSentenceMcStep("ex8", {noPromptAudio: true});

/* ============================================================
   Extras — survival Maltese
   ============================================================ */
// All four sections reuse the same flash + dialogue pattern as 'weekend'.
["polite", "cafe", "work", "shopping"].forEach(sid => {
  STEP_RENDERERS[sid+":flash"] = STEP_RENDERERS["weekend:flash"];
  STEP_RENDERERS[sid+":dialogue"] = STEP_RENDERERS["weekend:dialogue"];
});

/* ============================================================
   Study aids — Vocabulary list + per-lesson Grammar rules
   Added so learners can revise the lesson's words and grammar
   in one place ahead of a test.
   ============================================================ */

// Single-page grouped vocabulary list. Each group is a card with a heading
// and a stack of items (audio + optional emoji icon + mt + en).
STEP_RENDERERS["vocabulary:list"] = (root, sec, idx, onNext) => {
  if(sec.intro){
    root.appendChild(el("p","muted",sec.intro));
  }
  (sec.groups||[]).forEach(group => {
    const card = el("div","card vocab-group");
    const head = el("div","row vocab-head");
    if(group.icon){
      const ic = el("div","vocab-group-icon");
      ic.textContent = group.icon;
      head.appendChild(ic);
    }
    const titleWrap = el("div","grow");
    titleWrap.appendChild(el("h3","",group.title));
    if(group.subtitle) titleWrap.appendChild(el("div","muted",group.subtitle));
    head.appendChild(titleWrap);
    card.appendChild(head);

    const list = el("div","vocab-list");
    (group.items||[]).forEach(item => {
      const r = el("div","vocab-item");
      r.appendChild(audioBtn(item.mt, {size:"sm"}));
      if(item.icon){
        const ic = el("div","vocab-icon");
        ic.textContent = item.icon;
        r.appendChild(ic);
      }
      const tx = el("div","grow vocab-text");
      tx.appendChild(el("div","mt",item.mt));
      tx.appendChild(el("div","en",item.en));
      if(item.note) tx.appendChild(el("div","muted",item.note));
      r.appendChild(tx);
      r.addEventListener("click", e=>{ if(e.target.tagName!=="BUTTON") play(item.mt); });
      list.appendChild(r);
    });
    card.appendChild(list);
    root.appendChild(card);
  });
  root.appendChild(nextBtn("Done →", onNext));
};

// Generic Grammar rules renderer — same shape as grammar:rules but the final
// CTA is "Done →" when the section has no exercises (lessons 7/8/9 don't yet).
function renderGrammarRulesStep(root, sec, idx, onNext){
  const r = sec.rules[idx];
  if(idx===0 && (sec.subtitle || sec.intro)){
    const head = el("div","card");
    if(sec.subtitle) head.appendChild(el("h3","",sec.subtitle));
    if(sec.intro) head.appendChild(el("p","muted",sec.intro));
    root.appendChild(head);
  }
  const card = el("div","card rule");
  card.appendChild(el("h2","",r.title));
  card.appendChild(el("p","",r.explanation));
  if(r.letters && r.letters.length){
    const ll = el("div","letters");
    r.letters.forEach(L=>ll.appendChild(el("span","",L)));
    card.appendChild(ll);
  }
  const ex = el("div","examples-grid");
  (r.examples||[]).forEach(e=>{
    const row = el("div","ex");
    const audioStr = e.full || e.mt || e.phrase || e.word;
    row.appendChild(audioBtn(audioStr));
    const fx = el("div","grow");
    fx.appendChild(el("span","full", e.full || e.phrase || e.mt || e.word));
    row.appendChild(fx);
    row.appendChild(el("div","en", e.en));
    row.addEventListener("click", evt=>{ if(evt.target.tagName!=="BUTTON") play(audioStr); });
    ex.appendChild(row);
  });
  card.appendChild(ex);
  root.appendChild(card);
  const isLast = idx+1 === sec.rules.length;
  const hasExercises = sec.exercises && sec.exercises.length;
  const label = isLast ? (hasExercises ? "Try the exercises →" : "Done →") : "Next rule →";
  root.appendChild(nextBtn(label, onNext));
}
STEP_RENDERERS["grammarwelcome:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar2:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar3:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar4:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar5:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar6:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar7:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar8:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar9:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar10:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar11:rules"] = renderGrammarRulesStep;
STEP_RENDERERS["grammar12:rules"] = renderGrammarRulesStep;

/* ============================================================
   Observability — Sentry + Plausible
   ============================================================
   Both run zero overhead when not configured. The user fills app-config.js
   (gitignored) once accounts exist; until then the helpers below are no-ops
   and trackEvent() just logs to the dev console.
   ------------------------------------------------------------ */
function initObservability(){
  const cfg = (window.MALTI_CONFIG || {});

  // Sentry — only loads the SDK if a DSN is present. The CDN bundle is ~30 KB
  // gzipped, so we avoid the cost for users running the free build.
  if(cfg.sentryDsn){
    const s = document.createElement("script");
    s.src = "https://browser.sentry-cdn.com/8.40.0/bundle.tracing.min.js";
    s.crossOrigin = "anonymous";
    s.async = true;
    s.onload = () => {
      try {
        window.Sentry.init({
          dsn: cfg.sentryDsn,
          environment: cfg.sentryEnv || "beta",
          release: "maltiongthego@" + VERSION,
          tracesSampleRate: 0.1,  // 10% of navigations sampled for perf data
          ignoreErrors: [
            // Service-worker / PWA install noise we can't control
            "ResizeObserver loop limit exceeded",
            "Non-Error promise rejection captured",
          ],
        });
        window.Sentry.setTag("tier", State.entitlement && State.entitlement.tier);
        window.Sentry.setTag("packs", State.entitlement ? (PACKS.filter(x => ownsPack(x.key)).map(x => x.key).join(",") || "none") : "none");
      } catch(e){ console.warn("Sentry init failed", e); }
    };
    document.head.appendChild(s);
  }

  // Plausible — privacy-respecting page-view + custom-event tracker. The
  // script is ~1 KB; we still gate on the domain being set so the local
  // dev build doesn't inflate someone else's stats.
  if(cfg.plausibleDomain){
    const p = document.createElement("script");
    p.defer = true;
    p.setAttribute("data-domain", cfg.plausibleDomain);
    const host = cfg.plausibleApiHost || "https://plausible.io";
    p.src = host.replace(/\/+$/, "") + "/js/script.js";
    document.head.appendChild(p);
    // Plausible queues calls made before the script lands.
    window.plausible = window.plausible || function(){
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
  }
}

// One-call event tracker — safe to invoke before observability is initialised.
// Always logs to console in dev for visibility. Plausible swallows the call
// silently when the domain isn't configured. Sentry captures the breadcrumb
// regardless of whether Plausible is on, so we still see the user journey on
// crash reports.
function trackEvent(name, props){
  try { console.log("[event]", name, props || {}); } catch(_){}
  if(window.plausible){
    try { window.plausible(name, props ? {props: props} : undefined); } catch(_){}
  }
  if(window.Sentry && window.Sentry.addBreadcrumb){
    try { window.Sentry.addBreadcrumb({category: "ux", message: name, data: props || {}, level: "info"}); } catch(_){}
  }
}

/* ============================================================
   Boot
   ============================================================ */
async function boot(){
  // Fire-and-forget. initObservability injects CDN scripts and is safe to call
  // before any UI renders; if config blanks (the default), it does nothing.
  initObservability();
  try{
    const [index, manifest, recorded] = await Promise.all([
      // Bust on BUILD (not VERSION) so new lessons/audio register immediately —
      // VERSION is static across web builds, which left a stale manifest (new
      // clips silent). ?b=<BUILD> changes every build → fresh fetch past SW cache.
      fetch("lessons/index.json?b=" + BUILD).then(r=>r.json()),
      fetch("audio/manifest.json?b=" + BUILD).then(r=>r.json()),
      fetch("audio/recorded.json?b=" + BUILD).then(r=>r.ok ? r.json() : {}).catch(()=>({})),
    ]);
    State.index = index;
    State.manifest = manifest;
    State.recorded = recorded;
    // preload all lessons so home page shows accurate progress
    await Promise.all(index.lessons.map(L => loadLesson(L.id).catch(e=>console.warn(e))));
    // Native only: configure RevenueCat and sync purchase entitlements before
    // the first render so locked/unlocked cards are correct. No-op on web.
    await Billing.init().catch(e => console.warn("[billing] init", e));
    route();
    // If we just came back from a force-update, surface the new version at the top.
    showUpdateConfirmation();
    // Register the SW (replaces the inline script in index.html). Will fire a
    // separate orange "Update available" banner whenever a new version lands.
    registerServiceWorker();
    // iOS Safari doesn't fire beforeinstallprompt — trigger the manual instructions
    // a few seconds after first load so it isn't immediately in the user's face.
    if(isIOS() && !isStandalone()){
      setTimeout(maybeShowInstallPrompt, 6000);
    }
  }catch(e){
    document.getElementById("app").innerHTML = "<p>Could not load. Check your connection and refresh.</p><p class='muted'>"+(e.message||e)+"</p>";
    console.error(e);
  }
}
boot();

})();
