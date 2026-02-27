"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

type FeaturedPollCarouselProps = {
  children: ReactNode;
  intervalMs?: number;
};

export function FeaturedPollCarousel({ children, intervalMs = 9000 }: FeaturedPollCarouselProps) {
  const slides = useMemo(() => (Array.isArray(children) ? children : [children]), [children]);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, isPaused, slides.length]);

  if (slides.length === 0) return null;

  function goNext() {
    setIndex((current) => (current + 1) % slides.length);
  }

  function goPrev() {
    setIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  return (
    <section
      className="featured-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Featured polls"
    >
      <div className="featured-carousel-frame">
        {slides.length > 1 ? (
          <div className="featured-carousel-arrows" aria-label="Featured poll controls">
            <button type="button" className="featured-carousel-arrow" onClick={goPrev} aria-label="Previous featured poll">
              &#8249;
            </button>
            <button type="button" className="featured-carousel-arrow" onClick={goNext} aria-label="Next featured poll">
              &#8250;
            </button>
          </div>
        ) : null}
        <div className="featured-carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((slide, slideIndex) => (
            <div key={slideIndex} className="featured-carousel-slide">
              {slide}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
