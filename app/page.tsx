"use client";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Plus,
  MousePointer2,
  GitBranch,
  Volume2,
  VolumeX,
  Download,
  Upload,
  X,
  ArrowUpRight,
  Check,
  Trash2,
  HelpCircle,
  Moon,
  Star,
} from "lucide-react";

type SkyStar = {
  id: string;
  x: number;
  y: number;
  title: string;
  note: string;
  color: string;
};
type Sky = { stars: SkyStar[]; edges: [string, string][]; name: string };
const key = "starwoven-sky-v1";
const initial: Sky = {
  name: "My little universe",
  stars: [
    {
      id: "a",
      x: 25,
      y: 43,
      title: "Where it all begins",
      note: "Every little universe starts with a single thought. This one is mine.",
      color: "#e9d1a2",
    },
    {
      id: "b",
      x: 38,
      y: 29,
      title: "Things I’m becoming",
      note: "A little braver. A little softer. More myself.",
      color: "#d5b7fa",
    },
    {
      id: "c",
      x: 49,
      y: 47,
      title: "A quiet kind of magic",
      note: "The light through the window. A familiar song. Finding beauty in ordinary things.",
      color: "#e9d1a2",
    },
    {
      id: "d",
      x: 64,
      y: 35,
      title: "Someday, somewhere",
      note: "A small house, a big window, and a sky full of possibility.",
      color: "#a9d8e5",
    },
    {
      id: "e",
      x: 73,
      y: 59,
      title: "Keep a little wonder",
      note: "There are still so many beautiful things I haven’t met yet.",
      color: "#d5b7fa",
    },
  ],
  edges: [
    ["a", "b"],
    ["b", "c"],
    ["c", "d"],
    ["d", "e"],
  ],
};
const colors = ["#e9d1a2", "#d5b7fa", "#a9d8e5", "#efaab9"];
function validSky(value: unknown): value is Sky {
  const s = value as Sky;
  return (
    !!s &&
    typeof s.name === "string" &&
    s.name.length <= 100 &&
    Array.isArray(s.stars) &&
    s.stars.length <= 500 &&
    s.stars.every(
      (v) =>
        typeof v.id === "string" &&
        typeof v.title === "string" &&
        typeof v.note === "string" &&
        colors.includes(v.color) &&
        Number.isFinite(v.x) &&
        v.x >= 3 &&
        v.x <= 97 &&
        Number.isFinite(v.y) &&
        v.y >= 8 &&
        v.y <= 88,
    ) &&
    new Set(s.stars.map((v) => v.id)).size === s.stars.length &&
    Array.isArray(s.edges) &&
    s.edges.length <= 2500 &&
    s.edges.every(
      (e) =>
        Array.isArray(e) &&
        e.length === 2 &&
        e[0] !== e[1] &&
        e.every((id) => s.stars.some((v) => v.id === id)),
    )
  );
}
export default function Home() {
  const [sky, setSky] = useState<Sky>(initial),
    [ready, setReady] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [mode, setMode] = useState<"explore" | "add" | "connect">("explore"),
    [anchor, setAnchor] = useState<string | null>(null),
    [sound, setSound] = useState(false),
    [help, setHelp] = useState(false),
    [toast, setToast] = useState(""),
    [storageError, setStorageError] = useState(false);
  const helpPanel = useRef<HTMLElement | null>(null);
  const audio = useRef<AudioContext | null>(null),
    voices = useRef<OscillatorNode[]>([]),
    file = useRef<HTMLInputElement>(null),
    drag = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(
      null,
    ),
    canvas = useRef<HTMLDivElement>(null);
  const current = sky.stars.find((s) => s.id === selected);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (validSky(parsed)) setSky(parsed);
        else setToast("Saved sky could not be read. Your sample sky is open.");
      }
    } catch {
      setStorageError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify(sky));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
  }, [sky, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  useEffect(() => {
    if (!help) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = helpPanel.current;
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    focusable()[0]?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelp(false);
      if (e.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [help]);
  function chime() {
    if (!sound || !audio.current) return;
    const ctx = audio.current,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = [523.25, 659.25, 783.99, 1046.5][
      Math.floor(Math.random() * 4)
    ];
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 2);
  }
  async function toggleSound() {
    try {
      if (sound) {
        voices.current.forEach((v) => v.stop());
        voices.current = [];
        setSound(false);
        return;
      }
      const ctx = audio.current ?? new AudioContext();
      audio.current = ctx;
      await ctx.resume();
      [130.81, 196, 261.63].forEach((f, i) => {
        const o = ctx.createOscillator(),
          g = ctx.createGain();
        o.frequency.value = f;
        o.detune.value = i * 2;
        g.gain.value = 0.012;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        voices.current.push(o);
      });
      setSound(true);
    } catch {
      setToast("Audio is unavailable in this browser.");
    }
  }
  function choose(id: string) {
    chime();
    if (mode === "connect") {
      if (!anchor) {
        setAnchor(id);
        return;
      }
      if (anchor !== id)
        setSky((s) => ({
          ...s,
          edges: s.edges.some((e) => e.includes(anchor) && e.includes(id))
            ? s.edges.filter((e) => !(e.includes(anchor) && e.includes(id)))
            : [...s.edges, [anchor, id]],
        }));
      setAnchor(null);
    } else setSelected(id);
  }
  function add(x: number, y: number) {
    if (sky.stars.length >= 500) {
      setToast(
        "Your sky has reached 500 stars. Export it to begin another chapter.",
      );
      return;
    }
    const id = crypto.randomUUID();
    setSky((s) => ({
      ...s,
      stars: [
        ...s.stars,
        {
          id,
          x: Math.min(97, Math.max(3, x)),
          y: Math.min(88, Math.max(8, y)),
          title: "An untitled thought",
          note: "",
          color: colors[0],
        },
      ],
    }));
    setSelected(id);
    setMode("explore");
    chime();
  }
  function update(p: Partial<SkyStar>) {
    setSky((s) => ({
      ...s,
      stars: s.stars.map((v) => (v.id === selected ? { ...v, ...p } : v)),
    }));
  }
  function changeMode(m: typeof mode) {
    setMode(m);
    setAnchor(null);
    setSelected(null);
  }
  function download() {
    const a = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(sky, null, 2)], { type: "application/json" }),
    );
    a.href = url;
    a.download = "my-starwoven-sky.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Your universe, tucked safely into a file.");
  }
  async function importSky(f?: File) {
    if (!f) return;
    try {
      if (f.size > 2000000) throw Error();
      const parsed = JSON.parse(await f.text());
      if (!validSky(parsed)) throw Error();
      if (
        !confirm(
          "Replace your current sky with this file? Export first if you want to keep it.",
        )
      )
        return;
      setSky(parsed);
      setSelected(null);
      setAnchor(null);
      setToast("Welcome back to your universe.");
    } catch {
      setToast("That file is not a valid Starwoven sky.");
    } finally {
      if (file.current) file.current.value = "";
    }
  }
  return (
    <main className="app">
      <header>
        <a className="brand" href="/" aria-label="Starwoven home">
          <span className="brand-icon">✧</span> starwoven
          <span className="brand-dot">✦</span>
        </a>
        <span className="header-tag">A LITTLE UNIVERSE OF YOUR OWN</span>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setHelp(true)}
            aria-label="How to use Starwoven"
          >
            <HelpCircle size={18} />
          </button>
          <span className="divider" />
          <button className="export-button" onClick={download}>
            <Download size={15} /> <span>Export sky</span>
          </button>
        </div>
      </header>
      <section className="intro">
        <div className="eyebrow">
          <span /> YOUR THOUGHTS BELONG AMONG THE STARS
        </div>
        <h1>
          A place for your <em>little infinities.</em>
        </h1>
        <p>Leave a thought. Make a connection. Let your universe unfold.</p>
      </section>
      <div className="workspace-bar">
        <div className="sky-title">
          <span className="small-moon">
            <Moon size={17} />
          </span>
          <input
            aria-label="Name your sky"
            maxLength={100}
            value={sky.name}
            onChange={(e) => setSky((s) => ({ ...s, name: e.target.value }))}
          />
          <span className="private-label">JUST FOR YOU</span>
        </div>
        <span className={`saved ${storageError ? "error" : ""}`}>
          <span />
          {!ready
            ? "Opening your sky…"
            : storageError
              ? "Storage unavailable · export to keep your sky"
              : "Saved on this device"}
        </span>
      </div>
      <section
        className={`sky mode-${mode}`}
        ref={canvas}
        aria-label="Interactive constellation sky. In Add a star mode, press Enter to place a star at the center."
        tabIndex={0}
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            e.key === "Enter" &&
            mode === "add"
          ) {
            e.preventDefault();
            add(50, 42);
          }
          if (e.key === "Escape") {
            setSelected(null);
            setAnchor(null);
          }
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            if (mode === "add") {
              const r = e.currentTarget.getBoundingClientRect();
              add(
                ((e.clientX - r.left) / r.width) * 100,
                ((e.clientY - r.top) / r.height) * 100,
              );
            } else setSelected(null);
          }
        }}
      >
        <div className="nebula nebula-one" />
        <div className="nebula nebula-two" />
        <div className="sky-grain" />
        <div className="background-stars" aria-hidden="true">
          {Array.from({ length: 95 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 37.73 + 7) % 100}%`,
                top: `${(i * 23.13 + 11) % 100}%`,
                width: i % 9 === 0 ? 3 : 1.5,
                height: i % 9 === 0 ? 3 : 1.5,
                opacity: 0.15 + (i % 7) * 0.09,
                animationDelay: `${i % 8}s`,
              }}
            />
          ))}
        </div>
        <div className="sky-corner">
          <span className="live-dot" /> THE NIGHT IS YOURS
        </div>
        <div className="sky-coordinate">
          23° 26′ N &nbsp; / &nbsp; IN YOUR OWN TIME
        </div>
        <svg
          className="connections"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          {sky.edges.map(([a, b]) => {
            const s = sky.stars.find((v) => v.id === a),
              t = sky.stars.find((v) => v.id === b);
            return s && t ? (
              <line
                key={[a, b].sort().join("-")}
                x1={`${s.x}%`}
                y1={`${s.y}%`}
                x2={`${t.x}%`}
                y2={`${t.y}%`}
              />
            ) : null;
          })}
        </svg>
        <div className="constellation-name">
          the art of becoming <span>✧</span>
        </div>
        {sky.stars.map((s, i) => (
          <button
            key={s.id}
            className={`thought-star ${selected === s.id ? "selected" : ""} ${anchor === s.id ? "anchored" : ""}`}
            style={
              {
                left: `${s.x}%`,
                top: `${s.y}%`,
                "--star-color": s.color,
              } as React.CSSProperties
            }
            aria-label={`Open star: ${s.title}`}
            onPointerDown={(e) => {
              if (mode !== "explore") return;
              drag.current = {
                id: s.id,
                x: e.clientX,
                y: e.clientY,
                moved: false,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || d.id !== s.id || !canvas.current) return;
              if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5)
                d.moved = true;
              if (d.moved) {
                const r = canvas.current.getBoundingClientRect();
                setSky((old) => ({
                  ...old,
                  stars: old.stars.map((v) =>
                    v.id === s.id
                      ? {
                          ...v,
                          x: Math.max(
                            3,
                            Math.min(
                              97,
                              ((e.clientX - r.left) / r.width) * 100,
                            ),
                          ),
                          y: Math.max(
                            8,
                            Math.min(
                              88,
                              ((e.clientY - r.top) / r.height) * 100,
                            ),
                          ),
                        }
                      : v,
                  ),
                }));
              }
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!drag.current?.moved) choose(s.id);
              drag.current = null;
            }}
          >
            <span className="star-halo" />
            <span className="star-symbol">{i % 3 === 0 ? "✦" : "✧"}</span>
            <span className="star-label">{s.title}</span>
          </button>
        ))}
        {sky.stars.length === 0 && (
          <div className="empty-sky">
            <Sparkles size={32} />
            <h2>Your universe starts here.</h2>
            <button onClick={() => add(50, 42)}>
              Create your first star <Plus size={15} />
            </button>
          </div>
        )}
        <div className="sky-bottom-hint">
          {mode === "add"
            ? "Click anywhere in the sky to leave a thought"
            : mode === "connect"
              ? anchor
                ? "Now choose another star · select an existing pair to disconnect"
                : "Choose two stars to weave a connection"
              : "Every star holds a story. Click one to discover it."}
        </div>
        <div className="sky-stats">
          <Star size={12} />
          {sky.stars.length} stars <span>·</span>
          {sky.edges.length} connections
        </div>
        {current && (
          <aside className="editor" aria-label="Edit star">
            <div className="editor-top">
              <span>✧ A LITTLE PIECE OF YOU</span>
              <button onClick={() => setSelected(null)} aria-label="Close star">
                <X size={17} />
              </button>
            </div>
            <input
              className="note-title"
              aria-label="Star title"
              value={current.title}
              maxLength={80}
              onChange={(e) => update({ title: e.target.value })}
            />
            <textarea
              autoFocus
              placeholder="What’s on your mind? A memory, a wish, a thought worth keeping…"
              aria-label="Write your thought"
              value={current.note}
              maxLength={10000}
              onChange={(e) => update({ note: e.target.value })}
            />
            <div className="editor-bottom">
              <div className="color-picker">
                {colors.map((c) => (
                  <button
                    key={c}
                    aria-label={`Star color ${c}`}
                    aria-pressed={current.color === c}
                    onClick={() => update({ color: c })}
                    style={{ background: c }}
                  >
                    {current.color === c && <Check size={12} />}
                  </button>
                ))}
              </div>
              <button
                className="delete"
                aria-label="Delete star"
                onClick={() => {
                  if (
                    !confirm(
                      "Let this star go? Its writing and connections will be removed.",
                    )
                  )
                    return;
                  setSky((s) => ({
                    ...s,
                    stars: s.stars.filter((v) => v.id !== selected),
                    edges: s.edges.filter((e) => !e.includes(selected!)),
                  }));
                  setSelected(null);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
            <p className="note-saved">Your words are saved as you write.</p>
          </aside>
        )}
        <div className="toolbar">
          <div className="tools">
            <button
              className={mode === "explore" ? "active" : ""}
              onClick={() => changeMode("explore")}
              aria-pressed={mode === "explore"}
            >
              <MousePointer2 size={16} />
              <span>Explore</span>
            </button>
            <button
              className={mode === "add" ? "active" : ""}
              onClick={() => changeMode("add")}
              aria-pressed={mode === "add"}
            >
              <Plus size={18} />
              <span>Add a star</span>
            </button>
            <button
              className={mode === "connect" ? "active" : ""}
              onClick={() => changeMode("connect")}
              aria-pressed={mode === "connect"}
            >
              <GitBranch size={17} />
              <span>Connect</span>
            </button>
          </div>
          <span className="toolbar-divider" />
          <button
            className={`sound-button ${sound ? "sound-on" : ""}`}
            onClick={toggleSound}
            aria-label={sound ? "Mute ambient sound" : "Enable ambient sound"}
            aria-pressed={sound}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
        </div>
      </section>
      <section className="below-sky">
        <p>
          <span>✧</span> No right words. No perfect shapes. Just you, and a sky
          of possibilities.
        </p>
        <button onClick={() => file.current?.click()}>
          <Upload size={13} /> Import a sky <ArrowUpRight size={13} />
        </button>
        <input
          type="file"
          accept="application/json,.json"
          ref={file}
          hidden
          onChange={(e) => void importSky(e.target.files?.[0])}
        />
      </section>
      <footer>
        <span>MADE OF STARDUST & LITTLE THOUGHTS</span>
        <span>
          Take a breath. You’re right where you need to be.{" "}
          <span className="footer-spark">✦</span>
        </span>
      </footer>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            ref={helpPanel}
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Your guide to Starwoven"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close guide"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
            <span className="help-spark">✧</span>
            <h2>A universe, in your own words.</h2>
            <p>
              <b>Add a star</b>, then click the sky to plant a thought. Tap a
              star to write inside it, or drag it to a new home.
            </p>
            <p>
              Choose <b>Connect</b> and tap two stars to draw a thread between
              them. Select the same pair again to remove the thread.
            </p>
            <p>
              Turn on sound for a gentle ambient hum and musical stars. Your sky
              saves in this browser. <b>Export</b> a copy to keep it safe or
              move it to another device; <b>Import</b> brings it back.
            </p>
            <p className="privacy-note">
              No account. No public posts. Your words stay on this device.
              Clearing browser data removes them, so keep an export of anything
              precious.
            </p>
            <button className="primary-button" onClick={() => setHelp(false)}>
              Back to my sky <Sparkles size={15} />
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
