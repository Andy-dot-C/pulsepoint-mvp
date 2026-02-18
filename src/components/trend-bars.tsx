import { Poll } from "@/lib/types";

type TrendBarsProps = {
  poll: Poll;
};

function colorFor(index: number): string {
  const palette = ["#0f766e", "#2563eb", "#c2410c", "#6d28d9"];
  return palette[index % palette.length];
}

export function TrendBars({ poll }: TrendBarsProps) {
  return (
    <div className="trend-panel">
      {poll.trend.map((point) => (
        <div key={point.label} className="trend-row">
          <p className="trend-label">{point.label}</p>
          <div className="trend-bars">
            {poll.options.map((option, index) => {
              const share = point.shares[option.id] ?? 0;
              return (
                <div
                  key={option.id}
                  className="trend-bar"
                  style={{
                    width: `${Math.max(share * 100, 4)}%`,
                    background: colorFor(index)
                  }}
                  title={`${option.label}: ${(share * 100).toFixed(1)}%`}
                />
              );
            })}
          </div>
          <p className="trend-total">{point.totalVotes.toLocaleString()} votes</p>
        </div>
      ))}
    </div>
  );
}
