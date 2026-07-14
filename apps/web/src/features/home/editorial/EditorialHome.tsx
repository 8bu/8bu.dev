import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  projectsForGallery,
  essaysForGallery,
  resumeForGallery,
} from "@/features/artifacts-index/data";
import { STACK_GROUPS } from "@/features/home/stack";
import { useReveal, useAskShortcuts } from "./hooks";

const YEAR = new Date().getFullYear();

/** The prototype's pixel 8BU mark: red block + white glyphs + blinking caret. */
function NavLogo() {
  return (
    <svg viewBox="0 0 70 24" height={20} width={58} role="img" aria-label="8BU">
      <rect x="0" y="0" width="70" height="24" fill="#DB3A12" />
      <path
        fill="#ffffff"
        d="M16 18L6 18L6 16L4 16L4 12L6 12L6 10L4 10L4 6L6 6L6 4L14 4L14 6L16 6L16 10L14 10L14 12L18 12L18 16L16 16L16 18ZM10 8L10 10L14 10L14 6L8 6L8 8L10 8ZM6 12L6 16L14 16L14 14L10 14L10 12L6 12ZM32 18L20 18L20 4L32 4L32 6L34 6L34 10L32 10L32 12L34 12L34 16L32 16L32 18ZM24 6L24 10L30 10L30 6L24 6ZM24 12L24 16L30 16L30 12L24 12ZM48 18L38 18L38 16L36 16L36 4L40 4L40 16L46 16L46 4L50 4L50 16L48 16L48 18Z"
      />
      <path
        d="M66 20L52 20L52 18L66 18L66 20Z"
        fill="#ffffff"
        style={{ animation: "ed-blink 1.1s step-end infinite" }}
      />
    </svg>
  );
}

