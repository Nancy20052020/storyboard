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
  Snowflake,
  MapPin,
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
  onStartSound,
}: {
  onChime: () => void;
  onOpenMusic: () => void;
  onStartSound: () => void;
}) {
  const [state, setState] = useState<StudyState>(initialStudy),
    [ready, setReady] = useState(false),
    [now, setNow] = useState(0),
    [showNotes, setShowNotes] = useState(false),
    [saved, setSaved] = useState(true),
    [roomSound, setRoomSound] = useState(false),
    [message, setMessage] = useState("");
  const mapView = useRef<HTMLDivElement>(null),
    mapDrag = useRef<{
      x: number;
      y: number;
      left: number;
      top: number;
    } | null>(null),
    audio = useRef<AudioContext | null>(null),
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
      if (!roomSound) onStartSound();
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
    progress = Math.max(0, Math.min(1, seconds / (state.duration * 60))),
    icy = state.ritual === "ice";
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
      {spot && (
        <div className={`study-room-backdrop study-tile-${spot.tile}`} />
      )}
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
          <div
            ref={mapView}
            className="study-room-map"
            aria-label="Explore the Stillroom café and library"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).closest("button")) return;
              const el = e.currentTarget;
              mapDrag.current = {
                x: e.clientX,
                y: e.clientY,
                left: el.scrollLeft,
                top: el.scrollTop,
              };
              el.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = mapDrag.current;
              if (!d) return;
              e.currentTarget.scrollLeft = d.left - (e.clientX - d.x);
              e.currentTarget.scrollTop = d.top - (e.clientY - d.y);
            }}
            onPointerUp={() => {
              mapDrag.current = null;
            }}
            onPointerCancel={() => {
              mapDrag.current = null;
            }}
          >
            <div className="study-map-canvas">
              <img
                src="/art/stillroom-map.webp"
                alt="A rain-window café connected to a library, with a shared oak table, east window alcove and hearth nook"
                draggable={false}
              />
              {studySpots.map((s) => (
                <button
                  key={s.id}
                  className={`study-map-spot map-${s.id}`}
                  style={{ left: `${s.x}%`, top: `${s.y}%` }}
                  aria-label={`Choose ${s.name}`}
                  onClick={() => {
                    setState((v) => ({ ...v, spot: s.id }));
                    onChime();
                  }}
                >
                  <span className="map-spot-glow">
                    <MapPin size={17} />
                  </span>
                  <span className="map-spot-label">
                    <small>{s.venue}</small>
                    {s.name}
                    <i>
                      Settle here <ArrowUpRight size={10} />
                    </i>
                  </span>
                </button>
              ))}
            </div>
          </div>
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
              Choose a little pool of light. Your seat is waiting.
            </p>
          </div>
          <div className="map-wayfinding">
            <span>Four quiet corners. Tap a glowing spot to settle in.</span>
            <div>
              <button
                onClick={() =>
                  mapView.current?.scrollTo({
                    left: 0,
                    behavior: matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "instant"
                      : "smooth",
                  })
                }
              >
                Café side ←
              </button>
              <button
                onClick={() =>
                  mapView.current?.scrollTo({
                    left:
                      mapView.current.scrollWidth * 0.76 -
                      mapView.current.clientWidth / 2,
                    behavior: matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "instant"
                      : "smooth",
                  })
                }
              >
                Library side →
              </button>
            </div>
            <small>Drag the room to look around.</small>
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
          <div className={`candle-desk desk-ritual-${state.ritual}`}>
            <div className="study-tabletop" aria-hidden="true">
              <div className="table-inlay" />
            </div>
            <div className="ritual-object-place">
              <div className="ritual-contact-shadow" />
              <div
                className={`study-candle candle-${state.ritual} ${burning ? "burning" : ""} ${finished ? "spent" : ""}`}
                style={{ "--wax": progress } as React.CSSProperties}
                role="img"
                aria-label={
                  icy
                    ? burning
                      ? "An ice crystal melts slowly in a glass bowl"
                      : "An ice crystal rests in a glass bowl"
                    : burning
                      ? "A candle burns while your timer runs"
                      : finished
                        ? "Your focus candle has finished"
                        : "An unlit focus candle"
                }
              >
                {icy ? (
                  <>
                    <div className="ice-bowl">
                      <div
                        className="ice-water"
                        style={{ height: `${12 + (1 - progress) * 22}px` }}
                      />
                      <div
                        className="ice-crystal"
                        style={{
                          transform: `translate(-50%,0) scale(${Math.max(0.03, progress)})`,
                        }}
                      >
                        <i />
                        <i />
                        <i />
                      </div>
                      <span className="bowl-glint" />
                    </div>
                    <div className="candle-dish" />
                  </>
                ) : (
                  <>
                    <div className="candle-halo" />
                    <div className="candle-flame" />
                    <div className="candle-wick" />
                    <div
                      className="candle-wax"
                      style={{ "--wax": progress } as React.CSSProperties}
                    />
                    <div className="candle-vessel">
                      <span />
                      <i>✧</i>
                    </div>
                    <div className="candle-dish" />
                  </>
                )}
              </div>
            </div>
            <div className="candle-clock">
              <label className="ritual-choice">
                YOUR LITTLE RITUAL
                <select
                  aria-label="Desk timer style"
                  value={state.ritual}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      ritual: e.target.value as StudyState["ritual"],
                    }))
                  }
                >
                  <option value="beeswax">Honeycomb candle</option>
                  <option value="rose">Rose-glass candle</option>
                  <option value="moon">Moonstone candle</option>
                  <option value="ice">Melting ice crystal</option>
                </select>
              </label>
              <span className="card-kicker">
                {icy
                  ? finished
                    ? "A LITTLE WINTER, GENTLY LET GO"
                    : burning
                      ? "LET THE MOMENT MELT SLOWLY"
                      : "A LITTLE MOMENT OF STILLNESS"
                  : finished
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
                      : icy
                        ? "Watch a little winter soften into water."
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
                    {icy ? "Pause ice timer" : "Pause candle"}
                  </button>
                ) : (
                  <button onClick={light}>
                    {icy ? <Snowflake size={14} /> : <Flame size={14} />}
                    {icy
                      ? finished
                        ? "Begin another thaw"
                        : state.paused
                          ? "Continue melting"
                          : "Begin melting"
                      : finished
                        ? "Light another candle"
                        : state.paused
                          ? "Relight candle"
                          : "Light a candle"}
                  </button>
                )}
                <button
                  aria-label="Reset focus timer"
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
