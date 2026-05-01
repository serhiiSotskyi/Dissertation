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
          <span className="eyebrow">Dissertation Project</span>
          <p className="topbar-copy">Breast cancer classification research with image, tabular, and exploratory fusion testing.</p>
        </div>
        <nav className="topbar-nav">
          <Link href="/test">Live test</Link>
          <Link href="/notebooks">Notebook archive</Link>
        </nav>
      </header>

      <main className="home-main">
        <section className="hero-panel glass-panel">
          <div className="hero-copy">
            <h1 className="hero-title">
              <span className="hero-line">A research project on</span>
              <span className="hero-line">image, tabular, and</span>
              <span className="hero-line">exploratory fusion testing.</span>
            </h1>
            <p className="hero-line hero-summary">
              This project brings the main breast cancer classification workflows into one place, with dedicated testing
              views for image-based analysis, tabular inputs, and exploratory multimodal experiments.
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
              <span className="callout-label">Tabular branch</span>
              <MetricCounter className="callout-value" value={metrics.wisconsinAccuracy * 100} suffix="%" />
              <span className="callout-meta">Wisconsin benchmark accuracy</span>
            </div>
          </div>
        </section>

        <section className="metrics-grid story-strip">
          <motion.article className="metric-card story-card glass-panel" whileHover={{ y: -8 }}>
            <span className="metric-label">Image accuracy</span>
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
                <p>Use all 30 morphological features in a structured interface designed for transparent tabular testing.</p>
              </article>
              <article className="sequence-step glass-panel">
                <span className="sequence-index">03</span>
                <h3>Synthetic fusion demo</h3>
                <p>Explore combined image and tabular inputs in an experimental multimodal workflow for comparison and analysis.</p>
              </article>
            </div>
            <LottieSupport className="sequence-support-lottie" name={scannerAnimationName} />
          </div>
        </section>

        <section className="story-grid story-grid--single story-strip">
          <article className="story-card glass-panel">
            <span className="eyebrow">Notebook system</span>
            <h3>Curated docs, not raw dumps</h3>
            <p>The notebook page turns the executed research sequence into a browsable reading surface with side navigation, figure cards, and direct notebook downloads.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
