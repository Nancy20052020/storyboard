"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Compass,
  Leaf,
  Stars,
  Waves,
  ChevronRight,
  Heart,
  X,
  Flower2,
} from "lucide-react";
import IslandArt, { type IslandKind } from "@/components/IslandArt";
import PipCompanion from "@/components/PipCompanion";
import useRealmAudio from "@/components/useRealmAudio";
import "./realm.css";
import "./enchanted.css";
const Observatory = dynamic(() => import("@/components/Observatory"), {
  loading: () => <div className="realm-loading">Gathering your stars…</div>,
});
const ForestGrove = dynamic(() => import("@/components/ForestGrove"), {
  loading: () => <div className="realm-loading">Following the fireflies…</div>,
});
const Moonwell = dynamic(() => import("@/components/Moonwell"), {
  loading: () => (
    <div className="realm-loading">Waiting for the water to settle…</div>
  ),
});
const Everbloom = dynamic(() => import("@/components/Everbloom"), {
  loading: () => (
    <div className="realm-loading">Waking the little flowers…</div>
  ),
});
type Place = "world" | IslandKind;
const islands = [
  {
    id: "sky" as const,
    index: "01",
    name: "Starlit Observatory",
    tag: "FOR THE THOUGHTS THAT CONNECT",
    description: "Turn your words into stars.",
    icon: Stars,
  },
  {
    id: "forest" as const,
    index: "02",
    name: "Whisperwood",
    tag: "FOR THE MAGIC IN YOUR HANDS",
    description: "Paint with a pinch of wonder.",
    icon: Leaf,
  },
  {
    id: "lake" as const,
    index: "03",
    name: "Moonwell",
    tag: "FOR THE THINGS YOU CARRY",
    description: "Let a little thought float.",
    icon: Waves,
  },
  {
    id: "garden" as const,
    index: "04",
    name: "Everbloom",
    tag: "FOR THE SONGS NOT YET SUNG",
    description: "Plant a melody. Let it bloom.",
    icon: Flower2,
  },
];
const messages = [
  "No quests. No finish line. Just a little room to be.",
  "I saved you a place among the stars.",
  "A wobbly line is still a little bit of magic.",
  "Your old stars are waiting in the Observatory.",
  "You don’t have to make anything beautiful. You can just stay.",
];
export default function Home() {
  const [place, setPlace] = useState<Place>("world"),
    [full, setFull] = useState(false),
    [mote, setMote] = useState(0),
    [showMote, setShowMote] = useState(true),
    [showWelcome, setShowWelcome] = useState(false),
    [toast, setToast] = useState("");
  const { sound, toggle, chime, playNote, error } = useRealmAudio(place);
  const heading = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const sync = () => {
      const hash = location.hash.slice(1);
      setPlace(
        ["sky", "forest", "lake", "garden"].includes(hash)
          ? (hash as IslandKind)
          : "world",
      );
    };
    sync();
    window.addEventListener("hashchange", sync);
    const onFull = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFull);
    return () => {
      window.removeEventListener("hashchange", sync);
      document.removeEventListener("fullscreenchange", onFull);
    };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [place]);
  function travel(to: Place) {
    if (place === to) return;
    location.hash = to === "world" ? "world" : to;
    setPlace(to);
    chime();
    setShowWelcome(false);
    heading.current?.focus();
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else
        setToast(
          "This browser uses the full page already. Add it to your home screen for an immersive view.",
        );
    } catch {
      setToast(
        "Fullscreen is unavailable in this browser. The world still fills your window.",
      );
    }
  }
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <main className={`realm realm-${place}`}>
      <div className="realm-atmosphere" aria-hidden="true">
        <div className="aurora aurora-a" />
        <div className="aurora aurora-b" />
        {Array.from({ length: 85 }, (_, i) => (
          <i
            className="realm-dust"
            key={i}
            style={{
              left: `${(i * 37.23 + 4) % 100}%`,
              top: `${(i * 29.57 + 7) % 100}%`,
              opacity: 0.12 + (i % 5) * 0.1,
              animationDelay: `${i % 7}s`,
              width: i % 9 === 0 ? 3 : 1.5,
              height: i % 9 === 0 ? 3 : 1.5,
            }}
          />
        ))}
        <span className="shooting-star" />
      </div>
      <header className="realm-header">
        <a
          href="#world"
          className="realm-brand"
          onClick={(e) => {
            e.preventDefault();
            travel("world");
          }}
          aria-label="Starwoven world"
        >
          <span>✧</span> starwoven<sup>✦</sup>
        </a>
        <div className="realm-breadcrumb">
          <span>A LITTLE UNIVERSE OF YOUR OWN</span>
          {place !== "world" && (
            <>
              <ChevronRight size={12} />
              <b>{islands.find((i) => i.id === place)?.name}</b>
            </>
          )}
        </div>
        <div className="realm-header-actions">
          <button
            aria-label={sound ? "Mute ambient sound" : "Enable ambient sound"}
            aria-pressed={sound}
            className={sound ? "audio-active" : ""}
            onClick={() => void toggle()}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
            <span>{sound ? "Sound on" : "Sound off"}</span>
          </button>
          <i />
          <button
            onClick={() => void fullscreen()}
            aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {full ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>
          <button
            className="world-info"
            onClick={() => setShowWelcome(true)}
            aria-label="About this world"
          >
            ?
          </button>
        </div>
      </header>
      {place !== "world" && (
        <button className="back-to-world" onClick={() => travel("world")}>
          <ArrowLeft size={13} /> Back to the islands
        </button>
      )}
      <div
        ref={heading}
        tabIndex={-1}
        className="realm-content"
        aria-label={
          place === "world"
            ? "Island map"
            : islands.find((i) => i.id === place)?.name
        }
      >
        {place === "world" ? (
          <section
            className="world-map scene-enter"
            aria-label="Explore your floating islands"
          >
            <div className="map-intro">
              <div className="realm-eyebrow">
                <span /> SOMEWHERE SOFT TO LAND
              </div>
              <h1>
                A world between
                <br />a thought <em>& a dream.</em>
              </h1>
              <p>
                Little islands. Endless possibilities.
                <br />
                Follow your curiosity. There’s no wrong way to wander.
              </p>
              <div className="map-invitation">
                <span>✧</span> CHOOSE AN ISLAND TO BEGIN{" "}
                <span className="invitation-line" />
              </div>
            </div>
            <div className="islands-scene">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <svg
                className="island-paths"
                viewBox="0 0 1000 650"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M360 190Q540 100 730 280T370 500"
                  stroke="#b2a8cb"
                  strokeOpacity=".17"
                  strokeWidth="1"
                  strokeDasharray="2 9"
                  fill="none"
                />
                <circle cx="560" cy="183" r="3" fill="#d6c4a5" opacity=".5" />
                <path
                  d="m630 424 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"
                  fill="#d6c4a5"
                  opacity=".55"
                />
              </svg>
              {islands.map((island) => (
                <button
                  key={island.id}
                  className={`island island-${island.id}`}
                  onClick={() => travel(island.id)}
                  aria-label={`Visit ${island.name}`}
                >
                  <span className="island-aura" />
                  <IslandArt kind={island.id} />
                  <span className="island-label">
                    <span className="island-index">
                      {island.index} <i />
                    </span>
                    <span className="island-tag">{island.tag}</span>
                    <strong>
                      {island.name}
                      <ArrowUpRight size={17} />
                    </strong>
                    <span className="island-description">
                      {island.description}
                    </span>
                  </span>
                </button>
              ))}
              <span className="map-coordinate coord-one">
                ∞° N · YOUR OWN PACE
              </span>
              <span className="map-coordinate coord-two">
                YOU ARE ALLOWED TO JUST BE HERE
              </span>
              <div className="map-moon" aria-hidden="true" />
            </div>
            <div className="world-bottom">
              <div className="companion-wrap">
                <button
                  className="mote-character"
                  onClick={() => {
                    setShowMote(true);
                    setMote((m) => (m + 1) % messages.length);
                    chime();
                  }}
                  aria-label="Talk to Mote, your little star companion"
                >
                  <span className="mote-wings" />
                  <span className="mote-body">
                    <i />
                    <i />
                  </span>
                  <span className="mote-spark">✦</span>
                </button>
                {showMote && (
                  <div className="companion-message">
                    <span>MOTE, YOUR LITTLE COMPANION</span>
                    <p>{messages[mote]}</p>
                    <button
                      aria-label="Hide Mote’s message"
                      onClick={() => setShowMote(false)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="world-footnote">
                <span className="live-dot" /> A PRIVATE LITTLE WORLD{" "}
                <p>No accounts. No noise. Just you.</p>
              </div>
            </div>
          </section>
        ) : place === "sky" ? (
          <section className="observatory-scene scene-enter">
            <Observatory onChime={chime} />
          </section>
        ) : place === "forest" ? (
          <ForestGrove onChime={chime} />
        ) : place === "lake" ? (
          <Moonwell onChime={chime} />
        ) : (
          <Everbloom sound={sound} onEnableSound={toggle} onNote={playNote} />
        )}
      </div>
      <PipCompanion place={place} onChime={chime} />
      <nav className="island-dock" aria-label="Island navigation">
        <button
          className={place === "world" ? "selected" : ""}
          onClick={() => travel("world")}
          aria-label="Island map"
          aria-current={place === "world" ? "page" : undefined}
        >
          <Compass size={18} />
          <span>The in-between</span>
        </button>
        <i />
        {islands.map((island) => (
          <button
            key={island.id}
            className={place === island.id ? "selected" : ""}
            onClick={() => travel(island.id)}
            aria-label={island.name}
            aria-current={place === island.id ? "page" : undefined}
          >
            <island.icon size={17} />
            <span>{island.name}</span>
            <small>{island.index}</small>
          </button>
        ))}
      </nav>
      <span className="realm-edition">
        ENCHANTED EDITION · FOUR ISLANDS <Heart size={9} />
      </span>
      {(toast || error) && (
        <div className="realm-toast" role="status">
          {toast || error}
        </div>
      )}
      {showWelcome && <WorldGuide onClose={() => setShowWelcome(false)} />}
    </main>
  );
}
function WorldGuide({ onClose }: { onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    close.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        e.preventDefault();
        close.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="world-guide"
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to your little universe"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={close}
          className="modal-close"
          onClick={onClose}
          aria-label="Close world guide"
        >
          <X size={18} />
        </button>
        <span className="letter-spark">✧</span>
        <div className="realm-eyebrow">
          NOTHING TO FINISH. EVERYTHING TO FEEL.
        </div>
        <h2>
          A little world,
          <br />
          <em>entirely your own.</em>
        </h2>
        <p>
          Write your thoughts into stars at the <b>Starlit Observatory</b>.
          Paint glowing trails with your hand in <b>Whisperwood</b>. Leave a
          thought on the water, or pause for a breath at <b>Moonwell</b>. Grow a
          musical flower garden at <b>Everbloom</b>, or meet the zodiac
          constellations in the Observatory’s illustrated atlas.
        </p>
        <p>
          Your original constellation journal is still here, with its saved
          stars. Everything saves in this browser; clearing browser data removes
          it. Export precious writing and drawings to keep them safe.
        </p>
        <p className="privacy-note">
          Hand drawing uses MediaPipe locally, with permission. Camera video is
          never uploaded or recorded. Turn it off any time; leaving the grove
          stops the camera. Mouse and touch always work. No quests, scores,
          accounts, or paid services.
        </p>
      </section>
    </div>
  );
}
