import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "@/app/non-yesno-color-preview/non-yesno-color-preview.module.css";

type Scheme = {
  name: string;
  primary: string;
  secondary: string;
  mode: "dual-accent" | "single-accent";
};

const schemes: Scheme[] = [
  { name: "Current 7 (Y/N colors)", primary: "#3B82F6", secondary: "#22C55E", mode: "dual-accent" },
  { name: "Neutral (recommended)", primary: "#475569", secondary: "#94A3B8", mode: "dual-accent" },
  { name: "Pair 1", primary: "#1E3A8A", secondary: "#93C5FD", mode: "dual-accent" },
  { name: "Pair 2", primary: "#14532D", secondary: "#A7F3D0", mode: "dual-accent" },
  { name: "Pair 4", primary: "#0F766E", secondary: "#FDE68A", mode: "dual-accent" },
  { name: "Current 2", primary: "#14B8A6", secondary: "#6366F1", mode: "dual-accent" },
  { name: "Current 6", primary: "#F43F5E", secondary: "#10B981", mode: "dual-accent" },
  { name: "Pair 3 (extra)", primary: "#4338CA", secondary: "#FDBA74", mode: "dual-accent" },
  { name: "Pair 5 corrected (extra)", primary: "#6D28D9", secondary: "#64748B", mode: "dual-accent" },
  { name: "Single accent blue", primary: "#3B82F6", secondary: "#94A3B8", mode: "single-accent" },
  { name: "Single accent navy", primary: "#1E3A8A", secondary: "#94A3B8", mode: "single-accent" },
  { name: "Single accent teal", primary: "#0F766E", secondary: "#94A3B8", mode: "single-accent" }
];

export default function NonYesNoColorPreviewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>Non-Yes/No Color Lab</h1>
            <p className={styles.sub}>All examples below are non-Yes/No cards only.</p>
          </div>
          <Link href="/" className={styles.back}>
            Back to feed
          </Link>
        </div>

        <section className={styles.grid}>
          {schemes.map((scheme) => {
            const secondaryForBars = scheme.mode === "single-accent" ? "#94A3B8" : scheme.secondary;
            const cardStyle = {
              ["--scheme-primary" as string]: scheme.primary,
              ["--scheme-secondary" as string]: secondaryForBars
            } as CSSProperties;

            return (
              <article key={scheme.name} className={styles.card} style={cardStyle}>
                <p className={styles.name}>{scheme.name}</p>
                <p className={styles.codes}>
                  {scheme.primary} + {scheme.secondary}
                </p>
                <p className={styles.mode}>{scheme.mode.replace("-", " ")}</p>
                <div className={styles.swatches} aria-hidden="true">
                  <span className={styles.swatch} style={{ background: scheme.primary }} />
                  <span className={styles.swatch} style={{ background: secondaryForBars }} />
                </div>

                <div className={styles.preview}>
                  <p className={styles.question}>Who should be the next central bank governor?</p>
                  <div className={styles.rows}>
                    <div>
                      <div className={styles.rowTop}>
                        <span>Candidate A</span>
                        <strong>46%</strong>
                      </div>
                      <div className={styles.bar}>
                        <span className={styles.fill} style={{ width: "46%", background: "var(--scheme-primary)" }} />
                      </div>
                    </div>
                    <div>
                      <div className={styles.rowTop}>
                        <span>Candidate B</span>
                        <strong>34%</strong>
                      </div>
                      <div className={styles.bar}>
                        <span className={styles.fill} style={{ width: "34%", background: "var(--scheme-secondary)" }} />
                      </div>
                    </div>
                    <div>
                      <div className={styles.rowTop}>
                        <span>Candidate C</span>
                        <strong>20%</strong>
                      </div>
                      <div className={styles.bar}>
                        <span className={styles.fill} style={{ width: "20%", background: "#94A3B8" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
