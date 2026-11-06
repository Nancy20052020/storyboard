"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  Wind,
  Stars,
  Leaf,
  Waves,
  Flower2,
} from "lucide-react";
import IslandArt, { type IslandKind } from "./IslandArt";
const destinations = [
  {
    id: "sky" as const,
    name: "Starlit Observatory",
    eyebrow: "A thousand stories written in light",
    verb: "Wander into the stars",
    description:
      "Follow the zodiac through a boundless night, or leave a little piece of yourself among the stars.",
    note: "THE CELESTIAL ARCHIVE",
    color: "#aca0d7",
    icon: Stars,
  },
  {
    id: "forest" as const,
    name: "Whisperwood",
    eyebrow: "For the magic in your hands",
    verb: "Follow the fireflies",
    description:
      "An ancient forest. A clearing of your own. Trace a thought through the air and watch it turn to light.",
    note: "THE ENCHANTED GROVE",
    color: "#93c6af",
    icon: Leaf,
  },
  {
    id: "lake" as const,
    name: "Moonwell",
    eyebrow: "Some things are lighter on the water",
    verb: "Step down to the water",
    description:
      "Give a wish to a lantern. Watch it find its place on the lake. Stay as long as you need.",
    note: "THE STILLWATER SANCTUARY",
    color: "#a8bbd8",
    icon: Waves,
  },
  {
    id: "garden" as const,
    name: "Everbloom",
    eyebrow: "A secret garden, a song of your own",
    verb: "Open the garden gate",
    description:
      "Roses, foxgloves, and wild things. Plant a living composition in a forgotten moonlit conservatory.",
    note: "THE BOTANICAL CONSERVATORY",
    color: "#d0a9b9",
    icon: Flower2,
  },
];
export default function WorldLanding({
  onTravel,
  onChime,
}: {
  onTravel: (place: IslandKind) => void;
  onChime: () => void;
}) {
  const [index, setIndex] = useState(1),
    [drifting, setDrifting] = useState(false),
    [dusk, setDusk] = useState(false);
  const root = useRef<HTMLElement>(null),
    point = useRef({ x: 0, y: 0 }),
    raf = useRef(0),
    swipe = useRef<{ x: number; moved: boolean } | null>(null),
    wheelTime = useRef(0);
  const destination = destinations[index];
  useEffect(() => {
    if (!drifting) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrifting(false);
      return;
    }
    const timer = setInterval(() => setIndex((i) => (i + 1) % 4), 9000);
    return () => clearInterval(timer);
  }, [drifting]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  function preview(i: number) {
    setIndex((i + 4) % 4);
    onChime();
  }
  return (
    <section
      ref={root}
      className={`world-landing destination-${destination.id} ${dusk ? "at-dusk" : ""}`}
      aria-label="Explore your floating islands"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          preview(index + 1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          preview(index - 1);
        }
      }}
      onPointerMove={(e) => {
        if (
          e.pointerType === "touch" ||
          matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        const r = e.currentTarget.getBoundingClientRect();
        point.current = {
          x: (e.clientX - r.left) / r.width - 0.5,
          y: (e.clientY - r.top) / r.height - 0.5,
        };
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(() => {
          root.current?.style.setProperty(
            "--wander-x",
            `${point.current.x * 18}px`,
          );
          root.current?.style.setProperty(
            "--wander-y",
            `${point.current.y * 12}px`,
          );
        });
      }}
      style={
        { "--destination-color": destination.color } as React.CSSProperties
      }
    >
      <div className="landing-haze" />
      <div className="landing-orbit" />
      <div className="landing-orbit second" />
      <div className="landing-intro">
        <div className="realm-eyebrow">
          <span /> A SOFTER CORNER OF THE UNIVERSE
        </div>
        <h1>
          Hi Nancy,
          <br />
          welcome to
          <br />
          <em>your calm spot.</em>
        </h1>
        <p>A little world that asks nothing of you.</p>
        <button
          className="dusk-toggle"
          onClick={() => setDusk((v) => !v)}
          aria-pressed={dusk}
        >
          <span className="tiny-moon" />
          {dusk ? "Golden hour" : "After the world goes quiet"}
        </button>
      </div>
      <div
        className="island-spotlight rotating-carousel"
        key={destination.id}
        onWheel={(e) => {
          if (Date.now() - wheelTime.current < 650) return;
          if (Math.abs(e.deltaX) > 15 || e.shiftKey) {
            wheelTime.current = Date.now();
            preview(index + (e.deltaX + e.deltaY > 0 ? 1 : -1));
          }
        }}
      >
        <button
          className="carousel-neighbor previous"
          aria-label="Rotate to previous island"
          onClick={() => preview(index - 1)}
        >
          <IslandArt kind={destinations[(index + 3) % 4].id} />
        </button>
        <button
          className="carousel-neighbor next"
          aria-label="Rotate to next island"
          onClick={() => preview(index + 1)}
        >
          <IslandArt kind={destinations[(index + 1) % 4].id} />
        </button>
        <span className="spotlight-halo" />
        <button
          className="hero-island"
          onPointerDown={(e) => {
            swipe.current = { x: e.clientX, moved: false };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            if (swipe.current && Math.abs(e.clientX - swipe.current.x) > 55) {
              swipe.current.moved = true;
              preview(index + (e.clientX < swipe.current.x ? 1 : -1));
            }
          }}
          onClick={() => {
            if (swipe.current?.moved) {
              swipe.current = null;
              return;
            }
            onTravel(destination.id);
          }}
          aria-label={`Visit ${destination.name}`}
        >
          <IslandArt kind={destination.id} />
        </button>
        <span className="spotlight-coordinate">
          {destination.note} <i /> {String(index + 1).padStart(2, "0")} / 04
        </span>
      </div>
      <div
        className="destination-story"
        key={`story-${destination.id}`}
        aria-live="polite"
      >
        <span>{destination.eyebrow}</span>
        <h2>{destination.name}</h2>
        <p>{destination.description}</p>
        <button onClick={() => onTravel(destination.id)}>
          {destination.verb}
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="landing-wayfinder">
        <div className="destination-tabs" aria-label="Preview an island">
          {destinations.map((d, i) => (
            <button
              key={d.id}
              aria-label={`Preview ${d.name}`}
              aria-pressed={index === i}
              className={index === i ? "active" : ""}
              onClick={() => preview(i)}
            >
              <span>0{i + 1}</span>
              <b>{d.name}</b>
              <i />
            </button>
          ))}
        </div>
        <div className="landing-controls">
          <button
            aria-label="Previous island preview"
            onClick={() => preview(index - 1)}
          >
            <ArrowLeft size={16} />
          </button>
          <button
            aria-label="Next island preview"
            onClick={() => preview(index + 1)}
          >
            <ArrowRight size={16} />
          </button>
          <span />
          <button
            aria-label={
              drifting ? "Pause island drifting" : "Let the islands drift"
            }
            aria-pressed={drifting}
            onClick={() => setDrifting((v) => !v)}
          >
            {drifting ? <Pause size={13} /> : <Play size={13} />}
            <small>{drifting ? "Drifting" : "Drift"}</small>
          </button>
        </div>
      </div>
      <div className="landing-footnote">
        <Wind size={12} />
        Take your time. The world can wait.
      </div>
    </section>
  );
}
