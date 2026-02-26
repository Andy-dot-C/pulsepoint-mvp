import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "@/app/non-yesno-selection-preview/non-yesno-selection-preview.module.css";

type Variant = {
  id: string;
  name: string;
  mode: string;
};

const variants: Variant[] = [
  { id: "v1", name: "Option 1", mode: "Border only" },
  { id: "v2", name: "Option 2", mode: "Border + faint tint" },
  { id: "v3", name: "Option 3", mode: "Left accent rail" },
  { id: "v4", name: "Option 4", mode: "Text color emphasis" },
  { id: "v5", name: "Option 5", mode: "Dot marker" },
  { id: "v6", name: "Option 6", mode: "Neutral row + accent %" }
];

type PollPreviewProps = {
  variantId: string;
  selectedIndex: 0 | 1;
};

function PollPreview({ variantId, selectedIndex }: PollPreviewProps) {
  const accent = selectedIndex === 0 ? "#3B82F6" : "#22C55E";
  const style = { ["--accent" as string]: accent } as CSSProperties;

  return (
    <div className={`${styles.poll} ${(styles as Record<string, string>)[variantId]}`} style={style}>
      <p className={styles.question}>Which policy should be prioritised first?</p>
      <div className={styles.rows}>
        <div className={`${styles.row} ${selectedIndex === 0 ? styles.selected : styles.notSelected}`}>
          <div className={styles.head}>
            <span className={styles.label}>Housing reform</span>
            <strong className={styles.pct}>41%</strong>
          </div>
          <div className={styles.bar}>
            <span className={styles.fillBlue} style={{ width: "41%" }} />
          </div>
        </div>

        <div className={`${styles.row} ${selectedIndex === 1 ? styles.selected : styles.notSelected}`}>
          <div className={styles.head}>
            <span className={styles.label}>Tax simplification</span>
            <strong className={styles.pct}>34%</strong>
          </div>
          <div className={styles.bar}>
            <span className={styles.fillGreen} style={{ width: "34%" }} />
          </div>
        </div>

        <div className={`${styles.row} ${styles.notSelected}`}>
          <div className={styles.head}>
            <span className={styles.label}>Transport funding</span>
            <strong className={styles.pct}>25%</strong>
          </div>
          <div className={styles.bar}>
            <span className={styles.fillNeutral} style={{ width: "25%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NonYesNoSelectionPreviewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div>
            <h1 className={styles.title}>Non-Yes/No Selected-State Preview</h1>
            <p className={styles.sub}>6 options for how a selected answer should look on multi-option cards.</p>
          </div>
          <Link href="/" className={styles.back}>
            Back to feed
          </Link>
        </div>

        <section className={styles.grid}>
          {variants.map((variant) => {
            return (
              <article key={variant.id} className={styles.card}>
                <p className={styles.name}>{variant.name}</p>
                <p className={styles.mode}>{variant.mode}</p>
                <div className={styles.stateGrid}>
                  <div className={styles.stateBlock}>
                    <p className={styles.stateLabel}>Blue selected</p>
                    <PollPreview variantId={variant.id} selectedIndex={0} />
                  </div>
                  <div className={styles.stateBlock}>
                    <p className={styles.stateLabel}>Green selected</p>
                    <PollPreview variantId={variant.id} selectedIndex={1} />
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
