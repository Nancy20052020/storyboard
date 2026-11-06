"use client";
import { useEffect, useRef, useState } from "react";
import {
  Flower2,
  Play,
  Pause,
  Trash2,
  Check,
  Shuffle,
  X,
  Sun,
  Moon,
  Headphones,
  Move,
  Plus,
  Undo2,
} from "lucide-react";
import {
  flowers,
  notes,
  readGarden,
  initialGarden,
  type Garden,
  type FlowerKind,
} from "@/lib/garden";
const key = "starwoven-everbloom-v1";
export default function Everbloom({
  sound,
  onEnableSound,
  onNote,
  onOpenMusic,
}: {
  sound: boolean;
  onEnableSound: () => Promise<void>;
  onNote: (frequency: number, kind: string) => void;
  onOpenMusic: () => void;
}) {
  const [garden, setGarden] = useState<Garden>(initialGarden),
    [ready, setReady] = useState(false),
    [seed, setSeed] = useState<FlowerKind>("rose"),
    [selected, setSelected] = useState<string | null>(null),
    [playing, setPlaying] = useState(false),
    [step, setStep] = useState(-1),
    [saved, setSaved] = useState(true),
    [message, setMessage] = useState(""),
    [palette, setPalette] = useState(false),
    [dawn, setDawn] = useState(false),
    [mode, setMode] = useState<"plant" | "arrange">("plant"),
    [newSize, setNewSize] = useState(1),
    [undo, setUndo] = useState<string[]>([]);
  const current = useRef(garden),
    note = useRef(onNote),
    field = useRef<HTMLDivElement>(null),
    drag = useRef<{
      id: string;
      x: number;
      y: number;
      px: number;
      py: number;
      moved: boolean;
    } | null>(null),
    moved = useRef(false);
  current.current = garden;
  note.current = onNote;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = readGarden(JSON.parse(raw));
        if (parsed) setGarden(parsed);
        else setMessage("Your previous planting could not be read.");
      }
    } catch {
      setSaved(false);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(garden));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [garden, ready]);
  useEffect(() => {
    if (!playing) {
      setStep(-1);
      return;
    }
    let index = 0;
    const tick = () => {
      const plants = current.current.plants;
      if (!plants.length) {
        setPlaying(false);
        return;
      }
      const i = index % plants.length;
      setStep(i);
      note.current(notes[plants[i].note].frequency, plants[i].kind);
      index++;
    };
    tick();
    const timer = setInterval(tick, 60000 / garden.tempo);
    return () => clearInterval(timer);
  }, [playing, garden.tempo]);
  async function toggle() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (!sound) await onEnableSound();
    setPlaying(true);
  }
  function add(x: number, y: number) {
    if (garden.plants.length >= 200) {
      setMessage(
        "Your garden holds 200 flowers. Remove a planting to make room.",
      );
      return;
    }
    const id = crypto.randomUUID(),
      n = garden.plants.length % 8;
    setGarden((g) => ({
      ...g,
      plants: [
        ...g.plants,
        {
          id,
          kind: seed,
          note: n,
          x: Math.max(2, Math.min(98, x)),
          y: Math.max(8, Math.min(94, y)),
          size: newSize,
        },
      ],
    }));
    setUndo((u) => [...u, id]);
    setSelected(id);
    onNote(notes[n].frequency, seed);
  }
  const bloom = garden.plants.find((p) => p.id === selected),
    chosen = flowers.find((f) => f.id === seed)!,
    selectedFlower = flowers.find((f) => f.id === bloom?.kind);
  return (
    <section
      className={`everbloom-scene botanical-garden free-garden ${dawn ? "garden-at-dawn" : ""}`}
      aria-label="Everbloom musical garden"
    >
      <div className="botanical-backdrop" />
      <div className="garden-weather" aria-hidden="true">
        {Array.from({ length: 28 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37.3 + 7) % 100}%`,
              top: `${(i * 23.7 + 9) % 90}%`,
              animationDelay: `${i % 7}s`,
            }}
          />
        ))}
      </div>
      <div className="place-heading">
        <div className="realm-eyebrow">
          <span /> THE BOTANICAL CONSERVATORY
        </div>
        <h1>
          Let something
          <br />
          <em>beautiful take root.</em>
        </h1>
        <p>Plant where you like. Make a place that feels like you.</p>
      </div>
      <button
        className="garden-light-switch"
        onClick={() => setDawn((v) => !v)}
        aria-pressed={dawn}
      >
        {dawn ? <Sun size={14} /> : <Moon size={14} />}{" "}
        {dawn ? "First light" : "Moonlight"}
      </button>
      <div
        ref={field}
        className={`free-flower-field mode-${mode}`}
        role="group"
        aria-label="Free planting garden. Click to plant; drag flowers to move."
        tabIndex={0}
        onKeyDown={(e) => {
          if (
            e.target === e.currentTarget &&
            e.key === "Enter" &&
            mode === "plant"
          ) {
            e.preventDefault();
            add(50, 79);
          }
        }}
        onClick={(e) => {
          if (e.target !== e.currentTarget || mode !== "plant") return;
          const r = e.currentTarget.getBoundingClientRect();
          add(
            ((e.clientX - r.left) / r.width) * 100,
            ((e.clientY - r.top) / r.height) * 100,
          );
        }}
      >
        {garden.plants.map((p, i) => {
          const f = flowers.find((f) => f.id === p.kind)!;
          return (
            <button
              key={p.id}
              className={`garden-patch planted free-plant ${selected === p.id ? "picked" : ""} ${step === i ? "sounding" : ""}`}
              aria-label={`${f.name} planting ${i + 1}, note ${notes[p.note].name}`}
              style={
                {
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  "--plant-scale": p.size,
                  "--bloom-color": f.color,
                  zIndex: Math.round(p.y),
                } as React.CSSProperties
              }
              onPointerDown={(e) => {
                e.stopPropagation();
                drag.current = {
                  id: p.id,
                  x: e.clientX,
                  y: e.clientY,
                  px: p.x,
                  py: p.y,
                  moved: false,
                };
                moved.current = false;
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d || d.id !== p.id || !field.current) return;
                if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4)
                  d.moved = true;
                if (d.moved) {
                  moved.current = true;
                  const r = field.current.getBoundingClientRect();
                  setGarden((g) => ({
                    ...g,
                    plants: g.plants.map((v) =>
                      v.id === p.id
                        ? {
                            ...v,
                            x: Math.max(
                              2,
                              Math.min(
                                98,
                                d.px + ((e.clientX - d.x) / r.width) * 100,
                              ),
                            ),
                            y: Math.max(
                              8,
                              Math.min(
                                94,
                                d.py + ((e.clientY - d.y) / r.height) * 100,
                              ),
                            ),
                          }
                        : v,
                    ),
                  }));
                }
              }}
              onPointerUp={() => {
                drag.current = null;
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(p.id);
                if (!moved.current) onNote(notes[p.note].frequency, p.kind);
                moved.current = false;
              }}
            >
              <span className="plant-ground-shadow" />
              <span
                className={`botanical-specimen specimen-${f.tile}`}
                aria-hidden="true"
              />
              <span className="plant-note-label">
                {f.name}
                <small>{Math.round(p.size * 100)}%</small>
              </span>
            </button>
          );
        })}
      </div>
      <aside
        className={`seed-cabinet ${palette ? "is-open" : ""}`}
        aria-label="Flower collection"
      >
        <div className="seed-cabinet-heading">
          <div>
            <span className="card-kicker">THE BOTANICAL LIBRARY</span>
            <h2>Choose what grows.</h2>
          </div>
          <button
            aria-label="Close flower collection"
            onClick={() => setPalette(false)}
          >
            <X size={16} />
          </button>
        </div>
        <p>
          Pick a flower, then click anywhere in the garden. Its roots will
          settle exactly where you click.
        </p>
        <div className="seed-list">
          {flowers.map((f) => (
            <button
              key={f.id}
              className={seed === f.id ? "chosen" : ""}
              aria-pressed={seed === f.id}
              aria-label={`Choose ${f.name}`}
              onClick={() => {
                setSeed(f.id);
                setMode("plant");
                setPalette(false);
              }}
            >
              <span
                className={`botanical-specimen specimen-${f.tile}`}
                aria-hidden="true"
              />
              <span>
                <b>{f.name}</b>
                <i>{f.latin}</i>
              </span>
              {seed === f.id && <Check size={13} />}
            </button>
          ))}
        </div>
        <label className="new-flower-size">
          New flower size <span>{Math.round(newSize * 100)}%</span>
          <input
            aria-label="New flower size"
            type="range"
            min={0.4}
            max={2.2}
            step={0.05}
            value={newSize}
            onChange={(e) => setNewSize(Number(e.target.value))}
          />
        </label>
        <button
          className="garden-shuffle"
          onClick={() =>
            setGarden((g) => ({
              ...g,
              plants: g.plants.map((p) => ({
                ...p,
                note: Math.floor(Math.random() * 8),
              })),
            }))
          }
        >
          <Shuffle size={12} />
          Reimagine the melody
        </button>
      </aside>
      <div className="garden-namebar">
        <input
          aria-label="Garden name"
          maxLength={80}
          value={garden.name}
          onChange={(e) => setGarden((g) => ({ ...g, name: e.target.value }))}
        />
        <span className={saved ? "" : "storage-warning"}>
          {saved ? "Saved on this device" : "Changes may not be saved"}
        </span>
      </div>
      <div className="garden-player">
        <button
          className="open-flower-collection"
          aria-expanded={palette}
          onClick={() => setPalette((v) => !v)}
        >
          <Flower2 size={16} />
          <span>Choose flowers</span>
        </button>
        <button
          className="garden-mode"
          aria-pressed={mode === "plant"}
          onClick={() => {
            setMode((m) => (m === "plant" ? "arrange" : "plant"));
            setSelected(null);
          }}
        >
          {mode === "plant" ? <Plus size={14} /> : <Move size={14} />}
          <span>
            {mode === "plant"
              ? `Plant ${chosen.name.toLowerCase()}`
              : "Arrange"}
          </span>
        </button>
        <button
          aria-label="Undo last planting"
          disabled={!undo.length}
          onClick={() => {
            const id = undo.at(-1);
            setGarden((g) => ({
              ...g,
              plants: g.plants.filter((p) => p.id !== id),
            }));
            setUndo((u) => u.slice(0, -1));
            if (selected === id) setSelected(null);
          }}
        >
          <Undo2 size={14} />
        </button>
        <i className="instrument-separator" />
        <button
          className={`garden-play ${playing ? "is-playing" : ""}`}
          onClick={() => void toggle()}
          disabled={!garden.plants.length}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          <span>{playing ? "Pause melody" : "Garden melody"}</span>
        </button>
        <button className="garden-personal-music" onClick={onOpenMusic}>
          <Headphones size={15} />
          <span>Your music</span>
        </button>
      </div>
      {bloom && selectedFlower ? (
        <div className="bloom-editor">
          <span className="card-kicker">A FLOWER, JUST WHERE YOU WANT IT</span>
          <button
            className="bloom-editor-close"
            aria-label="Close flower details"
            onClick={() => setSelected(null)}
          >
            <X size={14} />
          </button>
          <h3>{selectedFlower.name}</h3>
          <p>Drag it to a new home, or change how it grows.</p>
          <label>
            Flower size <span>{Math.round(bloom.size * 100)}%</span>
            <input
              aria-label="Selected flower size"
              type="range"
              min={0.4}
              max={2.2}
              step={0.05}
              value={bloom.size}
              onChange={(e) =>
                setGarden((g) => ({
                  ...g,
                  plants: g.plants.map((p) =>
                    p.id === bloom.id
                      ? { ...p, size: Number(e.target.value) }
                      : p,
                  ),
                }))
              }
            />
          </label>
          <label>
            Its note
            <select
              aria-label="Bloom note"
              value={bloom.note}
              onChange={(e) => {
                const n = Number(e.target.value);
                setGarden((g) => ({
                  ...g,
                  plants: g.plants.map((p) =>
                    p.id === bloom.id ? { ...p, note: n } : p,
                  ),
                }));
                onNote(notes[n].frequency, bloom.kind);
              }}
            >
              {notes.map((n, i) => (
                <option key={i} value={i}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Melody pace <span>{garden.tempo} BPM</span>
            <input
              aria-label="Melody tempo"
              type="range"
              min={50}
              max={140}
              value={garden.tempo}
              onChange={(e) =>
                setGarden((g) => ({ ...g, tempo: Number(e.target.value) }))
              }
            />
          </label>
          <button
            aria-label="Remove selected flower"
            onClick={() => {
              setGarden((g) => ({
                ...g,
                plants: g.plants.filter((p) => p.id !== bloom.id),
              }));
              setSelected(null);
            }}
          >
            <Trash2 size={12} />
            Remove planting
          </button>
        </div>
      ) : (
        <div className="garden-under-note">
          {mode === "plant"
            ? `Click to plant ${chosen.name.toLowerCase()}.`
            : "Click a flower to resize it."}{" "}
          Drag any flower to move it.<span>{garden.plants.length} planted</span>
        </div>
      )}
      {message && (
        <div className="realm-toast" role="status">
          {message}
          <button aria-label="Dismiss message" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
    </section>
  );
}
