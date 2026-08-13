import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./App.css";
import { BRIDE_IMG, GROOM_IMG, COUPLE_IMG } from "./images";
import { LANGS, translations, detectLang, saveLang } from "./i18n";

// ── Countdown ─────────────────────────────────────────────────────────────────
function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  });
  return time;
}

// ── Scroll fade-in with direction ─────────────────────────────────────────────
function useFadeIn(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ── Scroll blur reveal hook ───────────────────────────────────────────────────
function useIsScrolling(idleDelay = 500) {
  const [scrolling, setScrolling] = useState(false);
  useEffect(() => {
    let timeoutId;
    const handler = () => {
      setScrolling(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setScrolling(false), idleDelay);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      clearTimeout(timeoutId);
    };
  }, [idleDelay]);
  return scrolling;
}

function useScrollBlur() {
  const ref = useRef(null);
  const [blur, setBlur] = useState(20);
  useEffect(() => {
    const handler = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const distFromCenter = Math.abs(vh / 2 - center);
      const maxDist = vh / 2 + rect.height / 2;
      const ratio = Math.min(distFromCenter / maxDist, 1);
      setBlur(ratio * 20);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return [ref, blur];
}

// ── Parallax scroll hook ──────────────────────────────────────────────────────
function useParallax(speed = 0.3) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handler = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      setOffset((window.innerHeight / 2 - center) * speed);
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [speed]);
  return [ref, offset];
}

// ── Background music player ───────────────────────────────────────────────────
function BackgroundMusic({ play, fading }) {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (play && audioRef.current && !started) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().then(() => setStarted(true)).catch(() => {});
    }
  }, [play, started]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (muted) {
      audioRef.current.volume = 0.3;
      audioRef.current.muted = false;
    } else {
      audioRef.current.muted = true;
    }
    setMuted(!muted);
  };

  return (
    <>
      <audio ref={audioRef} src="/assets/nathaswaram.mp3" loop preload="auto" />
      {started && (
        <button
          className={`music-toggle ${fading ? "fixed-overlay-fade" : ""}`}
          onClick={toggle}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          )}
          <div className={`music-bars ${muted ? "paused" : ""}`}>
            <span /><span /><span /><span />
          </div>
        </button>
      )}
    </>
  );
}

