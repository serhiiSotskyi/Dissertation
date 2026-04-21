"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import { LottieSupport } from "@/components/lottie-support";
import { MetricCounter } from "@/components/metric-counter";

type LandingMetrics = {
  patientAccuracy: number;
  patientRocAuc: number;
  wisconsinAccuracy: number;
  syntheticBestAccuracy: number;
  notebookCount: number;
  figureCount: number;
};

type LandingStoryProps = {
  metrics: LandingMetrics;
  ambientAnimationName: string | null;
  scannerAnimationName: string | null;
};

export function LandingStory({
  metrics,
  ambientAnimationName,
  scannerAnimationName,
}: LandingStoryProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const context = gsap.context(() => {
      gsap.fromTo(
        ".hero-line",
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          stagger: 0.16,
          ease: "power3.out",
        },
      );

      gsap.utils.toArray<HTMLElement>(".story-strip").forEach((strip) => {
        const cards = strip.querySelectorAll(".story-card");
        gsap.fromTo(
          cards,
          { opacity: 0.28, y: 64 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            stagger: 0.18,
            scrollTrigger: {
              trigger: strip,
              start: "top center",
              end: "bottom center",
              scrub: 1,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".pinned-sequence").forEach((sequence) => {
        const track = sequence.querySelector(".sequence-track");
        if (!track) {
          return;
        }
        gsap.to(track, {
          yPercent: -18,
          ease: "none",
          scrollTrigger: {
            trigger: sequence,
            pin: true,
            scrub: 1,
            start: "top top",
            end: "+=900",
          },
        });
      });
    }, rootRef);

    return () => context.revert();
  }, []);

  return (
    <div ref={rootRef} className="app-shell app-shell--home">
      <div className="ambient-layer ambient-layer--mesh" />
      <div className="ambient-layer ambient-layer--scanlines" />

      <header className="topbar">
        <div>
          <span className="eyebrow">BreaScope AI</span>
          <p className="topbar-copy">Cinematic 2D research interface for dissertation-grade inference storytelling.</p>
        </div>
        <nav className="topbar-nav">
          <Link href="/test">Live test</Link>
          <Link href="/notebooks">Notebook archive</Link>
        </nav>
      </header>

      <main className="home-main">
        <section className="hero-panel glass-panel">
          <div className="hero-copy">
            <span className="hero-kicker hero-line">Leakage-safe image inference.</span>
            <h1 className="hero-title">
              <span className="hero-line">A motion-first research surface</span>
              <span className="hero-line">for tabular, pathology,</span>
              <span className="hero-line">and synthetic fusion demos.</span>
            </h1>
            <p className="hero-line hero-summary">
              The experience is built around the frozen Wisconsin branch, the corrected patient-level BreaKHis branch,
              and an explicitly non-clinical synthetic fusion demo.
            </p>
            <div className="hero-actions hero-line">
              <Link href="/test" className="button button--primary">
                Open testing page
              </Link>
              <Link href="/notebooks" className="button button--ghost">
                Read the notebook stack
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-orbital">
              <div className="orbital-ring orbital-ring--one" />
              <div className="orbital-ring orbital-ring--two" />
              <div className="orbital-core" />
              <div className="orbital-pulse" />
            </div>
            <LottieSupport className="hero-ambient-lottie" name={ambientAnimationName} />
            <div className="hero-callout hero-callout--upper glass-panel">
              <span className="callout-label">Image branch</span>
              <MetricCounter className="callout-value" value={metrics.patientRocAuc * 100} suffix="%" />
              <span className="callout-meta">Patient-level ROC AUC</span>
            </div>
            <div className="hero-callout hero-callout--lower glass-panel">
              <span className="callout-label">Frozen tabular branch</span>
              <MetricCounter className="callout-value" value={metrics.wisconsinAccuracy * 100} suffix="%" />
              <span className="callout-meta">Published Wisconsin accuracy</span>
            </div>
          </div>
        </section>

        <section className="metrics-grid story-strip">
          <motion.article className="metric-card story-card glass-panel" whileHover={{ y: -8 }}>
            <span className="metric-label">Corrected image accuracy</span>
            <MetricCounter className="metric-value" value={metrics.patientAccuracy * 100} suffix="%" />
          </motion.article>
          <motion.article className="metric-card story-card glass-panel" whileHover={{ y: -8 }}>
            <span className="metric-label">Best synthetic fusion accuracy</span>
            <MetricCounter className="metric-value" value={metrics.syntheticBestAccuracy * 100} suffix="%" />
          </motion.article>
          <motion.article className="metric-card story-card glass-panel" whileHover={{ y: -8 }}>
            <span className="metric-label">Notebook chapters</span>
            <MetricCounter className="metric-value" value={metrics.notebookCount} />
          </motion.article>
          <motion.article className="metric-card story-card glass-panel" whileHover={{ y: -8 }}>
            <span className="metric-label">Curated figures</span>
            <MetricCounter className="metric-value" value={metrics.figureCount} />
          </motion.article>
        </section>

        <section className="pinned-sequence glass-panel">
          <div className="sequence-track">
            <div className="section-intro">
              <span className="eyebrow">Scroll narrative</span>
              <h2>One interface. Three research modes.</h2>
            </div>
            <div className="sequence-rail">
              <article className="sequence-step glass-panel">
                <span className="sequence-index">01</span>
                <h3>Image-only mode</h3>
                <p>Upload pathology tiles and get corrected patient-level branch probabilities with a serious diagnostic-style presentation.</p>
              </article>
              <article className="sequence-step glass-panel">
                <span className="sequence-index">02</span>
                <h3>Tabular-only mode</h3>
                <p>Run the frozen Wisconsin branch with all 30 morphological features exposed in a structured, transparent form.</p>
              </article>
              <article className="sequence-step glass-panel">
                <span className="sequence-index">03</span>
                <h3>Synthetic fusion demo</h3>
                <p>The fusion lane remains available for methodology exploration, but the non-clinical disclaimer stays attached to the result at all times.</p>
              </article>
            </div>
            <LottieSupport className="sequence-support-lottie" name={scannerAnimationName} />
          </div>
        </section>

        <section className="story-grid story-strip">
          <article className="story-card glass-panel">
            <span className="eyebrow">Interface principle</span>
            <h3>Motion as explanation</h3>
            <p>All major transitions are built in code with 2D layers, masks, counters, and scroll-linked timelines instead of decorative 3D scenes.</p>
          </article>
          <article className="story-card glass-panel">
            <span className="eyebrow">Notebook system</span>
            <h3>Curated docs, not raw dumps</h3>
            <p>The notebook page turns the executed research sequence into a browsable reading surface with side navigation, figure cards, and direct notebook downloads.</p>
          </article>
          <article className="story-card glass-panel">
            <span className="eyebrow">Deployment split</span>
            <h3>Vercel + Railway</h3>
            <p>Next.js hosts the experience and artifact routes, while the Python API remains ready for Railway-hosted inference using the frozen and corrected model artifacts.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
