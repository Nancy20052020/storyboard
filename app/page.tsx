"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
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
  Mail,
  BookOpen,
  Headphones,
} from "lucide-react";
import { type IslandKind } from "@/components/IslandArt";
import MysticCompanion from "@/components/MysticCompanion";
import PersonalMusic from "@/components/PersonalMusic";
import WorldLanding from "@/components/WorldLanding";
import useRealmAudio from "@/components/useRealmAudio";
import "./realm.css";
import "./enchanted.css";
import "./immersive.css";
import "./starlight.css";
import "./atelier.css";
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
const LetterAtelier = dynamic(() => import("@/components/LetterAtelier"), {
  loading: () => <div className="realm-loading">Finding a fresh page…</div>,
});
const Stillroom = dynamic(() => import("@/components/Stillroom"), {
  loading: () => <div className="realm-loading">Keeping a place for you…</div>,
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
  {
    id: "letters" as const,
    index: "05",
    name: "Postscript",
    tag: "FOR WORDS WORTH KEEPING",
    description: "A letter, a keepsake, a little kindness.",
    icon: Mail,
  },
  {
    id: "study" as const,
    index: "06",
    name: "Stillroom",
    tag: "FOR ONE SMALL THING AT A TIME",
    description: "Find a seat. Light a candle.",
    icon: BookOpen,
  },
];
export default function Home() {
  const [place, setPlace] = useState<Place>("world"),
    [full, setFull] = useState(false),
    [showWelcome, setShowWelcome] = useState(false),
    [toast, setToast] = useState(""),
    [musicOpen, setMusicOpen] = useState(false);
  const { sound, toggle, chime, playNote, startMelody, stopMelody, error } =
    useRealmAudio(place);
  const heading = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const sync = () => {
      const hash = location.hash.slice(1);
      setPlace(
        ["sky", "forest", "lake", "garden", "letters", "study"].includes(hash)
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
          <button
            aria-label="Open personal music shelf"
            onClick={() => setMusicOpen((v) => !v)}
          >
            <Headphones size={17} />
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
          <WorldLanding onTravel={travel} onChime={chime} />
        ) : place === "sky" ? (
          <section className="observatory-scene scene-enter">
            <Observatory onChime={chime} />
          </section>
        ) : place === "forest" ? (
          <ForestGrove onChime={chime} />
        ) : place === "lake" ? (
          <Moonwell onChime={chime} />
        ) : place === "garden" ? (
          <Everbloom
            onStartMelody={startMelody}
            onStopMelody={stopMelody}
            onNote={playNote}
            onOpenMusic={() => setMusicOpen(true)}
          />
        ) : place === "letters" ? (
          <LetterAtelier onChime={chime} />
        ) : (
          <Stillroom onChime={chime} onOpenMusic={() => setMusicOpen(true)} />
        )}
      </div>
      <PersonalMusic
        open={musicOpen}
        onClose={() => setMusicOpen(false)}
        onStartPlaying={() => {
          if (sound) void toggle();
        }}
      />
      <MysticCompanion place={place} onChime={chime} />
      <nav className="island-dock portal-rail" aria-label="Island navigation">
        <button
          className={place === "world" ? "selected" : ""}
          onClick={() => travel("world")}
          aria-label="Island map"
          aria-current={place === "world" ? "page" : undefined}
        >
          <span className="portal-icon">
            <Compass size={18} />
            <i />
          </span>
          <span className="portal-label">The in-between</span>
          <span className="portal-mobile-label">Islands</span>
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
            <span className="portal-icon">
              <island.icon size={17} />
              <i />
            </span>
            <span className="portal-label">{island.name}</span>
            <span className="portal-mobile-label">
              {island.id === "sky"
                ? "Stars"
                : island.id === "forest"
                  ? "Forest"
                  : island.id === "lake"
                    ? "Lake"
                    : island.id === "garden"
                      ? "Garden"
                      : island.id === "letters"
                        ? "Letters"
                        : "Study"}
            </span>
            <small>{island.index}</small>
          </button>
        ))}
      </nav>
      <span className="realm-edition">
        THE IMMERSIVE EDITION <Heart size={9} />
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
          musical flower garden at <b>Everbloom</b>. Write and decorate letters
          in <b>Postscript</b>, or find a café or library seat in{" "}
          <b>Stillroom</b>
          and light a quiet focus candle.
        </p>
        <p>
          Choose a real star and write beside its light. Earlier thoughts are
          kept safe in Your saved thoughts, ready to be attached to a real star.
          Add your own songs from the headphone button and let them follow you
          between islands. Everything saves on this device. Clearing browser
          data removes saved writing, photos, and songs.
        </p>
        <p className="privacy-note">
          Hand drawing uses MediaPipe locally, with permission. Camera video is
          never uploaded. The photo booth only captures the still photos you
          choose to take. Leaving either camera stops it. Mouse and touch always
          work. No quests, scores, accounts, or paid services.
        </p>
      </section>
    </div>
  );
}
