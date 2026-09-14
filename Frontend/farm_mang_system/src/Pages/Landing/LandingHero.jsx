import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Sprout,
  PawPrint,
  HeartPulse,
  Syringe,
  ShieldCheck,
  ArrowRight,
  Play,
  X,
  Menu,
  Warehouse,
  Banknote,
  ChevronDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Configuration — swap in your own 4K farm footage in one place.     */
/*  The video layers OVER a pure CSS golden-hour farm scene, so if the */
/*  file is slow or blocked the scene still looks alive.               */
/* ------------------------------------------------------------------ */
/* Local compressed livestock trailer (public/videos/farm-hero.mp4, ~6 MB)
   + remote Pexels footage as fallback if the local file is missing. */
export const FARM_VIDEO_SOURCES = [
  { src: "/videos/farm-hero.mp4", type: "video/mp4" },
];

export const FARM_VIDEO_POSTER = "/videos/farm-hero-poster.jpg";

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/* Deterministic arrays — stable across mounts, no re-render jitter. */
const PARTICLES = Array.from({ length: 26 }, (_, i) => {
  const n = i + 1;
  return {
    left: (n * 37) % 100,
    top: (n * 53 + 11) % 100,
    size: 2 + (n % 4),
    depth: 0.15 + ((n * 7) % 10) / 10 * 0.85,
    delay: (n * 0.183) % 2.4,
    dur: 5 + (n % 5) * 1.7,
    o: 0.22 + (n % 3) * 0.14,
  };
});




const NAV_LINKS = [
  { href: "#animals", label: "Animals" },
  { href: "#breeding", label: "Breeding" },
  { href: "#health", label: "Health" },
  { href: "#trade", label: "Trade" },
  { href: "#feed", label: "Feed" },
];

const CAPABILITIES = [
  { id: "animals", icon: PawPrint, title: "Animal tracking", body: "Full profiles, lineage, photos and status history for every animal on the farm.", accent: "#2f6a51" },
  { id: "breeding", icon: HeartPulse, title: "Breeding & reproduction", body: "Services, pregnancies, expected deliveries and offspring — connected end to end.", accent: "#e4572e" },
  { id: "health", icon: Syringe, title: "Vaccination & health", body: "Schedule doses, track due dates and keep every animal protected on time.", accent: "#3f88a8" },
  { id: "trade", icon: Banknote, title: "Trade & valuation", body: "Weigh, value and appraise stock so buying and selling decisions stay informed.", accent: "#c99a3a" },
  { id: "feed", icon: Warehouse, title: "Feed & inventory", body: "Stock levels, consumption and purchases ready to be planned per season.", accent: "#b98a3b" },
];

const STORY_POINTS = [
  { icon: PawPrint, text: "Track births, weights and lineage the moment they happen." },
  { icon: HeartPulse, text: "Never miss a delivery — expected dates computed from your breeds." },
  { icon: Syringe, text: "Know which doses are due today, and which herds are up to date." },
  { icon: ShieldCheck, text: "Role-based access keeps records safe for owners, managers and workers." },
];