// ── Language switcher ─────────────────────────────────────────────────────────
function LanguageSwitcher({ lang, onChange, fading }) {
  return (
    <div
      className={`lang-switcher ${fading ? "fixed-overlay-fade" : ""}`}
      role="group"
      aria-label="Language"
    >
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          className={`lang-btn ${lang === code ? "lang-btn-active" : ""}`}
          onClick={() => onChange(code)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Floating particles ────────────────────────────────────────────────────────
function FloatingParticles() {
  const items = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 12}s`,
        duration: `${8 + Math.random() * 10}s`,
        size: `${3 + Math.random() * 6}px`,
        type: i % 5 === 0 ? "sparkle" : i % 3 === 0 ? "petal-gold" : "petal",
        opacity: 0.3 + Math.random() * 0.5,
        sway: `${-30 + Math.random() * 60}px`,
      })),
    []
  );
  return (
    <div className="particles-container" aria-hidden="true">
      {items.map((p) => (
        <div
          key={p.id}
          className={`particle particle-${p.type}`}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            "--sway": p.sway,
            "--particle-opacity": p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// ── Animated gold divider ─────────────────────────────────────────────────────
function GoldDivider({ symbol = "✿", animated = true }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} className={`gold-divider ${animated && visible ? "divider-animate" : ""}`}>
      <span className="divider-line" />
      <span className="divider-symbol">{symbol}</span>
      <span className="divider-line" />
    </div>
  );
}

// ── Fade section with direction ───────────────────────────────────────────────
function FadeSection({ className = "", direction = "up", children, delay = 0 }) {
  const [ref, visible] = useFadeIn();
  return (
    <section
      ref={ref}
      className={`fade-section fade-${direction} ${visible ? "visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

// ── Stagger children animation ────────────────────────────────────────────────
function StaggerReveal({ children, className = "" }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} className={`stagger-wrap ${visible ? "stagger-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ── Shimmer text ──────────────────────────────────────────────────────────────
function ShimmerText({ children, className = "" }) {
  return <span className={`shimmer-text ${className}`}>{children}</span>;
}

// ── Ornamental corner frame ───────────────────────────────────────────────────
function OrnamentFrame({ children, className = "" }) {
  return (
    <div className={`ornament-frame ${className}`}>
      <span className="ornament-corner oc-tl" />
      <span className="ornament-corner oc-tr" />
      <span className="ornament-corner oc-bl" />
      <span className="ornament-corner oc-br" />
      {children}
    </div>
  );
}

// ── Intro animation ───────────────────────────────────────────────────────────
// Phases: 'enter' → 'slide' → 'merge' → 'burst' → 'done' (auto 5s total)
function IntroAnimation({ onDone, t }) {
  const [phase, setPhase] = useState("enter");

  useEffect(() => {
    const t0 = setTimeout(() => setPhase("slide"), 400);
    const t1 = setTimeout(() => setPhase("merge"), 2000);
    const t2 = setTimeout(() => setPhase("burst"), 3200);
    const t3 = setTimeout(() => setPhase("done"), 4400);
    const t4 = setTimeout(onDone, 5000);
    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout);
  }, [onDone]);

  const isSlide = phase !== "enter";
  const isBurst = phase === "burst" || phase === "done";
  const isOut = phase === "done";

  return (
    <div className={`intro-overlay ${isOut ? "intro-out" : ""}`}>
      {/* Golden light sweep */}
      <div className="intro-light-sweep" />

      {/* Animated background particles */}
      <div className="intro-bg-particles" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="intro-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Top decorative text */}
      <div className={`intro-top-text ${isSlide ? "intro-top-visible" : ""}`}>
        <span className="intro-save-date">{t.introSaveDate}</span>
        <span className="intro-date-line">23 · 08 · 2026</span>
      </div>

      {/* Sparks on burst */}
      {isBurst &&
        Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="spark" style={{ "--i": i }} aria-hidden="true" />
        ))}

      {/* Gold burst rings */}
      {isBurst && (
        <>
          <div className="burst-ring ring-1" />
          <div className="burst-ring ring-2" />
          <div className="burst-ring ring-3" />
          <div className="burst-ring ring-4" />
        </>
      )}

      {/* Bride */}
      <div className={`intro-figure intro-bride ${isSlide ? "intro-slide-in" : ""}`}>
        <img src={BRIDE_IMG} alt={t.altBride} />
        <div className="intro-figure-glow" />
      </div>

      {/* Groom */}
      <div className={`intro-figure intro-groom ${isSlide ? "intro-slide-in" : ""}`}>
        <img src={GROOM_IMG} alt={t.altGroom} />
        <div className="intro-figure-glow" />
      </div>

      {/* Names on burst */}
      {isBurst && (
        <div className="intro-names-label">
          <div className="intro-name-line intro-name-line-left" />
          <span className="intro-name-reveal">{t.groomName}</span>
          <span className="intro-amp">&amp;</span>
          <span className="intro-name-reveal">{t.brideName}</span>
          <div className="intro-name-line intro-name-line-right" />
        </div>
      )}

      {/* Bottom decorative text */}
      {isBurst && (
        <div className="intro-bottom-text">
          <span>{t.introBottom}</span>
        </div>
      )}

      {/* Progress bar */}
      <div className="intro-progress">
        <div className="intro-progress-bar" />
      </div>
    </div>
  );
}

// ── Countdown box ─────────────────────────────────────────────────────────────
function CountdownBox({ label, value }) {
  const [flip, setFlip] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 400);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={`countdown-box ${flip ? "countdown-flip" : ""}`}>
      <span className="countdown-value">{String(value).padStart(2, "0")}</span>
      <span className="countdown-label">{label}</span>
      <div className="countdown-glow" />
    </div>
  );
}

// ── Scroll indicator ──────────────────────────────────────────────────────────
function ScrollIndicator({ t }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY < 100);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  if (!visible) return null;
  return (
    <div className="scroll-indicator">
      <div className="scroll-mouse">
        <div className="scroll-wheel" />
      </div>
      <span>{t.scrollDown}</span>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const isScrolling = useIsScrolling();
  const [heroRef, heroOffset] = useParallax(0.15);
  const [coupleBlurRef, coupleBlur] = useScrollBlur();
  const [lang, setLang] = useState(detectLang);
  const t = translations[lang];

  const changeLang = useCallback((code) => {
    setLang(code);
    saveLang(code);
  }, []);

  useEffect(() => {
    document.title = t.metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t.metaDescription);
  }, [t]);

  const THALI_DATE = "2026-08-23T09:47:00+05:30";
  const { days, hours, minutes, seconds } = useCountdown(THALI_DATE);

  const handleDone = useCallback(() => setShowIntro(false), []);

  return (
    <>
      {showIntro && <IntroAnimation onDone={handleDone} t={t} />}

      <LanguageSwitcher lang={lang} onChange={changeLang} fading={isScrolling} />

      <BackgroundMusic play={!showIntro} fading={isScrolling} />

      <div className={`invitation ${showIntro ? "invitation-hidden" : ""}`}>
        <FloatingParticles />
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />

        {/* ── Couple blurred background (fixed) ── */}
        <div
          className="couple-bg-fixed"
          style={{
            backgroundImage: `url(${COUPLE_IMG})`,
            filter: `blur(${coupleBlur}px)`,
            opacity: Math.max(0.08, 0.35 - coupleBlur * 0.013),
          }}
        />

        {/* ── Hero ── */}
        <header className="hero" ref={heroRef}>
          <div className="hero-bg-pattern" />
          <div className="hero-content" style={{ transform: `translateY(${heroOffset}px)` }}>
            <div className="hero-border" />
            <p className="hero-om">🕉</p>
            <p className="hero-sivamayam">
              <ShimmerText>{t.sivamayam}</ShimmerText>
            </p>
            <p className="hero-subtitle">{t.subtitle}</p>

            <div className="hero-names">
              <div className="hero-name-block">
                <span className="hero-name-ta animate-text-glow">{t.groomName}</span>
              </div>
              <span className="hero-ampersand animated-amp">&amp;</span>
              <div className="hero-name-block">
                <span className="hero-name-ta animate-text-glow">{t.brideName}</span>
              </div>
            </div>

            <GoldDivider symbol="💍" />

            <StaggerReveal>
              <p className="hero-date-ta stagger-child">{t.dateShort}</p>
              <p className="hero-venue-short stagger-child">{t.venueShort}</p>
            </StaggerReveal>
            <div className="hero-border" style={{ marginTop: 28 }} />
          </div>
          <ScrollIndicator t={t} />
        </header>

        {/* ── Poem ── */}
        <FadeSection className="poem-section" direction="up">
          <GoldDivider />
          <OrnamentFrame>
            <div className="poem-body">
              {t.poem.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </OrnamentFrame>
          <GoldDivider />
        </FadeSection>

        {/* ── Parents ── */}
        <FadeSection className="parents-section" direction="up">
          <h2 className="section-heading">
            <ShimmerText>{t.familyHeading}</ShimmerText>
          </h2>
          <div className="parents-grid">
            <div className="parent-card glass-card">
              <div className="card-shine" />
              <p className="parent-role">{t.groomParentsRole}</p>
              <p className="parent-names">{t.groomParentsNames}</p>
              <p className="parent-child-label">{t.groomChildLabel}</p>
            </div>

            <div className="parent-divider-v">
              <span />
              <span className="parent-divider-symbol">✿</span>
              <span />
            </div>

            <div className="parent-card glass-card">
              <div className="card-shine" />
              <p className="parent-role">{t.brideParentsRole}</p>
              <p className="parent-names">{t.brideParentsNames}</p>
              <p className="parent-child-label">{t.brideChildLabel}</p>
            </div>
          </div>
        </FadeSection>

        {/* ── Portraits ── */}
        <FadeSection className="portraits" direction="up">
          <div className="portrait-card portrait-groom">
            <div className="portrait-frame frame-groom">
              <img src={GROOM_IMG} alt={t.altGroom} />
              <div className="portrait-shimmer" />
            </div>
            <p className="portrait-name-ta">{t.groomName}</p>
            <p className="portrait-parents">{t.groomParentsShort}</p>
          </div>

          <div className="portrait-heart">
            <span>❤</span>
            <div className="heart-rings">
              <span className="heart-ring hr-1" />
              <span className="heart-ring hr-2" />
            </div>
          </div>

          <div className="portrait-card portrait-bride">
            <div className="portrait-frame frame-bride">
              <img src={BRIDE_IMG} alt={t.altBride} />
              <div className="portrait-shimmer" />
            </div>
            <p className="portrait-name-ta">{t.brideName}</p>
            <p className="portrait-parents">{t.brideParentsShort}</p>
          </div>
        </FadeSection>

        {/* ── Couple photo ── */}
        <FadeSection className="couple-section" direction="up">
          <GoldDivider symbol="🌸" />
          <div className="couple-reveal-wrapper" ref={coupleBlurRef}>
            <div
              className="couple-frame"
              style={{ filter: `blur(${coupleBlur}px)`, transform: `scale(${1 + coupleBlur * 0.005})` }}
            >
              <img src={COUPLE_IMG} alt={t.altCouple} />
              <div className="couple-glow" />
            </div>
            <div className="couple-reveal-overlay" style={{ opacity: coupleBlur * 0.03 }}>
              <span className="couple-reveal-text">{t.groomName} ❤ {t.brideName}</span>
            </div>
          </div>
          <GoldDivider symbol="🌸" />
        </FadeSection>

        {/* ── Venue & Times ── */}
        <FadeSection className="events-section" direction="up">
          <h2 className="section-heading">
            <ShimmerText>{t.eventsHeading}</ShimmerText>
          </h2>

          <div className="events-grid">
            <div className="event-card glass-card">
              <div className="card-shine" />
              <span className="event-icon">🛕</span>
              <h3 className="event-title-ta">{t.ceremonyTitle}</h3>
              <div className="event-times">
                <div className="event-time-row">
                  <span className="time-label">🪬 {t.ceremonyTimeLabel}</span>
                  <span className="time-value">{t.ceremonyTime}</span>
                </div>
              </div>
              <p className="event-venue-ta">{t.ceremonyVenueName}</p>
              <p className="event-address">{t.ceremonyVenueAddress}</p>
              <a
                href="https://maps.app.goo.gl/MSCyQnqJTUPRnhsU6"
                target="_blank"
                rel="noopener noreferrer"
                className="map-btn"
              >
                📍 {t.mapBtn}
              </a>
            </div>

            <div className="event-card glass-card">
              <div className="card-shine" />
              <span className="event-icon">🍽️</span>
              <h3 className="event-title-ta">{t.receptionTitle}</h3>
              <div className="event-times">
                <div className="event-time-row">
                  <span className="time-label">🍽️ {t.receptionTimeLabel}</span>
                  <span className="time-value">{t.receptionTime}</span>
                </div>
              </div>
              <p className="event-venue-ta">{t.receptionVenueName}</p>
              <p className="event-address">{t.receptionVenueAddress}</p>
              <a
                href="https://maps.app.goo.gl/2yn62AFT8wXvYb2n8"
                target="_blank"
                rel="noopener noreferrer"
                className="map-btn"
              >
                📍 {t.mapBtn}
              </a>
            </div>
          </div>
        </FadeSection>

        {/* ── Countdown ── */}
        <FadeSection className="countdown-section" direction="up">
          <h2 className="section-heading">
            <ShimmerText>{t.countdownHeading}</ShimmerText>
          </h2>
          <p className="countdown-sub">{t.countdownSub}</p>
          <div className="countdown-row">
            <CountdownBox label={t.countdownLabels.days} value={days} />
            <span className="countdown-separator">:</span>
            <CountdownBox label={t.countdownLabels.hours} value={hours} />
            <span className="countdown-separator">:</span>
            <CountdownBox label={t.countdownLabels.minutes} value={minutes} />
            <span className="countdown-separator">:</span>
            <CountdownBox label={t.countdownLabels.seconds} value={seconds} />
          </div>
        </FadeSection>

        {/* ── Blessing ── */}
        <FadeSection className="blessing-section" direction="up">
          <OrnamentFrame className="blessing-frame">
            <p className="blessing-text">
              {t.blessing.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < t.blessing.length - 1 && <br />}
                </span>
              ))}
            </p>
          </OrnamentFrame>
        </FadeSection>

        {/* ── Footer ── */}
        <footer className="invitation-footer">
          <GoldDivider />
          <p className="footer-names">
            <ShimmerText>{t.groomName} &amp; {t.brideName}</ShimmerText>
          </p>
          <p className="footer-date">{t.footerDate}</p>
          <p className="footer-family">{t.footerFamily}</p>
          <p className="footer-bless">{t.footerBless}</p>
          <GoldDivider />
          <div className="footer-mandala" />
        </footer>
      </div>
    </>
  );
}