function Nav() {
  return (
    <nav className="ed-nav">
      <a className="ed-nav__logo" href="#top" aria-label="8bu.dev home">
        <NavLogo />
      </a>
      <div className="ed-nav__links">
        <a className="ed-nav__anchor" href="#work">
          WORK
        </a>
        <a className="ed-nav__anchor" href="#about">
          ABOUT
        </a>
        <a className="ed-nav__anchor" href="#writing">
          WRITING
        </a>
        <Link to="/chat" className="ed-ask-btn">
          ASK <span className="slash">/</span>
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section id="top" className="ed-hero">
      <div className="ed-hero__wash" />
      <div className="ed-hero__blob" />
      <div className="ed-hero__body">
        <div className="ed-hero__rail">
          <span>SOFTWARE ENGINEER — HCMC, VIET NAM</span>
        </div>
        <div className="ed-hero__content">
          <div className="ed-hero__mobiletag">SOFTWARE ENGINEER — HCMC, VIET NAM</div>
          <div className="ed-hero__names">
            <div className="ed-hero-name ed-hero-name--1" data-text="Long">
              Long
            </div>
            <div className="ed-hero-name ed-hero-name--2" data-text="NGUYỄN">
              NGUYỄN
            </div>
          </div>
          <div className="ed-hero__cta">
            <div className="ed-hero__lede">
              10 yrs shipping production web/apps with product-minded teams.
            </div>
            <a className="ed-hero__jump" href="#work">
              Selected work No.01–06 ↓
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Styled placeholder for a work/portrait shot — no external image (QD). */
function ShotPlaceholder({ badge }: { badge?: string }) {
  return (
    <>
      <div className="ed-work-shot__grid" />
      {badge ? <div className="ed-work-shot__badge">{badge}</div> : null}
    </>
  );
}

function SelectedWork() {
  const works = projectsForGallery();
  return (
    <section id="work" className="ed-section">
      <div className="ed-section-head" data-reveal>
        <h2>Selected Work</h2>
        <span className="ed-section-head__meta">
          No.01 — {String(works.length).padStart(2, "0")} · SAAS · DEFI · SDK
        </span>
      </div>

      {works.map((w, i) => {
        const no = String(i + 1).padStart(2, "0");
        return (
          <Link key={w.slug} to={w.href} className="ed-work-row" data-reveal>
            <div className="ed-work-cols">
              <span className="ed-work__no">No.{no}</span>
              <span className="ed-work__name">{w.name}</span>
              <span className="ed-work__desc">{w.desc}</span>
              <span className="ed-work__meta">{w.tags} ↗</span>
            </div>
            <div className="ed-work-panel-wrap">
              <div className="ed-work-panel">
                <div className="ed-work-shot">
                  <ShotPlaceholder badge={`No.${no}`} />
                  <div className="ed-work-shot__mark">{w.name.charAt(0)}</div>
                </div>
                <div className="ed-work-shot-meta">
                  <span className="ed-work-shot-meta__role">{w.yr}</span>
                  <span className="ed-work-shot-meta__meta">{w.tags}</span>
                  <span className="ed-work-shot-meta__cta">View case →</span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}

      <div className="ed-work-foot" data-reveal>
        <Link to="/chat" className="ed-work-foot__btn">
          Curious about a project? Ask me →
        </Link>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="ed-about">
      <div className="ed-about__grid">
        <div data-reveal>
          <div className="ed-eyebrow">ABOUT — THE EDITOR</div>
          <div className="ed-about__portrait">
            <ShotPlaceholder />
            <div className="ed-about__portrait-tag">NGUYỄN HOÀNG VÂN LONG</div>
          </div>
          <div className="ed-about__stat">
            10<span>+</span>
            <small>years shipping production web</small>
          </div>
        </div>
        <div className="ed-about__prose" data-reveal>
          <p className="ed-about__lead">
            Ten years in, I've stopped caring which framework won this year. What stuck is a simpler
            test: did the thing we shipped actually make someone's day easier?
          </p>
          <p>
            I read the problem before I open the editor. I write tests because future-me is
            forgetful. I let AI handle the boilerplate and keep the judgment calls for myself. And
            I'd rather ship something small on Tuesday than something perfect that never leaves the
            branch.
          </p>
          <p>
            These days I care less about owning a single layer and more about how the whole system
            fits — the trade-offs, the seams, the decisions a team has to live with for years.
            That's where I'm heading next: solution architecture, turning product intent into
            technical shape. If that's the problem you're solving, let's talk.
          </p>
          <div className="ed-about__tags">
            <span>HCMC / REMOTE</span>
            <span>VI · EN</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Writing() {
  const essays = essaysForGallery();
  return (
    <section id="writing" className="ed-section">
      <div className="ed-section-head" data-reveal>
        <h2>Writing</h2>
        <span className="ed-section-head__meta">NOTES — IN PROGRESS</span>
      </div>
      {essays.map((e) => (
        <Link key={e.slug} to={e.href} className="ed-writing-row" data-reveal>
          <span className="ed-writing-row__tag">NOTE</span>
          <span className="ed-writing-row__title">{e.title}</span>
          <span className="ed-writing-row__date">{e.meta}</span>
        </Link>
      ))}
    </section>
  );
}

function Stack() {
  return (
    <section id="stack" className="ed-stack">
      <div className="ed-eyebrow" data-reveal>
        STACK — THE TYPE CASE
      </div>
      <div className="ed-stack__grid" data-reveal>
        {STACK_GROUPS.map((s) => (
          <div key={s.group} className="ed-stack__cell">
            <div className="ed-stack__group">{s.group}</div>
            <div className="ed-stack__items">
              {s.items.map((it) => (
                <div key={it.n} className="ed-stack__item">
                  <span>{it.n}</span>
                  <span>{it.y ?? ""}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  const resume = resumeForGallery();
  const cvHref = resume?.url ?? resume?.href ?? "/artifacts";
  return (
    <section id="contact" className="ed-contact">
      <div className="ed-contact__wash" />
      <div className="ed-contact__eyebrow" data-reveal>
        CONTACT — LETTERS WELCOME
      </div>
      <a className="ed-contact__email" href="mailto:hvanlong@pm.me" data-reveal>
        hvanlong@pm.me
      </a>
      <div className="ed-contact__links" data-reveal>
        <a href={cvHref} target="_blank" rel="noopener">
          CV — PDF ↗
        </a>
        <a href="https://github.com/8bu" target="_blank" rel="noopener">
          GITHUB ↗
        </a>
        <a href="https://linkedin.com/in/8bu" target="_blank" rel="noopener">
          LINKEDIN ↗
        </a>
      </div>
      <div className="ed-contact__foot">
        <span>8BU.DEV · SET IN NEWSREADER &amp; SPACE GROTESK</span>
        <span>TYPESET &amp; SHIPPED IN HCMC · {YEAR}</span>
      </div>
    </section>
  );
}

/**
 * Editorial home (ADR-0001) — the scroll site at `/`. Replaces the former
 * chat-first `HomePane`. Sections bind to the live catalog: Selected Work ←
 * projects, Writing ← essays, Contact CV ← resume. Chat relocates to the Ask
 * route (`/chat`), reached from the nav / ⌘K / `/`.
 */
export function EditorialHome() {
  const rootRef = useRef<HTMLDivElement>(null);
  useReveal(rootRef);
  useAskShortcuts();
  return (
    <div className="ed" ref={rootRef}>
      <div className="ed-grain" />
      <Nav />
      <main>
        <Hero />
        <SelectedWork />
        <About />
        <Writing />
        <Stack />
        <Contact />
      </main>
    </div>
  );
}
