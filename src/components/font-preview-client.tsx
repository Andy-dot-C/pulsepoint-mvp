"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import styles from "@/app/font-preview/font-preview.module.css";

type FontPreset = {
  id: string;
  name: string;
  bodyVar: string;
  displayVar: string;
};

type FontPreviewClientProps = {
  presets: FontPreset[];
};

export function FontPreviewClient({ presets }: FontPreviewClientProps) {
  const [selectedPresetId, setSelectedPresetId] = useState(presets[0]?.id ?? "");
  const selected = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId) ?? presets[0],
    [presets, selectedPresetId]
  );

  if (!selected) return null;

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <h1 className={styles.heading}>Font Preview</h1>
        <p className={styles.subheading}>Switch between 5 presets instantly on one mock homepage layout.</p>

        <div className={styles.switcher} role="tablist" aria-label="Font presets">
          {presets.map((preset) => (
            <button
              key={preset.id}
              className={`${styles.switchBtn} ${preset.id === selected.id ? styles.switchBtnActive : ""}`}
              onClick={() => setSelectedPresetId(preset.id)}
              type="button"
              role="tab"
              aria-selected={preset.id === selected.id}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <section
          className={styles.mock}
          style={
            {
              ["--preview-body-font" as string]: selected.bodyVar,
              ["--preview-display-font" as string]: selected.displayVar
            } as CSSProperties
          }
        >
          <header className={styles.mockHeader}>
            <div className={styles.logo}>Polld</div>
            <div className={styles.search}>Search polls...</div>
            <button className={styles.create}>Create Poll</button>
          </header>

          <nav className={styles.mockNav}>
            <span className={styles.active}>Trending</span>
            <span>New</span>
            <span>Most Voted</span>
            <span className={styles.sep}>|</span>
            <span>Politics</span>
            <span>Sport</span>
            <span>Entertainment</span>
            <span>Culture</span>
          </nav>

          <div className={styles.mockGrid}>
            <div className={styles.leftCol}>
              <article className={styles.card}>
                <h2>Should local councils pedestrianise more city centres?</h2>
                <div className={styles.optionRow}>
                  <span>Yes</span>
                  <strong>58%</strong>
                </div>
                <div className={styles.barTrack}>
                  <span className={styles.barFillA} />
                </div>
                <div className={styles.optionRow}>
                  <span>No</span>
                  <strong>42%</strong>
                </div>
                <div className={styles.barTrack}>
                  <span className={styles.barFillB} />
                </div>
              </article>

              <article className={styles.card}>
                <h2>Who should win Best Actor this year?</h2>
                <div className={styles.optionRow}>
                  <span>Candidate A</span>
                  <strong>47%</strong>
                </div>
                <div className={styles.barTrack}>
                  <span className={styles.barFillA} style={{ width: "47%" }} />
                </div>
                <div className={styles.optionRow}>
                  <span>Candidate B</span>
                  <strong>34%</strong>
                </div>
                <div className={styles.barTrack}>
                  <span className={styles.barFillNeutral} style={{ width: "34%" }} />
                </div>
              </article>
            </div>

            <aside className={styles.rail}>
              <h3>Trending</h3>
              <p>Should PM debates be mandatory before elections? 61%</p>
              <p>Will inflation fall below 2% this year? 55%</p>
              <h3>Top Movers</h3>
              <p>Should MPs publish all lobbying meetings? 73%</p>
              <p>Should rail fares be capped nationwide? 64%</p>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
