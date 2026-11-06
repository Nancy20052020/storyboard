"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  Download,
  Pause,
  Play,
  Trash2,
  X,
  Wind,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
type Lantern = { id: string; text: string; x: number; y: number; date: string };
const storageKey = "starwoven-moonwell-v1";
const phases = [
  { label: "Breathe in", duration: 4 },
  { label: "Hold gently", duration: 4 },
  { label: "Breathe out", duration: 6 },
];
export default function Moonwell({ onChime }: { onChime: () => void }) {
  const [lanterns, setLanterns] = useState<Lantern[]>([]),
    [text, setText] = useState(""),
    [ready, setReady] = useState(false),
    [saved, setSaved] = useState(true),
    [selected, setSelected] = useState<Lantern | null>(null),
    [breathing, setBreathing] = useState(false),
    [second, setSecond] = useState(0),
    [notice, setNotice] = useState(""),
    [page, setPage] = useState(0),
    [pageSize, setPageSize] = useState(24);
  const input = useRef<HTMLTextAreaElement>(null),
    close = useRef<HTMLButtonElement>(null),
    origin = useRef<HTMLElement | null>(null);
  const elapsed = second % 14,
    phase = elapsed < 4 ? 0 : elapsed < 8 ? 1 : 2,
    remaining =
      phase === 0 ? 4 - elapsed : phase === 1 ? 8 - elapsed : 14 - elapsed;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (
          !Array.isArray(data) ||
          data.length > 100 ||
          !data.every(
            (l) =>
              l &&
              typeof l.id === "string" &&
              typeof l.text === "string" &&
              l.text.length <= 1000 &&
              typeof l.date === "string" &&
              Number.isFinite(l.x) &&
              l.x >= 7 &&
              l.x <= 93 &&
              Number.isFinite(l.y) &&
              l.y >= 36 &&
              l.y <= 78,
          )
        )
          throw Error();
        setLanterns(data);
      }
    } catch {
      setNotice(
        "Your saved lanterns could not be read. You can still leave a new thought.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lanterns));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [lanterns, ready]);
  useEffect(() => {
    if (!breathing) return;
    const timer = setInterval(() => setSecond((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [breathing]);
  useEffect(() => {
    if (!selected) return;
    origin.current = document.activeElement as HTMLElement;
    close.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "Tab") {
        const buttons = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            ".lantern-letter button",
          ),
        );
        const first = buttons[0],
          last = buttons.at(-1);
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
      origin.current?.focus();
    };
  }, [selected]);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 650px)");
    const resize = () => {
      setPageSize(media.matches ? 12 : 24);
      setPage(0);
    };
    resize();
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  const pages = Math.max(1, Math.ceil(lanterns.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const visibleLanterns = lanterns.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );
  function release() {
    const value = text.trim();
    if (!value) return;
    if (lanterns.length >= 100) {
      setNotice(
        "Your well holds 100 lanterns. Export your thoughts, then remove a few to make room.",
      );
      return;
    }
    setLanterns((l) => [
      ...l,
      {
        id: crypto.randomUUID(),
        text: value,
        x: 30 + Math.random() * 58,
        y: 45 + Math.random() * 9,
        date: new Date().toISOString(),
      },
    ]);
    setPage(Math.floor(lanterns.length / pageSize));
    setText("");
    onChime();
    setNotice("A thought set afloat. It will be here when you return.");
    input.current?.focus();
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(lanterns, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-moonwell-lanterns.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section
      className="moonwell-scene scene-enter"
      aria-label="Moonwell reflection lake"
    >
      <div className="moonwell-moon" aria-hidden="true" />
      <div className="moonwell-mountains mountain-back" />
      <div className="moonwell-mountains mountain-front" />
      <div className="moonwell-water" />
      <div className="moon-reflection" />
      <div className="place-heading">
        <div className="realm-eyebrow">
          <span /> ISLAND 03 · A QUIET PLACE TO RETURN TO
        </div>
        <h1>
          Let your thoughts <em>float.</em>
        </h1>
        <p>Some things feel lighter when you give them to the water.</p>
      </div>
      <div className="moonwell-stage" aria-label="Open water and lanterns">
        <div className="water-ripples" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i
              key={i}
              style={{
                top: `${i * 12}%`,
                width: `${120 + i * 70}px`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
        </div>
        <div className="lantern-field">
          {visibleLanterns.map((l, i) => (
            <button
              key={l.id}
              className="floating-lantern"
              style={{
                gridColumn: ((i * 5) % (pageSize === 12 ? 4 : 8)) + 1,
                gridRow: Math.floor(i / (pageSize === 12 ? 4 : 8)) + 1,
                animationDelay: `${(i % 5) * -1.3}s`,
              }}
              aria-label={`Read lantern: ${l.text.slice(0, 45)}`}
              onClick={() => {
                setSelected(l);
                onChime();
              }}
            >
              <span className="lantern-light" />
              <span className="lantern-body">
                <i />
              </span>
              <span className="lantern-reflection" />
            </button>
          ))}
        </div>
        {!lanterns.length && (
          <div className="lake-empty">
            <span>✧</span>
            <p>The water is waiting for your first thought.</p>
          </div>
        )}
        {lanterns.length > 0 && (
          <div className="lantern-pages">
            <span>
              {currentPage * pageSize + 1}–
              {Math.min((currentPage + 1) * pageSize, lanterns.length)} of{" "}
              {lanterns.length} floating thoughts
            </span>
            {pages > 1 && (
              <>
                <button
                  aria-label="Previous lanterns"
                  disabled={currentPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  aria-label="Next lanterns"
                  disabled={currentPage === pages - 1}
                  onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                >
                  <ChevronRight size={13} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="moonwell-footer">
        <div
          className={`breathing-stone ${breathing ? `breathing phase-${phase}` : ""}`}
        >
          <button
            className="breathe-orb"
            onClick={() => {
              setBreathing((b) => !b);
              if (!breathing) setSecond(0);
            }}
            aria-label={
              breathing
                ? "Pause breathing exercise"
                : "Start breathing exercise"
            }
          >
            <span className="orb-ring" />
            <span className="orb-ring second" />
            {breathing ? (
              <>
                <span className="breathe-number">{remaining}</span>
                <Pause size={12} />
              </>
            ) : (
              <Wind size={25} strokeWidth={1} />
            )}
          </button>
          <div>
            <span className="card-kicker">A MOMENT FOR YOU</span>
            <p aria-live="polite">
              {breathing ? phases[phase].label : "Stay for a breath."}
            </p>
            <button
              className="breathe-toggle"
              onClick={() => {
                setBreathing((b) => !b);
                if (!breathing) setSecond(0);
              }}
            >
              {breathing ? <Pause size={10} /> : <Play size={10} />}{" "}
              {breathing ? "Pause" : "Begin breathing"}
            </button>
          </div>
        </div>
        <div className="lantern-compose">
          <label htmlFor="lantern-thought">
            <BookOpen size={14} /> A wish, a worry, or something worth
            remembering.
          </label>
          <div className="lantern-input">
            <textarea
              ref={input}
              id="lantern-thought"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              placeholder="Dear universe…"
              rows={2}
            />
            <button
              aria-label="Set your thought afloat"
              disabled={!text.trim()}
              onClick={release}
            >
              <ArrowUp size={20} />
            </button>
          </div>
          <div className="lantern-compose-meta">
            <span className={!saved ? "storage-warning" : ""}>
              {saved
                ? "Only you and the moon. Saved on this device."
                : "Storage unavailable · export to keep your lanterns."}
            </span>
            <button onClick={download} disabled={!lanterns.length}>
              <Download size={12} /> Export {lanterns.length}{" "}
              {lanterns.length === 1 ? "lantern" : "lanterns"}
            </button>
          </div>
        </div>
      </div>
      {notice && (
        <div className="realm-toast" role="status">
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            className="lantern-letter"
            role="dialog"
            aria-modal="true"
            aria-label="Your floating thought"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={close}
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="Close lantern"
            >
              <X size={18} />
            </button>
            <span className="letter-spark">✧</span>
            <span className="card-kicker">A THOUGHT ENTRUSTED TO THE MOON</span>
            <p>{selected.text}</p>
            <div>
              <time dateTime={selected.date}>
                {Number.isNaN(Date.parse(selected.date))
                  ? "A quiet moment"
                  : new Date(selected.date).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
              </time>
              <button
                onClick={() => {
                  if (confirm("Remove this lantern and its writing?")) {
                    setLanterns((l) => l.filter((v) => v.id !== selected.id));
                    setSelected(null);
                  }
                }}
              >
                <Trash2 size={13} /> Let it go
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
