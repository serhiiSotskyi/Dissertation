"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { LottieSupport } from "@/components/lottie-support";
import type { LottieSearchGroup, NotebookDefinition } from "@/lib/content";

type NotebooksViewProps = {
  notebooks: NotebookDefinition[];
  lottieSearchGroups: LottieSearchGroup[];
  lottieStyleFilters: string[];
  supportAnimationName: string | null;
};

export function NotebooksView({
  notebooks,
  lottieSearchGroups,
  lottieStyleFilters,
  supportAnimationName,
}: NotebooksViewProps) {
  const [activeSlug, setActiveSlug] = useState(notebooks[0]?.slug ?? "");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find((entry) => entry.isIntersecting);
        if (visibleEntry?.target instanceof HTMLElement) {
          setActiveSlug(visibleEntry.target.dataset.slug ?? "");
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: 0.1,
      },
    );

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-notebook-section]"));
    sections.forEach((section) => observer.observe(section));

    const handleScroll = () => {
      const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(maximumScroll > 0 ? window.scrollY / maximumScroll : 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="app-shell app-shell--notebooks">
      <div className="ambient-layer ambient-layer--mesh" />
      <div className="reading-progress" style={{ transform: `scaleX(${progress})` }} />

      <header className="topbar">
        <div>
          <span className="eyebrow">Research archive</span>
          <p className="topbar-copy">Curated notebook reading surface with artifact previews and direct notebook downloads.</p>
        </div>
        <nav className="topbar-nav">
          <Link href="/">Home</Link>
          <Link href="/test">Testing page</Link>
        </nav>
      </header>

      <main className="notebook-layout">
        <aside className="notebook-nav glass-panel">
          <span className="eyebrow">Notebook sequence</span>
          {notebooks.map((notebook) => (
            <a
              key={notebook.slug}
              className={`notebook-nav-link ${activeSlug === notebook.slug ? "notebook-nav-link--active" : ""}`}
              href={`#${notebook.slug}`}
            >
              {notebook.title}
            </a>
          ))}
        </aside>

        <section className="notebook-content">
          {notebooks.map((notebook, index) => (
            <motion.article
              key={notebook.slug}
              id={notebook.slug}
              data-notebook-section
              data-slug={notebook.slug}
              className="notebook-article glass-panel"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <div className="notebook-article-header">
                <div>
                  <span className="eyebrow">Notebook {String(index + 1).padStart(2, "0")}</span>
                  <h2>{notebook.title}</h2>
                </div>
                <a className="button button--ghost" href={`/api/artifacts/notebooks/${encodeURIComponent(notebook.filename)}`}>
                  Download raw notebook
                </a>
              </div>

              <p className="notebook-summary">{notebook.summary}</p>
              <div className="notebook-purpose glass-panel glass-panel--nested">
                <span className="eyebrow">Purpose</span>
                <p>{notebook.purpose}</p>
              </div>

              <div className="notebook-findings">
                {notebook.findings.map((finding) => (
                  <div key={finding} className="finding-row">
                    <span className="finding-mark" />
                    <p>{finding}</p>
                  </div>
                ))}
              </div>

              {notebook.figures.length ? (
                <div className="figure-grid">
                  {notebook.figures.map((figure) => (
                    <figure key={figure.name} className="figure-card glass-panel glass-panel--nested">
                      <Image
                        alt={figure.caption}
                        className="figure-image"
                        src={`/api/artifacts/figures/${encodeURIComponent(figure.name)}`}
                        width={1600}
                        height={900}
                        unoptimized
                      />
                      <figcaption>{figure.caption}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="empty-figure-card glass-panel glass-panel--nested">
                  <p>This notebook is mainly structural or integration-focused, so the web surface links directly to the raw notebook rather than forcing filler charts.</p>
                </div>
              )}
            </motion.article>
          ))}
        </section>

        <aside className="support-rail glass-panel">
          <div className="support-hero">
            <span className="eyebrow">Optional support Lottie</span>
            <LottieSupport className="support-lottie" name={supportAnimationName} />
            <p>Support animations stay local-first and decorative. The main motion system remains code-driven and 2D.</p>
          </div>

          <div className="support-card glass-panel glass-panel--nested">
            <span className="eyebrow">Search pack</span>
            {lottieSearchGroups.map((group) => (
              <div key={group.title} className="search-group">
                <h3>{group.title}</h3>
                {group.requests.map((request) => (
                  <code key={request} className="search-request">
                    {request}
                  </code>
                ))}
              </div>
            ))}
          </div>

          <div className="support-card glass-panel glass-panel--nested">
            <span className="eyebrow">Style filters</span>
            <div className="filter-chip-grid">
              {lottieStyleFilters.map((filter) => (
                <span key={filter} className="filter-chip">
                  {filter}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
