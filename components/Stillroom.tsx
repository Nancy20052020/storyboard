"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CloudRain,
  Sun,
  Moon,
  Flame,
  Pause,
  Play,
  RotateCcw,
  BookOpen,
  Headphones,
  Volume2,
  VolumeX,
  X,
  PenLine,
  Check,
} from "lucide-react";
import {
  studySpots,
  initialStudy,
  readStudy,
  type StudyState,
} from "@/lib/study";
const key = "starwoven-stillroom-v1";
function clockLabel(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
export default function Stillroom({
  onChime,
  onOpenMusic,
}: {
  onChime: () => void;
  onOpenMusic: () => void;
}) {
  const [state, setState] = useState<StudyState>(initialStudy),
    [ready, setReady] = useState(false),
    [now, setNow] = useState(0),
    [showNotes, setShowNotes] = useState(false),
    [saved, setSaved] = useState(true),
    [roomSound, setRoomSound] = useState(false),
    [message, setMessage] = useState("");
  const audio = useRef<AudioContext | null>(null),
    noise = useRef<AudioBufferSourceNode | null>(null),
    gain = useRef<GainNode | null>(null),
    filter = useRef<BiquadFilterNode | null>(null),
    lastCompleted = useRef<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = readStudy(JSON.parse(raw));
        if (parsed) setState(parsed);
      }
    } catch {
      setSaved(false);
    }
    setReady(true);
    return () => {
      noise.current?.stop();
      void audio.current?.close();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [state, ready]);
  useEffect(() => {
    if (!state.endsAt) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.endsAt]);
  useEffect(() => {
    if (!state.endsAt || !now || now < state.endsAt) return;
    const deadline = state.endsAt;
    if (lastCompleted.current !== deadline) {
      lastCompleted.current = deadline;
      onChime();
      setMessage("A little light well spent. Rest your eyes for a moment.");
    }
    setState((s) => ({ ...s, endsAt: null, paused: 0 }));
  }, [now, state.endsAt, onChime]);
  useEffect(() => {
    if (!audio.current || !gain.current || !filter.current) return;
    const rain = state.weather === "rain";
    gain.current.gain.setTargetAtTime(
      roomSound ? (rain ? 0.1 : 0.025) : 0,
      audio.current.currentTime,
      0.5,
    );
    filter.current.type = rain ? "lowpass" : "bandpass";
    filter.current.frequency.setTargetAtTime(
      rain ? 600 : 250,
      audio.current.currentTime,
      0.5,
    );
  }, [state.weather, roomSound]);
  async function toggleRoom() {
    try {
      if (!audio.current) {
        const ctx = new AudioContext();
        audio.current = ctx;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate),
          samples = buffer.getChannelData(0);
        let brown = 0;
        for (let i = 0; i < samples.length; i++) {
          brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02;
          samples[i] = brown * 3.5;
        }
        const source = ctx.createBufferSource(),
          f = ctx.createBiquadFilter(),
          g = ctx.createGain();
        source.buffer = buffer;
        source.loop = true;
        f.type = "lowpass";
        f.frequency.value = state.weather === "rain" ? 600 : 250;
        g.gain.value = 0;
        source.connect(f);
        f.connect(g);
        g.connect(ctx.destination);
        source.start();
        noise.current = source;
        filter.current = f;
        gain.current = g;
      }
      await audio.current.resume();
      setRoomSound((v) => !v);
    } catch {
      setMessage(
        "Room sound could not start in this browser. Your music shelf is still available.",
      );
    }
  }
  const spot = studySpots.find((p) => p.id === state.spot),
    seconds = state.endsAt
      ? Math.max(0, Math.ceil((state.endsAt - (now || Date.now())) / 1000))
      : (state.paused ?? state.duration * 60),
    burning = !!state.endsAt,
    finished = state.paused === 0 && !state.endsAt,
    progress = Math.max(0.14, seconds / (state.duration * 60));
  function light() {
    const remaining =
      state.paused && state.paused > 0 ? state.paused : state.duration * 60;
    const t = Date.now();
    setNow(t);
    setState((s) => ({ ...s, endsAt: t + remaining * 1000, paused: null }));
    onChime();
  }
  function pause() {
    if (!state.endsAt) return;
    setState((s) => ({
      ...s,
      endsAt: null,
      paused: Math.max(0, Math.ceil((s.endsAt! - Date.now()) / 1000)),
    }));
  }
  return (
    <section
      className={`stillroom-scene weather-${state.weather} ${spot ? `seated seat-${spot.id}` : "choosing-seat"}`}
      aria-label="Stillroom study island"
    >
      <div className={`study-room-backdrop study-tile-${spot?.tile ?? 1}`} />
      <div className="study-room-shade" />
      {state.weather === "rain" && (
        <div className="study-rain" aria-hidden="true">
          {Array.from({ length: 55 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 37.3) % 100}%`,
                animationDelay: `${(i % 11) * -0.3}s`,
                animationDuration: `${0.7 + (i % 4) * 0.2}s`,
              }}
            />
          ))}
        </div>
      )}
      {state.weather === "sun" && <div className="study-sunrays" />}
      {!spot ? (
        <>
          <div className="study-welcome">
            <div className="realm-eyebrow">
              <span /> STILLROOM · SOMEWHERE TO SETTLE
            </div>
            <h1>
              Find a little
              <br />
              <em>room to begin.</em>
            </h1>
            <p>
              A café. A library. Quiet illustrated company.
              <br />
              Nothing to prove—just a place to be with your work.
            </p>
          </div>
          <div className="study-seat-collection">
            {studySpots.map((s) => (
              <button
                key={s.id}
                className="study-seat-card"
                onClick={() => {
                  setState((v) => ({ ...v, spot: s.id }));
                  onChime();
                }}
                aria-label={`Choose ${s.name}`}
              >
                <span className={`seat-preview study-tile-${s.tile}`} />
                <span className="seat-card-copy">
                  <small>{s.venue.toUpperCase()}</small>
                  <b>{s.name}</b>
                  <span>{s.description}</span>
                  <i>
                    Take this seat <ArrowUpRight size={12} />
                  </i>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="study-seat-heading">
            <button onClick={() => setState((s) => ({ ...s, spot: null }))}>
              <ArrowLeft size={12} />
              Choose another spot
            </button>
            <span className="realm-eyebrow">
              {spot.venue.toUpperCase()} · {spot.name.toUpperCase()}
            </span>
            <h1>
              Stay awhile,
              <br />
              <em>Nancy.</em>
            </h1>
            <p>Your place is kept. Take it one small thing at a time.</p>
          </div>
          <div
            className="study-weather-controls"
            role="group"
            aria-label="Study atmosphere"
          >
            {(
              [
                { id: "rain", label: "Rain", icon: CloudRain },
                { id: "sun", label: "Sunlit", icon: Sun },
                { id: "night", label: "Night", icon: Moon },
              ] as const
            ).map((w) => (
              <button
                key={w.id}
                aria-pressed={state.weather === w.id}
                onClick={() => setState((s) => ({ ...s, weather: w.id }))}
              >
                <w.icon size={13} />
                {w.label}
              </button>
            ))}
          </div>
          <div className="candle-desk">
            <div
              className={`study-candle ${burning ? "burning" : ""} ${finished ? "spent" : ""}`}
              style={{ "--wax": progress } as React.CSSProperties}
              role="img"
              aria-label={
                burning
                  ? "A candle burns while your timer runs"
                  : finished
                    ? "Your focus candle has finished"
                    : "An unlit focus candle"
              }
            >
              <div className="candle-halo" />
              <div className="candle-flame" />
              <div className="candle-wick" />
              <div
                className="candle-wax"
                style={{ "--wax": progress } as React.CSSProperties}
              />
              <div className="candle-dish" />
            </div>
            <div className="candle-clock">
              <span className="card-kicker">
                {finished
                  ? "A LITTLE LIGHT WELL SPENT"
                  : burning
                    ? "ONE SMALL MOMENT AT A TIME"
                    : "LIGHT A LITTLE INTENTION"}
              </span>
              <output
                aria-label="Candle timer remaining"
                aria-live={finished ? "polite" : "off"}
              >
                {clockLabel(seconds)}
              </output>
              <p>
                {finished
                  ? "Rest your eyes. You’ve been here, and that counts."
                  : burning
                    ? "There’s no hurry. Just this little pool of light."
                    : state.paused
                      ? "Your light will wait for you."
                      : "A quiet timer, measured in candlelight."}
              </p>
              <label className="candle-duration">
                Minutes
                <input
                  aria-label="Candle duration in minutes"
                  type="number"
                  min={1}
                  max={180}
                  disabled={burning}
                  value={state.duration}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n >= 1 && n <= 180)
                      setState((s) => ({ ...s, duration: n, paused: null }));
                  }}
                />
              </label>
              <div className="candle-actions">
                {burning ? (
                  <button onClick={pause}>
                    <Pause size={13} />
                    Pause candle
                  </button>
                ) : (
                  <button onClick={light}>
                    <Flame size={14} />
                    {finished
                      ? "Light another candle"
                      : state.paused
                        ? "Relight candle"
                        : "Light a candle"}
                  </button>
                )}
                <button
                  aria-label="Reset focus candle"
                  onClick={() =>
                    setState((s) => ({ ...s, endsAt: null, paused: null }))
                  }
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>
          </div>
          <div className="study-intention">
            <label htmlFor="study-intention">ONE THING TO BE HERE WITH</label>
            <input
              id="study-intention"
              aria-label="Study intention"
              value={state.intention}
              maxLength={160}
              onChange={(e) =>
                setState((s) => ({ ...s, intention: e.target.value }))
              }
              placeholder="A chapter, a little code, a thought to untangle…"
            />
          </div>
          <div className="study-tool-tray scene-tool-tray">
            <button
              onClick={() => setShowNotes((v) => !v)}
              aria-expanded={showNotes}
            >
              <BookOpen size={15} />
              Desk notes
            </button>
            <button onClick={onOpenMusic}>
              <Headphones size={15} />
              Your music
            </button>
            <button onClick={() => void toggleRoom()} aria-pressed={roomSound}>
              {roomSound ? <Volume2 size={15} /> : <VolumeX size={15} />}Room
              sound
            </button>
            <span className={saved ? "" : "storage-warning"}>
              <Check size={10} />
              {saved ? "Your place is saved" : "Changes may not be saved"}
            </span>
          </div>
          {showNotes && (
            <aside className="study-notepad">
              <button
                className="panel-close"
                aria-label="Close desk notes"
                onClick={() => setShowNotes(false)}
              >
                <X size={14} />
              </button>
              <span className="card-kicker">
                <PenLine size={12} />
                ROOM FOR AN UNFINISHED THOUGHT
              </span>
              <h2>On your desk.</h2>
              <textarea
                aria-label="Study desk notes"
                value={state.notes}
                maxLength={20000}
                placeholder="Code ideas, a sentence from your book, a small plan…"
                onChange={(e) =>
                  setState((s) => ({ ...s, notes: e.target.value }))
                }
              />
              <small>
                Saved on this device. No scores. No tests. Just your notes.
              </small>
            </aside>
          )}
        </>
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
