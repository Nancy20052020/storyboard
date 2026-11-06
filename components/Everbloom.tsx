"use client";
import { useEffect, useRef, useState } from "react";
import {
  Flower2,
  Play,
  Pause,
  Trash2,
  Volume2,
  Check,
  Music2,
  Shuffle,
  X,
  Sun,
  Moon,
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
}: {
  sound: boolean;
  onEnableSound: () => Promise<void>;
  onNote: (frequency: number, kind: string) => void;
}) {
  const [garden, setGarden] = useState<Garden>(initialGarden),
    [ready, setReady] = useState(false),
    [seed, setSeed] = useState<FlowerKind>("rose"),
    [selected, setSelected] = useState<number | null>(null),
    [playing, setPlaying] = useState(false),
    [step, setStep] = useState(-1),
    [saved, setSaved] = useState(true),
    [message, setMessage] = useState(""),
    [palette, setPalette] = useState(false),
    [dawn, setDawn] = useState(false);
  const current = useRef(garden),
    note = useRef(onNote);
  current.current = garden;
  note.current = onNote;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = readGarden(JSON.parse(raw));
        if (parsed) setGarden(parsed);
        else
          setMessage(
            "Your previous garden could not be read. A new planting is waiting.",
          );
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
    let i = 0;
    const tick = () => {
      setStep(i);
      const b = current.current.blooms[i];
      if (b) note.current(notes[b.note].frequency, b.kind);
      i = (i + 1) % current.current.blooms.length;
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
  function plant(i: number) {
    const b = garden.blooms[i];
    if (b) {
      setSelected(i);
      onNote(notes[b.note].frequency, b.kind);
    } else {
      const n = i % 8;
      setGarden((g) => ({
        ...g,
        blooms: g.blooms.map((b, j) => (j === i ? { kind: seed, note: n } : b)),
      }));
      setSelected(i);
      onNote(notes[n].frequency, seed);
    }
  }
  const chosen = flowers.find((f) => f.id === seed)!,
    bloom = selected !== null ? garden.blooms[selected] : null,
    selectedFlower = flowers.find((f) => f.id === bloom?.kind);
  return (
    <section
      className={`everbloom-scene botanical-garden ${dawn ? "garden-at-dawn" : ""}`}
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
        <p>A living garden. A composition only you could grow.</p>
      </div>
      <button
        className="garden-light-switch"
        onClick={() => setDawn((v) => !v)}
        aria-pressed={dawn}
      >
        {dawn ? <Sun size={14} /> : <Moon size={14} />}{" "}
        {dawn ? "First light" : "Moonlight"}
      </button>
      <div className="everbloom-layout">
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
            Choose a flower, then an open patch in the garden. Each species
            carries its own quiet note.
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
          <button
            className="garden-shuffle"
            onClick={() =>
              setGarden((g) => ({
                ...g,
                blooms: g.blooms.map((b) =>
                  b ? { ...b, note: Math.floor(Math.random() * 8) } : null,
                ),
              }))
            }
          >
            <Shuffle size={12} />
            Reimagine the melody
          </button>
        </aside>
        <div className="garden-instrument">
          <div className="garden-namebar">
            <input
              aria-label="Garden name"
              maxLength={80}
              value={garden.name}
              onChange={(e) =>
                setGarden((g) => ({ ...g, name: e.target.value }))
              }
            />
            <span className={saved ? "" : "storage-warning"}>
              {saved ? "Saved on this device" : "Changes may not be saved"}
            </span>
          </div>
          <div className="enchanted-flowerbed" aria-label="Your planting beds">
            {garden.blooms.map((b, i) => {
              const f = flowers.find((f) => f.id === b?.kind),
                row = Math.floor(i / 8);
              return (
                <button
                  key={i}
                  className={`garden-patch ${b ? "planted" : "empty"} ${selected === i ? "picked" : ""} ${step === i ? "sounding" : ""}`}
                  aria-label={
                    b
                      ? `Bloom ${i + 1}: ${b.kind}, note ${notes[b.note].name}`
                      : `Plant in patch ${i + 1}`
                  }
                  style={
                    {
                      left: `${9 + (i % 8) * 11.6 + (row % 2 ? 2 : 0)}%`,
                      top: `${48 + row * 16 + (i % 2) * 3}%`,
                      "--row": row,
                      "--bloom-color": f?.color || "#a7b9a0",
                    } as React.CSSProperties
                  }
                  onClick={() => plant(i)}
                >
                  {b && f ? (
                    <>
                      <span className="plant-ground-shadow" />
                      <span
                        className={`botanical-specimen specimen-${f.tile}`}
                        aria-hidden="true"
                      />
                      <span className="plant-note-label">
                        {f.name}
                        <small>{notes[b.note].name}</small>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="planting-mark" />
                      <span className="empty-patch-label">
                        Plant {chosen.name.toLowerCase()}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <div className="garden-player">
            <button
              className="open-flower-collection"
              aria-expanded={palette}
              onClick={() => setPalette((v) => !v)}
            >
              <Flower2 size={16} />
              <span>Plant flowers</span>
              <small>{chosen.name}</small>
            </button>
            <i className="instrument-separator" />
            <button
              className={`garden-play ${playing ? "is-playing" : ""}`}
              onClick={() => void toggle()}
              disabled={!garden.blooms.some(Boolean)}
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}
              <span>{playing ? "Pause melody" : "Listen to your garden"}</span>
            </button>
            <label className="tempo-inline">
              <span>{garden.tempo} BPM</span>
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
          </div>
          {bloom && selected !== null ? (
            <div className="bloom-editor">
              <span className="card-kicker">A NOTE IN YOUR GARDEN</span>
              <button
                className="bloom-editor-close"
                aria-label="Close flower details"
                onClick={() => setSelected(null)}
              >
                <X size={14} />
              </button>
              <h3>{selectedFlower?.name}</h3>
              <p>{selectedFlower?.description}</p>
              <label>
                Its note
                <select
                  aria-label="Bloom note"
                  value={bloom.note}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setGarden((g) => ({
                      ...g,
                      blooms: g.blooms.map((b, i) =>
                        i === selected && b ? { ...b, note: n } : b,
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
              <button
                aria-label="Remove selected flower"
                onClick={() => {
                  setGarden((g) => ({
                    ...g,
                    blooms: g.blooms.map((b, i) => (i === selected ? null : b)),
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
              <Volume2 size={11} />
              {sound
                ? "Touch a flower to hear it."
                : "Listen to your garden to enable sound."}
              <span>{garden.blooms.filter(Boolean).length} / 24 planted</span>
            </div>
          )}
        </div>
      </div>
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
