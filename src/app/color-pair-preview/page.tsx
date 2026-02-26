import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "@/app/color-pair-preview/color-pair-preview.module.css";

type Pair = {
  name: string;
  primary: string;
  secondary: string;
  note?: string;
};

const pairs: Pair[] = [
  { name: "Pair 1", primary: "#1E3A8A", secondary: "#93C5FD" },
  { name: "Pair 2", primary: "#14532D", secondary: "#A7F3D0" },
  { name: "Pair 4", primary: "#0F766E", secondary: "#FDE68A" },
  { name: "Current 2", primary: "#14B8A6", secondary: "#6366F1" },
  { name: "Current 7", primary: "#3B82F6", secondary: "#22C55E" },
  { name: "Current 6", primary: "#F43F5E", secondary: "#10B981" }
];

export default function ColorPairPreviewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>Color Pair Preview</h1>
            <p className={styles.sub}>Side-by-side preview for Y/N and multi-option card styling.</p>
          </div>
          <Link href="/" className={styles.back}>
            Back to feed
          </Link>
        </div>

        <section className={styles.grid}>
          {pairs.map((pair) => {
            const cardStyle = {
              ["--pair-primary" as string]: pair.primary,
              ["--pair-secondary" as string]: pair.secondary
            } as CSSProperties;

            return (
              <article key={pair.name} className={styles.card} style={cardStyle}>
                <div className={styles.row}>
                  <div>
                    <p className={styles.pairName}>{pair.name}</p>
                    <p className={styles.codes}>
                      {pair.primary} + {pair.secondary}
                    </p>
                  </div>
                  <div className={styles.swatches} aria-hidden="true">
                    <span className={styles.swatch} style={{ background: pair.primary }} />
                    <span className={styles.swatch} style={{ background: pair.secondary }} />
                  </div>
                </div>

                <div className={styles.previewBlock}>
                  <p className={styles.question}>Should councils pedestrianise more city centres?</p>
                  <div className={styles.split} aria-hidden="true">
                    <span className={styles.splitLeft} style={{ background: pair.primary }} />
                    <span className={styles.splitRight} style={{ background: pair.secondary }} />
                  </div>
                  <div className={styles.answers}>
                    <div className={`${styles.answer} ${styles.answerSelected}`}>
                      <span className={styles.answerLabel}>Yes</span>
                      <span className={styles.answerPct}>56%</span>
                    </div>
                    <div className={styles.answer}>
                      <span className={styles.answerLabel}>No</span>
                      <span className={styles.answerPct}>44%</span>
                    </div>
                  </div>

                  <div className={styles.multiRows}>
                    <div>
                      <div className={styles.multiTop}>
                        <span>Option A</span>
                        <strong>47%</strong>
                      </div>
                      <div className={styles.multiBar}>
                        <span className={styles.multiFill} style={{ width: "47%", background: pair.primary }} />
                      </div>
                    </div>
                    <div>
                      <div className={styles.multiTop}>
                        <span>Option B</span>
                        <strong>31%</strong>
                      </div>
                      <div className={styles.multiBar}>
                        <span className={styles.multiFill} style={{ width: "31%", background: "#94a3b8" }} />
                      </div>
                    </div>
                  </div>
                  {pair.note ? <p className={styles.note}>{pair.note}</p> : null}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
