"use client";
import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles, X, Carrot } from "lucide-react";
const greetings: Record<string, string> = {
  world:
    "Hi, I’m Pip! I collect moon crumbs and absolutely unnecessary little adventures.",
  sky: "See that red star in Scorpius? That’s Antares. I like to think it’s a warm little heart.",
  forest:
    "I tried drawing a carrot with my ears. It looked like a cloud. I kept it anyway.",
  lake: "You can tell the moon anything. I’m quite good at listening, too.",
  garden: "Plant a flower! Every bloom has a tiny song hiding inside it.",
};
export default function PipCompanion({
  place,
  onChime,
}: {
  place: string;
  onChime: () => void;
}) {
  const [open, setOpen] = useState(false),
    [mood, setMood] = useState<"idle" | "happy" | "snack">("idle"),
    [message, setMessage] = useState(""),
    [hearts, setHearts] = useState(0);
  const root = useRef<HTMLDivElement>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setMessage("");
    setMood("idle");
    setOpen(false);
  }, [place]);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const r = root.current?.getBoundingClientRect();
      if (!r || !root.current) return;
      root.current.style.setProperty(
        "--eye-x",
        `${Math.max(-2.5, Math.min(2.5, (e.clientX - r.x - r.width / 2) / 100))}px`,
      );
      root.current.style.setProperty(
        "--eye-y",
        `${Math.max(-2, Math.min(2, (e.clientY - r.y - r.height / 2) / 100))}px`,
      );
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>(".pip-pet")?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  function react(snack: boolean) {
    setMood(snack ? "snack" : "happy");
    setHearts((v) => v + 1);
    setMessage(
      snack
        ? "A moon carrot?! For me? This is officially my favorite day."
        : "Oh! A little head pat. I’m keeping that feeling forever.",
    );
    onChime();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMood("idle"), 2200);
  }
  return (
    <div
      ref={root}
      className={`pip-companion ${open ? "pip-open" : ""} pip-${mood}`}
    >
      <div className="pip-sparkles" aria-hidden="true">
        <span>✧</span>
        <span>✦</span>
        <span>·</span>
      </div>
      <button
        className="pip-pet"
        aria-label="Talk to Pip the moon bunny"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          onChime();
        }}
      >
        <svg className="pip-art" viewBox="0 0 130 150" aria-hidden="true">
          <defs>
            <radialGradient id="pip-fur">
              <stop stopColor="#fff4ee" />
              <stop offset="1" stopColor="#b6b2d9" />
            </radialGradient>
            <radialGradient id="pip-cheek">
              <stop stopColor="#f2accc" stopOpacity=".8" />
              <stop offset="1" stopColor="#f2accc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse
            cx="66"
            cy="137"
            rx="35"
            ry="6"
            fill="#050619"
            opacity=".4"
          />
          <g className="pip-ear pip-ear-left">
            <ellipse
              cx="43"
              cy="42"
              rx="14"
              ry="37"
              transform="rotate(-14 43 42)"
              fill="url(#pip-fur)"
            />
            <ellipse
              cx="43"
              cy="39"
              rx="6"
              ry="25"
              transform="rotate(-14 43 39)"
              fill="#d9b5d0"
            />
          </g>
          <g className="pip-ear pip-ear-right">
            <ellipse
              cx="85"
              cy="40"
              rx="14"
              ry="36"
              transform="rotate(16 85 40)"
              fill="url(#pip-fur)"
            />
            <ellipse
              cx="85"
              cy="37"
              rx="6"
              ry="24"
              transform="rotate(16 85 37)"
              fill="#d9b5d0"
            />
          </g>
          <ellipse cx="65" cy="113" rx="31" ry="26" fill="url(#pip-fur)" />
          <circle cx="96" cy="117" r="10" fill="#e4ddef" />
          <ellipse cx="44" cy="132" rx="12" ry="7" fill="#e7dfee" />
          <ellipse cx="78" cy="132" rx="12" ry="7" fill="#e7dfee" />
          <ellipse cx="64" cy="82" rx="41" ry="35" fill="url(#pip-fur)" />
          <ellipse cx="36" cy="91" rx="12" ry="8" fill="url(#pip-cheek)" />
          <ellipse cx="90" cy="91" rx="12" ry="8" fill="url(#pip-cheek)" />
          <g className="pip-eyes">
            <ellipse
              cx="48"
              cy="81"
              rx="4"
              ry={mood === "happy" ? 2 : 5}
              fill="#3d365d"
            />
            <ellipse
              cx="79"
              cy="81"
              rx="4"
              ry={mood === "happy" ? 2 : 5}
              fill="#3d365d"
            />
            <circle cx="49" cy="79" r="1.4" fill="#fff7ee" />
            <circle cx="80" cy="79" r="1.4" fill="#fff7ee" />
          </g>
          <path
            d="m61 90 3 3 3-3"
            stroke="#987285"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M64 93q-5 5-8 0m8 0q5 5 8 0"
            stroke="#987285"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="m64 56 2.4 5.6 6.1.6-4.6 4 1.4 6-5.3-3.1-5.3 3.1 1.4-6-4.6-4 6.1-.6Z"
            fill="#efd28a"
          />
          <ellipse
            cx="47"
            cy="113"
            rx="8"
            ry="12"
            transform="rotate(-30 47 113)"
            fill="#e8dded"
          />
          {mood === "snack" && (
            <g>
              <path d="m65 111 19 4-18 18Z" fill="#e6b781" />
              <path
                d="m82 112 4-8m-3 8 8-3"
                stroke="#adc58b"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          )}
        </svg>
        {mood !== "idle" && (
          <span key={hearts} className="pip-heart" aria-hidden="true">
            ♡
          </span>
        )}
        <span className="pip-name">
          PIP <span>✦</span>
        </span>
      </button>
      {open && (
        <section className="pip-bubble" aria-label="Pip’s little corner">
          <button
            className="pip-close"
            aria-label="Close Pip’s corner"
            onClick={() => setOpen(false)}
          >
            <X size={13} />
          </button>
          <span className="card-kicker">YOUR POCKET-SIZED MOON FRIEND</span>
          <p aria-live="polite">
            {message || greetings[place] || greetings.world}
          </p>
          <div>
            <button onClick={() => react(false)}>
              <Heart size={12} />
              Head pat
            </button>
            <button onClick={() => react(true)}>
              <Carrot size={12} />
              Give a treat
            </button>
          </div>
          <span className="pip-footer">
            <Sparkles size={9} />
            No tasks. Just company.
          </span>
        </section>
      )}
    </div>
  );
}
