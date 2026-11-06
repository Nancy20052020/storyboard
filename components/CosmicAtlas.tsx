"use client";
import { useRef, useState } from "react";
import {
  Plus,
  Minus,
  Scan,
  Eye,
  EyeOff,
  ArrowUpRight,
  MousePointer2,
  Orbit,
} from "lucide-react";
import ZodiacGlyph from "./ZodiacGlyph";
import { constellations } from "@/lib/constellations";
const positioned = constellations.map((c, i) => ({
  ...c,
  x: 105 + (i % 4) * 480,
  y: 115 + Math.floor(i / 4) * 290,
}));
function random(i: number) {
  const v = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}
export default function CosmicAtlas({ onChime }: { onChime: () => void }) {
  const [selected, setSelected] = useState("scorpius"),
    [camera, setCamera] = useState({ x: 1000, y: 620, zoom: 1 }),
    [lines, setLines] = useState(true),
    [labels, setLabels] = useState(true);
  const drag = useRef<{
      x: number;
      y: number;
      cx: number;
      cy: number;
      moved: boolean;
    } | null>(null),
    chart = useRef<SVGSVGElement>(null);
  const c = positioned.find((c) => c.id === selected)!;
  const w = 2000 / camera.zoom,
    h = 1250 / camera.zoom;
  function focus(item: typeof c) {
    setSelected(item.id);
    setCamera({ x: item.x + 135, y: item.y + 120, zoom: 2.7 });
    onChime();
  }
  function zoom(delta: number) {
    setCamera((v) => ({
      ...v,
      zoom: Math.min(4, Math.max(0.85, v.zoom + delta)),
    }));
  }
  function reset() {
    setCamera({ x: 1000, y: 620, zoom: 1 });
  }
  return (
    <section className="cosmic-atlas" aria-label="Constellation universe">
      <div className="atlas-nebula atlas-nebula-a" />
      <div className="atlas-nebula atlas-nebula-b" />
      <div className="atlas-title">
        <div className="realm-eyebrow">
          <span /> THE UNIVERSE DOESN’T END AT YOUR WINDOW
        </div>
        <h1>
          Meet the <em>infinite.</em>
        </h1>
        <p>Ancient stories. Familiar stars. A whole sky to get lost in.</p>
      </div>
      <div className="atlas-layout">
        <aside className="constellation-library">
          <span className="card-kicker">
            <Orbit size={13} /> CELESTIAL FIELD NOTES
          </span>
          <h2>Find your stars.</h2>
          <label className="mobile-constellation-select">
            Choose a constellation
            <select
              aria-label="Choose a constellation"
              value={selected}
              onChange={(e) =>
                focus(positioned.find((c) => c.id === e.target.value)!)
              }
            >
              {positioned.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.alias ? " / " + c.alias : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="constellation-list">
            {positioned.map((item) => (
              <button
                key={item.id}
                className={item.id === selected ? "chosen" : ""}
                aria-pressed={item.id === selected}
                onClick={() => focus(item)}
              >
                <span>
                  <ZodiacGlyph id={item.id} />
                </span>
                <span>
                  {item.name}
                  {item.alias && <small>{item.alias}</small>}
                </span>
                <ArrowUpRight size={11} />
              </button>
            ))}
          </div>
          <p className="atlas-library-note">
            The twelve zodiac constellations
            <br />+ four familiar friends.
          </p>
        </aside>
        <div className="atlas-map-wrap">
          <div className="atlas-map-top">
            <span>
              <span className="live-dot" /> A SKY WITHOUT EDGES
            </span>
            <div>
              <button onClick={() => setLines((v) => !v)} aria-pressed={lines}>
                {lines ? <Eye size={12} /> : <EyeOff size={12} />} Lines
              </button>
              <button
                onClick={() => setLabels((v) => !v)}
                aria-pressed={labels}
              >
                Names
              </button>
            </div>
          </div>
          <svg
            ref={chart}
            className="universe-map"
            viewBox={`${camera.x - w / 2} ${camera.y - h / 2} ${w} ${h}`}
            preserveAspectRatio="xMidYMid slice"
            role="group"
            tabIndex={0}
            aria-label="Star atlas. Drag to pan. Use plus and minus to zoom, arrow keys to pan, or choose a constellation from the list."
            onKeyDown={(e) => {
              const step = 80 / camera.zoom;
              if (
                [
                  "ArrowLeft",
                  "ArrowRight",
                  "ArrowUp",
                  "ArrowDown",
                  "+",
                  "-",
                  "Home",
                ].includes(e.key)
              )
                e.preventDefault();
              if (e.key === "+") zoom(0.3);
              else if (e.key === "-") zoom(-0.3);
              else if (e.key === "Home") reset();
              else if (e.key.startsWith("Arrow"))
                setCamera((v) => ({
                  ...v,
                  x: Math.max(
                    -200,
                    Math.min(
                      2200,
                      v.x +
                        (e.key === "ArrowLeft"
                          ? -step
                          : e.key === "ArrowRight"
                            ? step
                            : 0),
                    ),
                  ),
                  y: Math.max(
                    -100,
                    Math.min(
                      1400,
                      v.y +
                        (e.key === "ArrowUp"
                          ? -step
                          : e.key === "ArrowDown"
                            ? step
                            : 0),
                    ),
                  ),
                }));
            }}
            onPointerDown={(e) => {
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                cx: camera.x,
                cy: camera.y,
                moved: false,
              };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || !chart.current) return;
              const r = chart.current.getBoundingClientRect();
              const scale = Math.min(w / r.width, h / r.height);
              if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4)
                d.moved = true;
              if (d.moved) e.currentTarget.setPointerCapture(e.pointerId);
              if (d.moved)
                setCamera((v) => ({
                  ...v,
                  x: Math.max(
                    -200,
                    Math.min(2200, d.cx - (e.clientX - d.x) * scale),
                  ),
                  y: Math.max(
                    -100,
                    Math.min(1400, d.cy - (e.clientY - d.y) * scale),
                  ),
                }));
            }}
            onPointerUp={() => {
              if (!drag.current?.moved) drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <defs>
              <radialGradient id="galaxy-violet">
                <stop stopColor="#a48acb" stopOpacity=".33" />
                <stop offset=".45" stopColor="#514c9b" stopOpacity=".13" />
                <stop offset="1" stopColor="#121126" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="galaxy-teal">
                <stop stopColor="#6ea4aa" stopOpacity=".18" />
                <stop offset="1" stopColor="#141a32" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="atlas-glow">
                <stop stopColor="#d4d8ff" stopOpacity=".55" />
                <stop offset="1" stopColor="#9ab0fc" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect
              x="-1500"
              y="-1500"
              width="5000"
              height="5000"
              fill="#060c1a"
            />
            <image
              href="/art/celestial-nebula.webp"
              x="-350"
              y="-250"
              width="2700"
              height="1800"
              preserveAspectRatio="xMidYMid slice"
              opacity=".85"
              pointerEvents="none"
            />
            <ellipse
              cx="1100"
              cy="600"
              rx="1200"
              ry="270"
              transform="rotate(-32 1100 600)"
              fill="url(#galaxy-violet)"
            />
            <ellipse
              cx="530"
              cy="860"
              rx="580"
              ry="340"
              fill="url(#galaxy-teal)"
            />
            <ellipse
              cx="1600"
              cy="200"
              rx="550"
              ry="300"
              fill="url(#galaxy-teal)"
            />
            {Array.from({ length: 350 }, (_, i) => (
              <circle
                key={i}
                cx={random(i) * 2800 - 400}
                cy={random(i + 900) * 1900 - 300}
                r={i % 29 === 0 ? 2.3 : i % 7 === 0 ? 1.3 : 0.65}
                fill={
                  i % 6 === 0 ? "#e2c9b5" : i % 4 === 0 ? "#98b9ee" : "#e6e9ff"
                }
                opacity={0.15 + random(i + 1500) * 0.55}
              />
            ))}
            {Array.from({ length: 160 }, (_, i) => {
              const x = random(i + 3000) * 2400 - 200;
              return (
                <circle
                  key={`milky-${i}`}
                  cx={x}
                  cy={1110 - x * 0.55 + (random(i + 4000) - 0.5) * 260}
                  r={0.4 + random(i + 5000)}
                  fill="#d7cee9"
                  opacity={0.12 + random(i + 6000) * 0.23}
                />
              );
            })}
            {positioned.map((item) => (
              <g
                key={item.id}
                className={`atlas-constellation ${selected === item.id ? "is-selected" : ""}`}
                transform={`translate(${item.x} ${item.y})`}
                role="button"
                tabIndex={0}
                aria-label={`Explore ${item.name}${item.alias ? " (Scorpio)" : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    focus(item);
                  }
                }}
                onClick={() => {
                  if (!drag.current?.moved) focus(item);
                  drag.current = null;
                }}
              >
                <rect
                  x="-30"
                  y="-30"
                  width="310"
                  height="300"
                  fill="transparent"
                />
                {lines &&
                  item.paths.map((path, i) => (
                    <polyline
                      key={i}
                      points={path
                        .map(
                          (n) =>
                            `${item.points[n][0] * 2.5},${item.points[n][1] * 2.1}`,
                        )
                        .join(" ")}
                      fill="none"
                      stroke={selected === item.id ? "#e4c68b" : "#7f91b5"}
                      strokeWidth={selected === item.id ? 1.8 : 1}
                      strokeOpacity={selected === item.id ? 0.8 : 0.35}
                    />
                  ))}
                {item.points.map(([x, y], i) => (
                  <g key={i}>
                    <circle
                      cx={x * 2.5}
                      cy={y * 2.1}
                      r={selected === item.id ? 16 : 10}
                      fill="url(#atlas-glow)"
                    />
                    <circle
                      cx={x * 2.5}
                      cy={y * 2.1}
                      r={i === item.accent ? 3.3 : 2.1}
                      fill={i === item.accent ? "#f7b798" : "#eef0ff"}
                    />
                    {selected === item.id && i === item.accent && (
                      <text
                        x={x * 2.5 + 9}
                        y={y * 2.1 - 7}
                        className="bright-star-label"
                      >
                        {item.brightest}
                      </text>
                    )}
                  </g>
                ))}
                {labels && (
                  <text
                    x="115"
                    y="250"
                    textAnchor="middle"
                    className="constellation-map-label"
                  >
                    {item.name.toUpperCase()}
                  </text>
                )}
              </g>
            ))}
          </svg>
          <div className="atlas-zoom">
            <button
              aria-label="Zoom into the universe"
              onClick={() => zoom(0.4)}
              disabled={camera.zoom >= 4}
            >
              <Plus size={15} />
            </button>
            <span>{camera.zoom.toFixed(1)}×</span>
            <button
              aria-label="Zoom out of the universe"
              onClick={() => zoom(-0.4)}
              disabled={camera.zoom <= 0.85}
            >
              <Minus size={15} />
            </button>
            <i />
            <button aria-label="Show the whole sky" onClick={reset}>
              <Scan size={15} />
            </button>
          </div>
          <div className="atlas-map-hint">
            <MousePointer2 size={11} /> DRAG TO WANDER · SELECT A CONSTELLATION
            TO TRAVEL
          </div>
          <div className="constellation-detail" aria-live="polite">
            <span className="constellation-detail-symbol">
              <ZodiacGlyph id={c.id} />
            </span>
            <div>
              <span className="card-kicker">
                {c.meaning.toUpperCase()}
                {c.alias ? " · ALSO CALLED SCORPIO" : ""}
              </span>
              <h3>{c.name}</h3>
              <p>{c.story}</p>
              <div className="constellation-facts">
                <span>
                  BRIGHTEST STAR <b>{c.brightest}</b>
                </span>
                <span>
                  BEST SEASON <b>{c.season}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="atlas-disclaimer">
        An illustrated atlas of recognizable star patterns. Positions are
        arranged for exploration, not a live view of your local sky.
      </p>
    </section>
  );
}
