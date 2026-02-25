import Link from "next/link";
import styles from "@/app/design-preview/design-preview.module.css";

export default function DesignPreviewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.topRow}>
          <h1 className={styles.title}>Design Preview: Single Poll Card</h1>
          <Link href="/" className={styles.back}>
            Back to feed
          </Link>
        </div>

        <article className={styles.card}>
          <div className={styles.cardBody}>
            <div className={styles.header}>
              <img
                className={styles.thumb}
                src="https://picsum.photos/seed/preview-yesno/96/96"
                alt=""
                loading="lazy"
                decoding="async"
              />
              <h2 className={styles.question}>Should UK cities pedestrianise more central high streets?</h2>
            </div>

            <div className={styles.split} aria-hidden="true">
              <span className={styles.splitYes} />
              <span className={styles.splitNo} />
            </div>

            <div className={styles.answers}>
              <div className={styles.answerBox}>
                <span className={styles.label}>Yes</span>
                <span className={styles.percentYes}>61%</span>
              </div>
              <div className={styles.answerBox}>
                <span className={styles.label}>No</span>
                <span className={styles.percentNo}>39%</span>
              </div>
            </div>
          </div>

          <footer className={styles.footer}>
            <div className={styles.leftMeta}>
              <span className={styles.meta}>
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M16 19a4 4 0 0 0-8 0M19 19a4 4 0 0 0-2.1-3.5M5 19A4 4 0 0 1 7.1 15.5M16 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM8 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                1.4k
              </span>
              <span className={styles.meta}>
                <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3v-3H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
                234
              </span>
            </div>

            <div className={styles.rightMeta}>
              <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M7 4.8h10a1.4 1.4 0 0 1 1.4 1.4v13a1.4 1.4 0 0 1-2.15 1.19L12 17.8l-4.25 2.59A1.4 1.4 0 0 1 5.6 19.2v-13A1.4 1.4 0 0 1 7 4.8Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M15 5a3 3 0 1 1 2.12 5.12l-7.25 3.63a3 3 0 1 1 0 2.5l7.25 3.63A3 3 0 1 1 16 21a3 3 0 0 1 .23-1.15l-7.24-3.62a3 3 0 1 1 0-4.46l7.24-3.62A3 3 0 0 1 15 5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
