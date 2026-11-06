"use client";
import { useEffect, useRef, useState } from "react";
import {
  Flower2,
  Play,
  Pause,
  Trash2,
  Download,
  Volume2,
  Check,
  Music2,
  Shuffle,
} from "lucide-react";
type Kind = "moonbell" | "starlily" | "sunsprig";
type Bloom = { kind: Kind; note: number };
type Garden = { name: string; blooms: (Bloom | null)[]; tempo: number };
const key = "starwoven-everbloom-v1";
const seeds: [Kind, string, string, string][] = [
  ["moonbell", "Moonbell", "A little bell of blue", "#a8c9ef"],
  ["starlily", "Star lily", "A soft, rose-colored song", "#eab0d8"],
  ["sunsprig", "Sunsprig", "A warm drop of honey", "#e7c687"],
];
const notes = [
  { name: "C", frequency: 261.63 },
  { name: "D", frequency: 293.66 },
  { name: "E", frequency: 329.63 },
  { name: "G", frequency: 392 },
  { name: "A", frequency: 440 },
  { name: "C↑", frequency: 523.25 },
  { name: "D↑", frequency: 587.33 },
  { name: "E↑", frequency: 659.25 },
];
const positions = [
  [16, 60],
  [27, 39],
  [40, 64],
  [46, 28],
  [58, 52],
  [68, 30],
  [77, 63],
  [88, 41],
];
const initial: Garden = {
  name: "A garden of little songs",
  tempo: 88,
  blooms: [
    { kind: "moonbell", note: 0 },
    null,
    { kind: "starlily", note: 2 },
    null,
    { kind: "sunsprig", note: 4 },
    null,
    { kind: "moonbell", note: 5 },
    null,
  ],
};
function valid(value: unknown): value is Garden {
  const g = value as Garden;
  return (
    !!g &&
    typeof g.name === "string" &&
    g.name.length <= 80 &&
    Number.isFinite(g.tempo) &&
    g.tempo >= 50 &&
    g.tempo <= 140 &&
    Array.isArray(g.blooms) &&
    g.blooms.length === 8 &&
    g.blooms.every(
      (b) =>
        b === null ||
        (b &&
          seeds.some((s) => s[0] === b.kind) &&
          Number.isInteger(b.note) &&
          b.note >= 0 &&
          b.note < 8),
    )
  );
}
export default function Everbloom({
  sound,
  onEnableSound,
  onNote,
}: {
  sound: boolean;
  onEnableSound: () => Promise<void>;
  onNote: (frequency: number, kind: string) => void;
}) {
  const [garden, setGarden] = useState<Garden>(initial),
    [ready, setReady] = useState(false),
    [seed, setSeed] = useState<Kind>("moonbell"),
    [selected, setSelected] = useState<number | null>(null),
    [playing, setPlaying] = useState(false),
    [step, setStep] = useState(-1),
    [saved, setSaved] = useState(true),
    [message, setMessage] = useState("");
  const current = useRef(garden),
    note = useRef(onNote);
  current.current = garden;
  note.current = onNote;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (valid(parsed)) setGarden(parsed);
        else
          setMessage(
            "Your previous garden could not be read. A new little melody is waiting.",
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
    let index = 0;
    const tick = () => {
      setStep(index);
      const b = current.current.blooms[index];
      if (b) note.current(notes[b.note].frequency, b.kind);
      index = (index + 1) % 8;
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
      const bloom = { kind: seed, note: i };
      setGarden((g) => ({
        ...g,
        blooms: g.blooms.map((b, n) => (n === i ? bloom : b)),
      }));
      setSelected(i);
      onNote(notes[i].frequency, seed);
    }
  }
  function exportGarden() {
    const a = document.createElement("a"),
      url = URL.createObjectURL(
        new Blob([JSON.stringify(garden, null, 2)], {
          type: "application/json",
        }),
      );
    a.href = url;
    a.download = "my-everbloom-garden.json";
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Your melody is tucked safely into a file.");
  }
  const bloom = selected !== null ? garden.blooms[selected] : null;
  return (
    <section
      className="everbloom-scene scene-enter"
      aria-label="Everbloom musical garden"
    >
      <div className="garden-aurora" />
      <div className="place-heading">
        <div className="realm-eyebrow">
          <span /> ISLAND 04 · THE CONSERVATORY OF SMALL JOYS
        </div>
        <h1>
          Grow a little <em>harmony.</em>
        </h1>
        <p>Every flower has a song. What will your garden sound like?</p>
      </div>
      <div className="everbloom-layout">
        <aside className="seed-cabinet">
          <span className="card-kicker">
            <Flower2 size={13} /> PICK A LITTLE POSSIBILITY
          </span>
          <h2>Plant a sound.</h2>
          <p>
            Choose a seed, then tap an empty patch. Tap a bloom to hear its note
            or change its song.
          </p>
          <div className="seed-list">
            {seeds.map(([kind, name, description, color]) => (
              <button
                key={kind}
                className={seed === kind ? "chosen" : ""}
                aria-pressed={seed === kind}
                onClick={() => setSeed(kind)}
              >
                <span className={`seed-icon flower-${kind}`} style={{ color }}>
                  <Flower2 size={24} strokeWidth={1} />
                </span>
                <span>
                  <b>{name}</b>
                  <small>{description}</small>
                </span>
                {seed === kind && <Check size={13} />}
              </button>
            ))}
          </div>
          <div className="garden-tuning">
            <label htmlFor="garden-tempo">
              THE PACE OF YOUR GARDEN <span>{garden.tempo} BPM</span>
            </label>
            <input
              id="garden-tempo"
              aria-label="Melody tempo"
              type="range"
              min={50}
              max={140}
              value={garden.tempo}
              onChange={(e) =>
                setGarden((g) => ({ ...g, tempo: Number(e.target.value) }))
              }
            />
            <div>
              <span>Dreamy</span>
              <span>A little dance</span>
            </div>
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
            Let the garden surprise me
          </button>
          <p className="garden-quiet-note">
            {sound
              ? "Sound is on. Touch a bloom and listen."
              : "Play your garden to turn sound on."}
          </p>
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
              {saved
                ? "Saved on this device"
                : "Storage unavailable · export to keep"}
            </span>
          </div>
          <div className="enchanted-flowerbed">
            <div className="greenhouse-arch" />
            <div className="flowerbed-soil" />
            <div className="garden-particles" aria-hidden="true">
              {Array.from({ length: 30 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${(i * 37.3 + 7) % 100}%`,
                    top: `${(i * 23.7 + 9) % 90}%`,
                    animationDelay: `${i % 5}s`,
                  }}
                />
              ))}
            </div>
            <div className="flowerbed-path" />
            {garden.blooms.map((b, i) => (
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
                    left: `${positions[i][0]}%`,
                    top: `${positions[i][1]}%`,
                    "--bloom-color":
                      seeds.find((s) => s[0] === b?.kind)?.[3] || "#c0a8cf",
                  } as React.CSSProperties
                }
                onClick={() => plant(i)}
              >
                {b ? (
                  <>
                    <span className="bloom-aura" />
                    <span className={`enchanted-flower flower-${b.kind}`}>
                      <span className="flower-stem" />
                      <span className="flower-leaf" />
                      <span className="flower-petals">
                        {Array.from(
                          { length: b.kind === "starlily" ? 5 : 6 },
                          (_, j) => (
                            <i
                              key={j}
                              style={{
                                rotate: `${j * (b.kind === "starlily" ? 72 : 60)}deg`,
                              }}
                            />
                          ),
                        )}
                        <b />
                      </span>
                    </span>
                    <span className="bloom-note">{notes[b.note].name}</span>
                  </>
                ) : (
                  <>
                    <span className="empty-patch-ring">+</span>
                    <span className="empty-patch-label">
                      a little possibility
                    </span>
                  </>
                )}
              </button>
            ))}
            <div className="garden-bed-caption">
              <span>✧</span> A melody made of living things.
            </div>
          </div>
          <div className="garden-player">
            <button
              className={`garden-play ${playing ? "is-playing" : ""}`}
              onClick={() => void toggle()}
              disabled={!garden.blooms.some(Boolean)}
            >
              {playing ? <Pause size={15} /> : <Play size={15} />}{" "}
              {playing ? "Pause your garden" : "Play your garden"}
            </button>
            <div className="garden-sequencer" aria-label="Melody steps">
              {garden.blooms.map((b, i) => (
                <i
                  key={i}
                  className={`${step === i ? "now" : ""} ${b ? "has-note" : ""}`}
                  style={
                    {
                      "--bloom-color": seeds.find((s) => s[0] === b?.kind)?.[3],
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <button
              className="garden-export"
              onClick={exportGarden}
              aria-label="Export musical garden"
            >
              <Download size={15} />
            </button>
          </div>
          {bloom && selected !== null ? (
            <div className="bloom-editor">
              <span>
                <Music2 size={13} />
                {seeds.find((s) => s[0] === bloom.kind)?.[1]} · patch{" "}
                {selected + 1}
              </span>
              <label>
                Its little note
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
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <p className="garden-under-note">
              <Volume2 size={11} />
              No perfect notes required. These flowers all get along.
            </p>
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
