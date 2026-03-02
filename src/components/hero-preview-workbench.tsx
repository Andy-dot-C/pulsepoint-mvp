"use client";

import { CSSProperties, useMemo, useState } from "react";
import { FigmaHeroPreviewCard } from "@/components/figma-hero-preview-card";
import { Poll } from "@/lib/types";

type HeroPreviewWorkbenchProps = {
  poll: Poll;
  returnTo: string;
};

type TargetConfig = {
  id: string;
  label: string;
};

type TargetState = {
  x: number;
  y: number;
  scale: number;
};

const TARGETS: TargetConfig[] = [
  { id: "topbar", label: "Top Bar" },
  { id: "badge", label: "Trending Badge" },
  { id: "arrows", label: "Arrows + Counter" },
  { id: "title", label: "Title" },
  { id: "left", label: "Left Column" },
  { id: "option1", label: "Option 1" },
  { id: "option2", label: "Option 2" },
  { id: "chartWrap", label: "Chart Area" },
  { id: "logo", label: "Pollzone Logo" },
  { id: "graph", label: "Graph SVG" },
  { id: "footer", label: "Footer" }
];

function buildInitialState(): Record<string, TargetState> {
  return {
    topbar: { x: 0, y: 0, scale: 100 },
    badge: { x: 0, y: 0, scale: 100 },
    arrows: { x: 0, y: 0, scale: 100 },
    title: { x: 0, y: 0, scale: 100 },
    left: { x: 0, y: 0, scale: 100 },
    option1: { x: 0, y: 0, scale: 100 },
    option2: { x: 0, y: 0, scale: 100 },
    chartWrap: { x: 0, y: 0, scale: 100 },
    logo: { x: 0, y: 0, scale: 100 },
    graph: { x: -3, y: -13, scale: 100 },
    footer: { x: 0, y: 0, scale: 100 }
  };
}

export function HeroPreviewWorkbench({ poll, returnTo }: HeroPreviewWorkbenchProps) {
  const [activeTargetId, setActiveTargetId] = useState<string>(TARGETS[0].id);
  const [stateByTarget, setStateByTarget] = useState<Record<string, TargetState>>(() => buildInitialState());

  const activeState = stateByTarget[activeTargetId];

  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    TARGETS.forEach((target) => {
      const item = stateByTarget[target.id];
      vars[`--dev-${target.id}-x`] = `${item.x}px`;
      vars[`--dev-${target.id}-y`] = `${item.y}px`;
      vars[`--dev-${target.id}-scale`] = `${item.scale / 100}`;
    });
    return vars as CSSProperties;
  }, [stateByTarget]);

  function updateActive(patch: Partial<TargetState>) {
    setStateByTarget((current) => ({
      ...current,
      [activeTargetId]: {
        ...current[activeTargetId],
        ...patch
      }
    }));
  }

  function resetActive() {
    setStateByTarget((current) => ({
      ...current,
      [activeTargetId]: { x: 0, y: 0, scale: 100 }
    }));
  }

  function resetAll() {
    setStateByTarget(buildInitialState());
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLDivElement>) {
    const targetElement = (event.target as HTMLElement).closest<HTMLElement>("[data-dev-target]");
    if (!targetElement) return;
    const targetId = targetElement.dataset.devTarget;
    if (!targetId) return;
    if (!TARGETS.some((item) => item.id === targetId)) return;
    setActiveTargetId(targetId);
  }

  async function copySettings() {
    const payload = JSON.stringify(stateByTarget, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      // no-op for environments where clipboard is blocked
    }
  }

  return (
    <div className="hero-preview-dev">
      <aside className="hero-preview-dev-panel">
        <p className="hero-preview-dev-kicker">Dev Controls</p>
        <h2>Hero Positioning</h2>

        <label>
          Target
          <select value={activeTargetId} onChange={(event) => setActiveTargetId(event.target.value)}>
            {TARGETS.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          X ({activeState.x}px)
          <input
            type="range"
            min={-240}
            max={240}
            step={1}
            value={activeState.x}
            onChange={(event) => updateActive({ x: Number(event.target.value) })}
          />
        </label>

        <label>
          Y ({activeState.y}px)
          <input
            type="range"
            min={-240}
            max={240}
            step={1}
            value={activeState.y}
            onChange={(event) => updateActive({ y: Number(event.target.value) })}
          />
        </label>

        <label>
          Scale ({activeState.scale}%)
          <input
            type="range"
            min={50}
            max={180}
            step={1}
            value={activeState.scale}
            onChange={(event) => updateActive({ scale: Number(event.target.value) })}
          />
        </label>

        <div className="hero-preview-dev-actions">
          <button type="button" onClick={resetActive}>
            Reset Target
          </button>
          <button type="button" onClick={resetAll}>
            Reset All
          </button>
          <button type="button" onClick={copySettings}>
            Copy Settings
          </button>
        </div>
      </aside>

      <div className="hero-preview-dev-canvas" style={cssVars} onClick={handleCanvasClick}>
        <FigmaHeroPreviewCard
          poll={poll}
          returnTo={returnTo}
          showStaticCarouselControls={false}
          className="figma-hero-native-card"
          style={{ "--hero-native-graph-scale": "1" } as CSSProperties}
        />
      </div>
    </div>
  );
}