const fontStack = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@300;400;500;600;700&display=swap');
* { font-family: 'Inter', sans-serif; }
.font-display { font-family: 'Fraunces', serif; }`;

/* ============================== SCENE CSS (A1) ============================== */
const landingStylesA1 = `
  html { scroll-behavior: smooth; }
  .lnd-skip { position: absolute; top: -60px; left: 8px; z-index: 120; color: #fff; background: rgba(20,46,30,.9); padding: .5rem 1rem; border-radius: .5rem; }
  .lnd-skip:focus { top: 8px; }
  [id] { scroll-margin-top: 92px; }

  .lnd { position: relative; overflow-x: clip; background: #101b14; }

  /* Preloader */
  .lnd-preloader { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.1rem; background: linear-gradient(165deg, #0d1d14, #17382a 45%, #1f3d2e 82%, #12261a); transition: opacity .55s ease, visibility .55s; }
  .lnd-preloader.hide { opacity: 0; visibility: hidden; pointer-events: none; }
  .lnd-preloader-anim { font-size: 2.6rem; line-height: 1; animation: lnd-preload-sway 1.4s ease-in-out infinite; filter: drop-shadow(0 0 14px rgba(226,195,88,.35)); }
  @keyframes lnd-preload-sway { 0%,100% { transform: rotate(-8deg) translateY(0); } 50% { transform: rotate(6deg) translateY(-6px); } }
  .lnd-preloader-title { color: #f4f1e6; font-family: 'Fraunces', serif; font-weight: 600; letter-spacing: .02em; }
  .lnd-preloader .lnd-preloader-bar { width: 190px; height: 3px; border-radius: 99px; overflow: hidden; background: rgba(244,241,230,.14); }
  .lnd-preloader .lnd-preloader-bar > i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #e3c55c, #f6e9b8); transition: width .12s linear; }

  /* Navigation (glass) */
  .lnd-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 80; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem 1.4rem .8rem 2rem; background: rgba(12,22,15,.62); backdrop-filter: blur(14px) saturate(1.35); border-bottom: 1px solid rgba(255,255,255,.09); }
  .lnd-nav-brand { display: inline-flex; align-items: center; gap: .55rem; color: #f4f1e6; font-family: 'Fraunces', serif; font-weight: 600; letter-spacing: .01em; }
  .lnd-nav-brand svg { color: #e3c55c; }
  .lnd-nav-links { display: flex; align-items: center; gap: 1.15rem; }
  .lnd-nav-links a { color: rgba(255,255,255,.82); text-decoration: none; font-size: .86rem; font-weight: 500; position: relative; padding: .2rem 0; transition: color .2s; }
  .lnd-nav-links a::after { content: ""; position: absolute; left: 0; right: 0; bottom: -4px; height: 2px; border-radius: 2px; background: #e3c55c; opacity: 0; transform: scaleX(0); transform-origin: left; transition: transform .25s ease, opacity .25s; }
  .lnd-nav-links a:hover { color: #fff; }
  .lnd-nav-links a:hover::after { opacity: 1; transform: scaleX(1); }
  .lnd-nav-link-dash { display: inline-flex; align-items: center; gap: .35rem; color: #fff; text-decoration: none; font-size: .84rem; font-weight: 600; padding: .45rem 1.05rem; border-radius: 99px; background: linear-gradient(180deg, #2f6a44, #1e4a30); box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 4px 12px rgba(20,46,30,.35); transition: transform .2s, box-shadow .2s; }
  .lnd-nav-link-dash:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(20,46,30,.5); }
  .lnd-nav-burger { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; color: #fff; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.16); }
  .lnd-nav-mobile { position: fixed; top: 62px; right: 1rem; z-index: 81; min-width: 220px; border-radius: 1rem; padding: .9rem 1.1rem; background: rgba(9,17,12,.72); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,.12); box-shadow: 0 14px 34px rgba(0,0,0,.35); display: none; }
  .lnd-nav-mobile.open { display: block; }
  .lnd-nav-mobile a { display: block; padding: .55rem .4rem; color: rgba(255,255,255,.9); text-decoration: none; font-size: .92rem; border-radius: .5rem; }
  .lnd-nav-mobile a:hover { background: rgba(255,255,255,.09); }
`;

/* ---------- SCENE CSS (A2): hero frame, fallback scene, video, rays, particles ---------- */
const landingStylesA2 = `
  .lnd-hero { position: relative; min-height: 100vh; height: 100vh; overflow: hidden; perspective: 1400px; perspective-origin: 50% 34%; --dp: 0; --fade: 0; --hint: 1; --mx: 0; --my: 0; background: linear-gradient(168deg, #102417 0%, #2c5c37 34%, #5e7a35 52%, #b98a3b 68%, #e4b45e 80%, #7a4a26 92%, #4a2c17 100%); }
  .lnd-hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(120% 90% at 30% 18%, rgba(255,226,164,.18), transparent 55%), radial-gradient(70% 60% at 74% 30%, rgba(255,240,210,.1), transparent 60%); }

  /* Fallback farm scene (behind the video) */
  .lnd-hero-fallback { position: absolute; inset: 0; pointer-events: none; }
  .lnd-hero-sun { position: absolute; right: 30%; top: 34%; width: 34vmax; height: 34vmax; border-radius: 50%; background: radial-gradient(circle, rgba(255,244,214,.95), rgba(255,214,140,.4) 30%, rgba(243,166,84,.18) 62%, transparent 78%); filter: drop-shadow(0 0 40px rgba(255,214,120,.35)); animation: lnd-sun-pulse 7s ease-in-out infinite; }
  @keyframes lnd-sun-pulse { 0%,100% { opacity: .92; } 50% { opacity: 1; } }
  .lnd-hero-hills { position: absolute; left: 0; right: 0; bottom: 0; pointer-events: none; }
  .lnd-hill-back { position: absolute; left: -6%; bottom: 0; width: 112%; height: 34%; background: linear-gradient(180deg, rgba(40,72,34,.55), rgba(30,52,30,.72)); clip-path: polygon(0 78%, 12% 46%, 26% 62%, 44% 32%, 60% 58%, 76% 24%, 100% 60%, 100% 78%, 0 78%); transform: translate3d(calc(var(--mx) * -8px), calc(var(--dp) * 22px), calc(var(--dp) * -340px)); }
  .lnd-hill-mid { position: absolute; left: -10%; bottom: -8%; width: 120%; height: 46%; background: linear-gradient(180deg, rgba(61,96,44,.78), rgba(43,70,34,.9)); clip-path: polygon(0 100%, 8% 62%, 24% 78%, 44% 40%, 56% 62%, 74% 30%, 94% 56%, 100% 80%, 100% 100%, 0 100%); transform: translate3d(calc(var(--mx) * -16px), calc(var(--dp) * 40px), calc(var(--dp) * -180px)); }
  .lnd-hero-ground { position: absolute; bottom: -18%; height: 62%; background: linear-gradient(180deg, rgba(52,79,37,.82), rgba(38,58,30,.96)); transform: translate3d(0, calc(var(--dp) * 70px), calc(var(--dp) * -80px)); }

  /* Background video */
  .lnd-hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none; filter: saturate(1.06); }
  .lnd-hero-video.hide-video { opacity: 0; }
  .lnd-hero-video-wrap::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(14,24,17,.25), rgba(14,24,17,.08) 40%, rgba(10,17,12,.42)); }

  /* Volumetric light rays */
  .lnd-hero-rays { position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; opacity: calc(0.55 - var(--dp) * 0.45); }
  .lnd-ray { position: absolute; inset: 0; background: linear-gradient(178deg, transparent 0%, rgba(255,205,130,.16) 22%, rgba(255,232,184,.05) 45%, transparent 60%); transform: rotate(var(--r)) translateX(calc(var(--mx) * -60px)); animation: lnd-ray-pulse 9s ease-in-out infinite; }
  @keyframes lnd-ray-pulse { 0%,100% { opacity: .8; } 50% { opacity: 1; } }

  /* Particles */
  .lnd-hero-particles { position: absolute; inset: 0; pointer-events: none; }
  .lnd-particle { position: absolute; width: var(--ps); height: var(--ps); border-radius: 50%; background: rgba(255,238,190,.8); box-shadow: 0 0 6px rgba(255,224,150,.55); opacity: var(--po); filter: blur(calc(var(--dp) * 1.4px)); transform: translate3d(0, calc(var(--dp) * var(--pf)), calc(var(--dp) * -180px)); animation: lnd-floaty var(--pd) ease-in-out infinite alternate; animation-delay: var(--pa); }
  @keyframes lnd-floaty { from { transform: translateY(0); } to { transform: translateY(calc(-1 * var(--pf) * 0.55)); } }
`;

/* ---------- SCENE CSS (A3): 3D animals, HUD cards, overlay scrim ---------- */
const landingStylesA3 = `
  .lnd-hero-animals { position: absolute; inset: 0; pointer-events: none; transform-style: preserve-3d; }
  .lnd-animal { position: absolute; left: var(--ax); top: var(--ay); transform-style: preserve-3d; z-index: 3; transform: translate3d(calc(var(--mx) * var(--pxs)), calc(var(--dp) * var(--pys)), calc(var(--dp) * var(--pz))) rotateY(calc(var(--mx) * var(--pr) * 70deg)) rotateX(calc(-1 * var(--dp) * 14deg)) scale(calc(1 + var(--dp) * var(--ps))); }
  .lnd-animal .lnd-animal-inner { animation: lnd-bob var(--ab) ease-in-out infinite; animation-delay: var(--apd); }
  .lnd-animal-badge { display: grid; place-items: center; width: var(--sz); height: var(--sz); border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(255,248,226,.95), rgba(220,196,138,.6) 55%, rgba(46,70,40,.35)); box-shadow: 0 14px 30px rgba(30,26,12,.35), inset 0 1px 0 rgba(255,255,255,.35); }
  .lnd-animal-emoji { font-size: calc(var(--sz) * 0.52); line-height: 1; }
  @keyframes lnd-bob { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-11px) rotate(var(--ts)); } }

  .lnd-hud { position: absolute; left: var(--hx); top: var(--hy); transform-style: preserve-3d; z-index: 3; transform: translate3d(calc(var(--mx) * var(--hpx)), calc(var(--dp) * var(--hpy)), calc(var(--dp) * var(--hz))) rotateZ(calc(var(--mx) * 3deg)); }
  .lnd-hud-inner { animation: lnd-bob var(--hb) ease-in-out infinite; animation-delay: var(--hpd); }
  .lnd-hud-card { display: flex; align-items: center; gap: .55rem; padding: .55rem .8rem; border-radius: .85rem; background: rgba(244,241,230,.14); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.22); box-shadow: 0 10px 22px rgba(10,17,12,.35); }
  .lnd-hud-icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: rgba(255,214,140,.22); color: #ffe6a8; }
  .lnd-hud-text { display: flex; flex-direction: column; min-width: 0; }
  .lnd-hud-text p:first-of-type { font-size: .76rem; font-weight: 600; color: rgba(255,255,255,.96); line-height: 1.15; }
  .lnd-hud-text p:last-of-type { font-size: .64rem; color: rgba(255,255,255,.74); }

  .lnd-hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8,14,9,.06), rgba(8,14,9,.3) 45%, rgba(6,11,8,.72) 74%, rgba(5,9,7,.94) 100%); opacity: var(--fade); }
  .lnd-scrim { position: absolute; inset: 0; background: radial-gradient(120% 100% at 50% 46%, transparent 30%, rgba(8,13,9,.5) 72%, rgba(6,11,8,.82) 100%); pointer-events: none; }
