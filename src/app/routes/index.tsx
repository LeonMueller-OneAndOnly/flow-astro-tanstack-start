import { Link, createFileRoute } from "@tanstack/react-router";

import { brandPageBackground } from "../lib/brand-theme";
// vite-imagetools replaces Astro's `<Image>`: the widths are generated at build
// time and `as=img` returns { src, w, h, srcset } for the largest variant, so the
// intrinsic size is known and the layout cannot shift.
import omnisImage from "../../assets/demo/robot-standing-white.png?w=320;420;640;840&format=webp&as=img";
import styles from "./index.module.css";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Omnis" },
      {
        name: "description",
        content: "Starter kit built on TanStack Start.",
      },
    ],
  }),
});

function Home() {
  return (
    <main className={styles.pageShell} style={{ background: brandPageBackground.background }}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Omnis App</p>
          <h1>A starter kit, not a real app yet.</h1>
          <p className={styles.lede}>
            TanStack Start serves everything — static pages, SSR routes, typed server functions and
            authenticated flows — from one router. The bundled examples live behind one link so you
            can explore them, then delete them in one move.
          </p>

          <div className={styles.actions} aria-label="Primary actions">
            <Link to="/demo" className={`${styles.btn} ${styles.btnPrimary}`}>
              Browse the demos
            </Link>
          </div>
        </div>

        <figure className={styles.omnisVisual} aria-label="Omnis robot preview">
          <img
            src={omnisImage.src}
            srcSet={omnisImage.srcset}
            width={omnisImage.w}
            height={omnisImage.h}
            sizes="(min-width: 960px) 360px, min(420px, 100vw)"
            alt="Omnis robot standing"
            className={styles.omnisImage}
            loading="eager"
          />
        </figure>
      </section>

      <section className={styles.split} aria-label="Stack overview">
        <a
          className={styles.card}
          href="https://tanstack.com/start"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.cardLabel}>TanStack Start</span>
          <h2>One router, every route</h2>
          <p>
            Typed server functions, mutations, shared client/server loading and authenticated flows.
            Static routes are prerendered at build time from the same route tree.
          </p>
          <span className={styles.cardCta}>
            TanStack Start docs
            <ExternalArrowIcon />
          </span>
        </a>

        <Link to="/demo" className={`${styles.card} ${styles.cardFilled}`}>
          <span className={styles.cardLabel}>Demos</span>
          <h2>
            All under <code>/demo</code>
          </h2>
          <p>
            Every example sits beneath the <code>/demo</code> route segment. Drop{" "}
            <code>src/app/routes/demo</code> and <code>src/app/lib/demo</code> to remove them all.
          </p>
          <span className={styles.cardCta}>
            Browse the demos
            <ForwardArrowIcon />
          </span>
        </Link>

        <a
          className={styles.card}
          href="https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.cardLabel}>Routing</span>
          <h2>File-based routes</h2>
          <p>
            Routes come from <code>src/app/routes</code>. The generated tree types every{" "}
            <code>Link</code>, so a renamed route is a compile error, not a dead link.
          </p>
          <span className={styles.cardCta}>
            Routing docs
            <ExternalArrowIcon />
          </span>
        </a>
      </section>
    </main>
  );
}

function ExternalArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function ForwardArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
