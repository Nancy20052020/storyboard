"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Footprints, Heart, Pause } from "lucide-react";
const welcomes: Record<string, string> = {
  world:
    "Hi Nancy. Welcome to your calm spot. I’m Aster—your little keeper of quiet. Where shall we wander?",
  sky: "Welcome to the Observatory, Nancy. These are real stars. Choose one, and I’ll keep your words beside its light.",
  forest:
    "Welcome to Whisperwood. The clearing is yours, Nancy. Shall we turn a small gesture into a little magic?",
  lake: "Welcome to Moonwell, Nancy. Give a thought to the water. You don’t have to carry everything all the time.",
  garden:
    "Welcome to Everbloom. Something lovely is waiting to grow, Nancy. Which flower feels like you today?",
};
export default function MysticCompanion({
  place,
  onChime,
}: {
  place: string;
  onChime: () => void;
}) {
  const [position, setPosition] = useState({ x: 0.98, y: 0 }),
    [viewport, setViewport] = useState({ w: 1200, h: 800 }),
    [open, setOpen] = useState(true),
    [roam, setRoam] = useState(false),
    [message, setMessage] = useState(""),
    [happy, setHappy] = useState(false),
    [ready, setReady] = useState(false);
  const drag = useRef<{
      x: number;
      y: number;
      left: number;
      top: number;
      moved: boolean;
    } | null>(null),
    lastMoved = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    portrait = useRef<HTMLButtonElement>(null);
  const width = viewport.w <= 650 ? 78 : 105,
    height = viewport.w <= 650 ? 101 : 132,
    maxX = Math.max(1, viewport.w - width - 16),
    maxY = Math.max(1, viewport.h - height - 190),
    left = 8 + position.x * maxX,
    top = 85 + position.y * maxY;
  useEffect(() => {
    const resize = () => setViewport({ w: innerWidth, h: innerHeight });
    resize();
    window.addEventListener("resize", resize);
    try {
      const raw = JSON.parse(
        localStorage.getItem("starwoven-aster-position-v1") || "null",
      );
      if (raw && Number.isFinite(raw.x) && Number.isFinite(raw.y))
        setPosition({
          x: Math.min(1, Math.max(0, raw.x)),
          y: Math.min(1, Math.max(0, raw.y)),
        });
    } catch {}
    setReady(true);
    return () => {
      window.removeEventListener("resize", resize);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "starwoven-aster-position-v1",
          JSON.stringify(position),
        );
      } catch {}
  }, [position, ready]);
  useEffect(() => {
    setMessage("");
    setOpen(true);
    setRoam(false);
    const timeout = setTimeout(() => setOpen(false), 12000);
    return () => clearTimeout(timeout);
  }, [place]);
  useEffect(() => {
    if (!roam) return;
    const walk = () => {
      setOpen(false);
      setPosition({
        x: 0.08 + Math.random() * 0.84,
        y: 0.12 + Math.random() * 0.65,
      });
    };
    walk();
    const interval = setInterval(walk, 6500);
    return () => clearInterval(interval);
  }, [roam]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        !target.closest(".mystic-companion") &&
        !target.closest(".aster-speech")
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);
  function hello() {
    setMessage(
      "A little kindness, just for me? I’m keeping that glow. You can drag me anywhere, Nancy.",
    );
    setHappy(true);
    onChime();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHappy(false), 2200);
  }
  const bubbleWidth = Math.min(285, viewport.w - 28),
    bubbleLeft = Math.max(
      14,
      Math.min(
        viewport.w - bubbleWidth - 14,
        left + width / 2 - bubbleWidth * 0.8,
      ),
    ),
    bubbleTop = top < 210 ? top + height + 8 : Math.max(80, top - 190);
  return (
    <div
      className={`mystic-companion ${roam ? "is-roaming" : ""} ${happy ? "is-happy" : ""}`}
      style={{ left, top, width, height }}
    >
      <button
        ref={portrait}
        className="aster-portrait"
        aria-label="Aster, your draggable mystical companion"
        aria-expanded={open}
        title="Drag Aster to move · click to talk · arrow keys to move"
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            left: r.left,
            top: r.top,
            moved: false,
          };
          setPosition({
            x: Math.max(0, Math.min(1, (r.left - 8) / maxX)),
            y: Math.max(0, Math.min(1, (r.top - 85) / maxY)),
          });
          lastMoved.current = false;
          e.currentTarget.setPointerCapture(e.pointerId);
          setRoam(false);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) d.moved = true;
          if (d.moved) {
            setOpen(false);
            setPosition({
              x: Math.max(
                0,
                Math.min(1, (d.left + e.clientX - d.x - 8) / maxX),
              ),
              y: Math.max(
                0,
                Math.min(1, (d.top + e.clientY - d.y - 85) / maxY),
              ),
            });
          }
        }}
        onPointerUp={() => {
          lastMoved.current = !!drag.current?.moved;
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
          lastMoved.current = true;
        }}
        onClick={() => {
          if (lastMoved.current) {
            lastMoved.current = false;
            return;
          }
          setOpen((v) => !v);
          onChime();
        }}
        onKeyDown={(e) => {
          if (e.key.startsWith("Arrow")) {
            e.preventDefault();
            setRoam(false);
            setPosition((p) => ({
              x: Math.max(
                0,
                Math.min(
                  1,
                  p.x +
                    (e.key === "ArrowLeft"
                      ? -22
                      : e.key === "ArrowRight"
                        ? 22
                        : 0) /
                      maxX,
                ),
              ),
              y: Math.max(
                0,
                Math.min(
                  1,
                  p.y +
                    (e.key === "ArrowUp"
                      ? -22
                      : e.key === "ArrowDown"
                        ? 22
                        : 0) /
                      maxY,
                ),
              ),
            }));
          }
          if (e.key === "Home") {
            e.preventDefault();
            setPosition({ x: 0.98, y: 0 });
          }
        }}
      >
        <span className="aster-aura" />
        <img src="/art/aster.webp" alt="" draggable={false} />
        <span className="aster-name">
          ASTER <i>✦</i>
        </span>
        {happy && (
          <span className="aster-heart" aria-hidden="true">
            ♡
          </span>
        )}
      </button>
      {open && (
        <aside
          className="aster-speech"
          aria-label="Aster welcomes you"
          style={{ left: bubbleLeft, top: bubbleTop, width: bubbleWidth }}
        >
          <button
            className="aster-close"
            aria-label="Close Aster’s welcome"
            onClick={() => setOpen(false)}
          >
            <X size={13} />
          </button>
          <span className="card-kicker">
            <Sparkles size={10} />
            ASTER · YOUR LITTLE SKYKEEPER
          </span>
          <p aria-live="polite">
            {message || welcomes[place] || welcomes.world}
          </p>
          <div>
            <button onClick={hello}>
              <Heart size={11} />
              Say hello
            </button>
            <button
              onClick={() => {
                setRoam((v) => !v);
                setOpen(false);
              }}
            >
              {roam ? <Pause size={11} /> : <Footprints size={11} />}{" "}
              {roam ? "Stay here" : "Take a little stroll"}
            </button>
          </div>
          <small>Drag me to move · I’ll follow your pace.</small>
        </aside>
      )}
    </div>
  );
}