`;

/* ===================== SCENE CSS (B1): content & typography ===================== */
const landingStylesB1 = `
  .lnd-hero-content { position: absolute; inset: 0; z-index: 4; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 1rem; }
  .lnd-hero-kicker { display: inline-flex; align-items: center; gap: .45rem; color: rgba(255,244,216,.9); font-size: .78rem; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; padding: .4rem 1rem; border-radius: 99px; border: 1px solid rgba(255,255,255,.22); background: rgba(255,255,255,.08); backdrop-filter: blur(8px); }
  .lnd-hero-title { margin-top: 1.1rem; font-family: 'Fraunces', serif; font-weight: 600; font-size: clamp(2.4rem, 6.4vw, 5.2rem); line-height: 1.04; color: #fffdf7; text-shadow: 0 2px 26px rgba(10,18,12,.45), 0 1px 0 rgba(255,255,255,.22); }
  .lnd-hero-title .glow { background: linear-gradient(90deg, #fffdf7, #ffe6a8 55%, #fffdf7); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 18px rgba(255,226,150,.35)); }
  .lnd-hero-sub { margin-top: 1.15rem; max-width: 44rem; font-weight: 300; font-size: clamp(.98rem, 1.9vw, 1.3rem); line-height: 1.55; color: rgba(255,255,255,.88); text-shadow: 0 1px 12px rgba(10,18,12,.4); }

  .lnd-hero-cta { display: flex; align-items: center; gap: .9rem; margin-top: 1.7rem; }
  .lnd-cta-primary { display: inline-flex; align-items: center; gap: .55rem; color: #fff; text-decoration: none; font-weight: 600; font-size: .98rem; padding: .82rem 1.55rem; border-radius: .8rem; background: linear-gradient(180deg, #33744a, #1d4a30); box-shadow: 0 12px 34px rgba(16,38,26,.45), inset 0 1px 0 rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.14); transition: transform .22s ease, box-shadow .22s ease; }
  .lnd-cta-primary:hover { transform: translateY(-2px) translateZ(10px) scale(1.02); box-shadow: 0 20px 44px rgba(16,38,26,.6), inset 0 1px 0 rgba(255,255,255,.3); }
  .lnd-cta-secondary { display: inline-flex; align-items: center; gap: .55rem; color: #fff; text-decoration: none; font-weight: 500; font-size: .98rem; padding: .82rem 1.55rem; border-radius: .8rem; background: rgba(255,255,255,.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,.3); box-shadow: 0 8px 22px rgba(10,17,12,.3); transition: transform .22s ease, background .22s ease, box-shadow .22s ease; }
  .lnd-cta-secondary:hover { transform: translateY(-2px) translateZ(8px); background: rgba(255,255,255,.18); box-shadow: 0 14px 30px rgba(10,17,12,.45); }

  .lnd-hero-hint { position: absolute; left: 50%; bottom: 1.1rem; transform: translateX(-50%); z-index: 6; display: flex; flex-direction: column; align-items: center; gap: .35rem; color: rgba(255,255,255,.85); opacity: var(--hint); pointer-events: none; }
  .lnd-hero-hint span { font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; }
  .lnd-hero-hint .lnd-hint-mouse { font-size: 1.15rem; animation: lnd-hint-bob 1.4s ease-in-out infinite; }
  @keyframes lnd-hint-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }

  .lnd-section { position: relative; padding: 6.5rem 1.4rem 6.5rem; background: linear-gradient(180deg, #0c1610, #101e15 30%, #0e1b13 100%); }
  .lnd-container { max-width: 72rem; margin: 0 auto; }
  .lnd-eyebrow { display: inline-block; color: #e3c55c; font-size: .74rem; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; margin-bottom: 1.2rem; }
  .lnd-h2 { font-family: 'Fraunces', serif; color: #f4f1e6; font-weight: 600; font-size: clamp(1.7rem, 3.4vw, 2.6rem); line-height: 1.18; }
  .lnd-lede { color: rgba(240,238,226,.78); max-width: 46rem; font-size: 1.02rem; line-height: 1.7; margin-top: 1rem; }
  .lnd-sec { opacity: 0; transform: translateY(30px); transition: opacity .7s ease, transform .7s ease; }
  .lnd-sec.is-in { opacity: 1; transform: none; }
`;

/* ============ SCENE CSS (B2): cards, story, CTA band, footer, modal, responsive ============ */
const landingStylesB2 = `
  .lnd-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1.35rem; margin-top: 2.4rem; }
  .lnd-card { position: relative; display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem 1.35rem; border-radius: 1.15rem; background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
  .lnd-card:hover { transform: translateY(-4px); border-color: var(--ac); box-shadow: 0 16px 34px rgba(8,14,9,.4); }
  .lnd-card-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 1rem; background: color-mix(in srgb, var(--ac) 18%, transparent); color: var(--ac); box-shadow: 0 8px 18px rgba(6,11,8,.3); }
  .lnd-card h3 { font-family: 'Fraunces', serif; color: #f4f1e6; font-weight: 600; font-size: 1.12rem; }
  .lnd-card p { color: rgba(238,236,226,.7); font-size: .9rem; line-height: 1.6; }

  .lnd-story { display: grid; grid-template-columns: repeat(auto-fit, minmax(19rem, 1fr)); gap: 1.35rem; margin-top: 2.4rem; align-items: start; }
  .lnd-story-note { padding: 1.6rem 1.4rem; border-radius: 1.15rem; background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.1); }
  .lnd-story-note .lnd-quote { font-family: 'Fraunces', serif; font-size: 1.05rem; line-height: 1.65; color: rgba(244,241,230,.88); }
  .lnd-story-points ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: .9rem; }
  .lnd-story-points li { display: flex; align-items: flex-start; gap: .75rem; color: rgba(238,236,226,.8); font-size: .95rem; line-height: 1.55; }
  .lnd-story-points .dot { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; background: rgba(227,197,92,.16); color: #e3c55c; flex-shrink: 0; }

  .lnd-cta-band { min-height: 24rem; display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; gap: 1.4rem; padding: 6rem 1.4rem; background: radial-gradient(120% 130% at 50% 0%, rgba(227,197,92,.08), transparent 55%), linear-gradient(180deg, #0c1610, #0a130e); }
  .lnd-cta-band .lnd-h2 { text-align: center; }
  .lnd-cta-band p { color: rgba(240,238,226,.72); max-width: 40rem; font-size: 1rem; line-height: 1.7; }

  .lnd-footer { padding: 2.4rem 1.4rem; display: flex; flex-direction: column; gap: 1rem; align-items: center; background: #0a130e; }
  .lnd-footer nav { display: flex; gap: 1.2rem; }
  .lnd-footer nav a { color: rgba(240,238,226,.66); text-decoration: none; font-size: .82rem; }
  .lnd-footer nav a:hover { color: #f4f1e6; }
  .lnd-footer small { color: rgba(240,238,226,.5); font-size: .74rem; }

  .lnd-demo { position: fixed; inset: 0; z-index: 190; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.2rem; background: rgba(7,12,9,.88); backdrop-filter: blur(22px); transition: opacity .3s ease; }
  .lnd-demo.hide { opacity: 0; visibility: hidden; pointer-events: none; }
  .lnd-demo video { max-width: min(64rem, 92vw); max-height: 74vh; border-radius: 1.15rem; border: 1px solid rgba(255,255,255,.2); box-shadow: 0 26px 60px rgba(0,0,0,.5); }
  .lnd-demo-close { position: absolute; top: 1.2rem; right: 1.2rem; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.1); color: #fff; }
  .lnd-demo-caption { color: rgba(252,250,244,.8); font-size: .9rem; letter-spacing: .04em; }

  @media (max-width: 900px) {
    .lnd-nav-links { display: none; }
    .lnd-nav-link-dash { display: none; }
    .lnd-nav-burger { display: flex; }
    .lnd-hero-content { padding: 4.5rem 1rem 0; }
    .lnd-hero-title { font-size: clamp(1.9rem, 7.5vw, 2.9rem); }
    .lnd-hud { transform: translate3d(calc(var(--mx) * var(--hpx) * .5), calc(var(--dp) * var(--hpy) * .6), 0) scale(.86); }
    .lnd-animal { transform: translate3d(calc(var(--mx) * var(--pxs) * .45), calc(var(--dp) * var(--pys) * .8), 0) scale(.82); }
  }
  @media (max-width: 560px) {
    .lnd-section { padding: 4.5rem 1.1rem 4.5rem; }
    .lnd-hero-cta { flex-direction: column; width: 100%; }
    .lnd-cta-primary, .lnd-cta-secondary { width: 100%; justify-content: center; }
  }
`;

/* ==================== Reduced motion: disable 3D / parallax / heavy anim ==================== */
const landingReducedMotion = `
  .lnd-rm .lnd-hero-video, .lnd-rm .lnd-hill-back, .lnd-rm .lnd-hill-mid, .lnd-rm .lnd-hero-ground, .lnd-rm .lnd-animal, .lnd-rm .lnd-hud, .lnd-rm .lnd-ray, .lnd-rm .lnd-particle, .lnd-rm .lnd-hero-overlay { transition: all .6s ease; transform: none; animation: none; }
  .lnd-rm .lnd-hero { --dp: 0.6; --fade: 0.75; --hint: 0; }
  .lnd-rm .lnd-sec { opacity: 1; transform: none; }
  .lnd-rm .lnd-preloader-anim { animation: none; }
`;

/* ============================================================ */
/*  Preloader — farm-themed silhouette + progress                */
/* ============================================================ */
function Preloader({ hide }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || hide) return;
    const bar = ref.current.querySelector("i");
    if (bar && typeof bar.animate === "function") {
      bar.animate(
        [{ width: "0%" }, { width: "100%" }],
        { duration: 950, easing: "ease-in-out", fill: "forwards" }
      );
    }
  }, [hide]);
  return (
    <div ref={ref} className={`lnd-preloader ${hide ? "hide" : ""}`} role="status" aria-label="Loading the farm">
      <span className="lnd-preloader-anim" aria-hidden="true">🐄</span>
      <span className="lnd-preloader-title">Herdwell</span>
      <span className="lnd-preloader-bar"><i /></span>
    </div>
  );
}

/* ============================================================ */
/*  Glassmorphism navbar                                         */
/* ============================================================ */
function LandingNav({ loggedIn }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <nav className="lnd-nav" aria-label="Main">
        <Link to="/" className="lnd-nav-brand" onClick={close} aria-label="Herdwell home">
          <Sprout size={20} strokeWidth={2.2} />
          <span className="font-display">Herdwell</span>
        </Link>
        <div className="lnd-nav-links">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>{l.label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to={loggedIn ? "/dashboard" : "/login"} className="lnd-nav-link-dash" onClick={close}>
            Dashboard <ArrowRight size={14} />
          </Link>
          <button
            type="button"
            className="lnd-nav-burger"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            <Menu size={19} />
          </button>
        </div>
      </nav>
      <div className={`lnd-nav-mobile ${open ? "open" : ""}`} role="menu">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={close} role="menuitem">{l.label}</a>
        ))}
        <Link to={loggedIn ? "/dashboard" : "/login"} onClick={close} role="menuitem">Dashboard</Link>
      </div>
    </>
  );
}

/* ============================================================ */
/*  HeroScene — layered 3D scene driven by scroll + pointer      */
/* ============================================================ */
function HeroScene({ loggedIn, onDemo }) {
  const sceneRef = useRef(null);
  const videoRef = useRef(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const rm = useRef(prefersReducedMotion());

  /* rAF scroll engine — mutates CSS custom props, no re-renders. */
  useEffect(() => {
    const hero = sceneRef.current;
    if (!hero || rm.current) return;
    let raf = null;

    const apply = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / Math.max(1, hero.offsetHeight)));
      const dp = 1 - Math.pow(1 - p, 3); // easeOutCubic — organic deceleration
      hero.style.setProperty("--dp", dp.toFixed(4));
      hero.style.setProperty("--fade", Math.max(0, Math.min(1, (p - 0.42) * 3.4)).toFixed(4));
      hero.style.setProperty("--hint", Math.max(0, 1 - p * 7).toFixed(4));
      raf = null;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const onResize = () => { if (!raf) raf = requestAnimationFrame(apply); };
    const onMove = (e) => {
      if (e.pointerType === "touch") return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX / window.innerWidth) - 0.5).toFixed(4));
      hero.style.setProperty("--my", (((e.clientY - rect.top) / Math.max(1, rect.height)) - 0.5).toFixed(4));
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  /* Attempt autoplay; if every source fails the CSS scene takes over. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => v.play().catch(() => {});
    if (v.readyState >= 1) tryPlay();
    v.addEventListener("canplay", tryPlay);
    return () => v.removeEventListener("canplay", tryPlay);
  }, []);

  return (
    <section ref={sceneRef} className="lnd-hero" aria-label="Farm at golden hour">
      {/* Fallback golden-hour scene (always behind the video) */}
      <div className="lnd-hero-fallback" aria-hidden="true">
        <div className="lnd-hero-sun" />
        <div className="lnd-hero-hills">
          <div className="lnd-hill-back" />
          <div className="lnd-hill-mid" />
        </div>
        <div className="lnd-hero-ground" />
      </div>

      {/* Background video — seamless, muted, looping */}
      <div className="lnd-hero-video-wrap" aria-hidden="true">
        <video
          ref={videoRef}
          className={`lnd-hero-video ${videoFailed ? "hide-video" : ""}`}
          autoPlay
          muted
          loop
          playsInline
          poster={FARM_VIDEO_POSTER}
          preload="metadata"
          disablePictureInPicture
          onError={() => setVideoFailed(true)}
        >
          {FARM_VIDEO_SOURCES.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      </div>

      {/* Volumetric light rays (scroll-faded) */}
      <div className="lnd-hero-rays" aria-hidden="true">
        {["-14deg", "8deg", "22deg", "36deg"].map((r, i) => (
          <div key={i} className="lnd-ray" style={{ "--r": r, animationDelay: `${(i % 3) * 2.2}s` }} />
        ))}
      </div>

      {/* Floating pollen / dust particles */}
      <div className="lnd-hero-particles" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="lnd-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              "--ps": `${p.size}px`,
              "--po": p.o,
              "--pf": `${Math.round(p.depth * 90)}px`,
              "--pd": `${p.dur}s`,
              "--pa": `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Fade-to-dark overlay + readability scrim */}
      <div className="lnd-hero-overlay" style={{ opacity: "var(--fade)" }} />
      <div className="lnd-scrim" aria-hidden="true" />

      {/* Headline + CTAs + scroll hint */}
      <div className="lnd-hero-content">
        <span className="lnd-hero-kicker" role="text">
          <Sprout size={14} strokeWidth={2.2} /> Modern Animal Farm Management
        </span>
        <h1 className="lnd-hero-title">
          Your Farm. <span className="glow">Fully Connected.</span>
        </h1>
        <p className="lnd-hero-sub">
          Real-time animal tracking · Breeding · Health · Inventory — all in one
          intelligent system.
        </p>
        <div className="lnd-hero-cta">
          <Link to={loggedIn ? "/dashboard" : "/login"} className="lnd-cta-primary">
            {loggedIn ? "Open Dashboard" : "Enter the Farm"} <ArrowRight size={17} />
          </Link>
          {/* <a
            href="#demo"
            role="button"
            className="lnd-cta-secondary"
            onClick={(e) => { e.preventDefault(); onDemo(); }}
          >
            <Play size={16} /> Watch Demo
          </a> */}
        </div>
      </div>

      <div className="lnd-hero-hint" aria-hidden="true">
        <ChevronDown size={15} />
        <span>Scroll</span>
      </div>
    </section>
  );
}

/* ============================================================ */
/*  Demo modal — plays a short farm overview                      */
/* ============================================================ */
function DemoModal({ open, onClose }) {
  const closeRef = useRef(open);
  closeRef.current = open;

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }
    return undefined;
  }, [open, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Farm overview demo"
      className={`lnd-demo ${open ? "" : "hide"}`}
      onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}
    >
      <button type="button" className="lnd-demo-close" onClick={onClose} aria-label="Close demo">
        <X size={20} />
      </button>
      <video
        key={open ? "on" : "off"}
        className="lnd-demo-video"
        controls
        autoPlay
        muted
        loop
        preload="metadata"
      >
        {FARM_VIDEO_SOURCES.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
      </video>
      <span className="lnd-demo-caption">A few quiet minutes on the farm — your data lives here.</span>
    </div>
  );
}

/* ============================================================ */
/*  Scroll-reveal helper + landing sections                      */
/* ============================================================ */
function SectionReveal({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) { if (el) el.classList.add("is-in"); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className="lnd-sec">{children}</div>;
}

function CapabilitySection() {
  return (
    <section className="lnd-section" id="capabilities">
      <div className="lnd-container">
        <SectionReveal>
          <span className="lnd-eyebrow">Capabilities</span>
          <h2 className="lnd-h2">One system. Every corner of the farm.</h2>
          <p className="lnd-lede">
            Behind every healthy herd is good bookkeeping. Herdwell brings it all
            together — from the first tag to the final sale.
          </p>
          <div className="lnd-cards">
            {CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <article key={c.id} id={c.id} className="lnd-card" style={{ "--ac": c.accent }}>
                  <span className="lnd-card-icon"><Icon size={22} strokeWidth={2.1} /></span>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </article>
              );
            })}
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

function StorySection() {
  return (
    <section className="lnd-section" id="story">
      <div className="lnd-container">
        <SectionReveal>
          <span className="lnd-eyebrow">Why Herdwell</span>
          <h2 className="lnd-h2">Built for the golden hour.</h2>
          <div className="lnd-story">
            <div className="lnd-story-note">
              <p className="lnd-quote">
                “A farm runs on rhythm — calving season, vaccination windows,
                market days. Herdwell keeps that rhythm in one calm, connected
                place.”
              </p>
            </div>
            <div className="lnd-story-points">
              <ul>
                {STORY_POINTS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.text}>
                      <span className="dot"><Icon size={14} strokeWidth={2.1} /></span>
                      <span>{s.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

function CallToAction({ loggedIn }) {
  return (
    <section className="lnd-cta-band">
      <SectionReveal>
        <h2 className="lnd-h2">Ready to run your farm from anywhere?</h2>
        <p>
          Real-time animal tracking · Breeding · Health · Inventory — all in one
          intelligent system.
        </p>
        <div className="lnd-hero-cta">
          <Link to={loggedIn ? "/dashboard" : "/login"} className="lnd-cta-primary">
            {loggedIn ? "Open Dashboard" : "Enter the Farm"} <ArrowRight size={17} />
          </Link>
        </div>
      </SectionReveal>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="lnd-footer">
      <Link to="/" className="lnd-nav-brand">
        <Sprout size={18} strokeWidth={2.2} />
        <span className="font-display">Herdwell</span>
      </Link>
      <nav aria-label="Footer">
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href}>{l.label}</a>
        ))}
        <Link to="/login">Log in</Link>
      </nav>
      <small>© {new Date().getFullYear()} Herdwell Farm Systems.</small>
    </footer>
  );
}

/* ============================================================ */
/*  LandingHero — public page component                          */
/* ============================================================ */
function LandingHero() {
  const { user } = useAuth();
  const loggedIn = !!user;
  const rm = prefersReducedMotion();

  const [preloaded, setPreloaded] = useState(rm);
  const [demoOpen, setDemoOpen] = useState(false);

  /* Farm-themed preloader — fades out shortly after first paint. */
  useEffect(() => {
    if (rm) { setPreloaded(true); return undefined; }
    const t = setTimeout(() => setPreloaded(true), 1250);
    return () => clearTimeout(t);
  }, [rm]);

  return (
    <div className={`lnd ${rm ? "lnd-rm" : ""}`}>
      <style>{fontStack}</style>
      <style>{landingStylesA1}</style>
      <style>{landingStylesA2}</style>
      <style>{landingStylesA3}</style>
      <style>{landingStylesB1}</style>
      <style>{landingStylesB2}</style>
      {rm && <style>{landingReducedMotion}</style>}

      <a href="#capabilities" className="lnd-skip">Skip to content</a>
      <Preloader hide={preloaded} />
      <LandingNav loggedIn={loggedIn} />
      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} />

      <main>
        <HeroScene loggedIn={loggedIn} onDemo={() => setDemoOpen(true)} />
        <CapabilitySection />
        <StorySection />
        <CallToAction loggedIn={loggedIn} />
      </main>

      <LandingFooter />
    </div>
  );
}

export default LandingHero;