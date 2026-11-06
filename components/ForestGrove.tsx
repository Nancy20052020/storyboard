"use client";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Undo2,
  Trash2,
  Hand,
  MousePointer2,
  LoaderCircle,
  Check,
  Sparkles,
  Info,
} from "lucide-react";
import type { Hands as MediaPipeHands, Results } from "@mediapipe/hands";
import { getHandGesture } from "@/lib/hand-gesture.mjs";

type Point = { x: number; y: number };
type Stroke = { id: string; color: string; width: number; points: Point[] };
const palette = ["#c8edab", "#e2cb92", "#c8b5f0", "#96d6e5", "#f1aec6"];
const storageKey = "starwoven-grove-v1";
let loadPromise: Promise<void> | null = null;
function loadTracker() {
  if ((window as unknown as { Hands?: unknown }).Hands)
    return Promise.resolve();
  if (!loadPromise)
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/hand-tracking/hands.js";
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        loadPromise = null;
        reject(
          new Error(
            "Hand tracking could not load. Please refresh and try again.",
          ),
        );
      };
      document.head.appendChild(script);
    });
  return loadPromise;
}
function validStrokes(value: unknown): value is Stroke[] {
  return (
    Array.isArray(value) &&
    value.length <= 300 &&
    value.every(
      (s) =>
        s &&
        typeof s.id === "string" &&
        palette.includes(s.color) &&
        [2, 4, 7].includes(s.width) &&
        Array.isArray(s.points) &&
        s.points.length <= 2000 &&
        s.points.every(
          (p: Point) =>
            p &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            p.x >= 0 &&
            p.x <= 1000 &&
            p.y >= 0 &&
            p.y <= 650,
        ),
    )
  );
}
export default function ForestGrove({ onChime }: { onChime: () => void }) {
  const [strokes, setStrokes] = useState<Stroke[]>([]),
    [color, setColor] = useState(palette[0]),
    [width, setWidth] = useState(4),
    [ready, setReady] = useState(false),
    [camera, setCamera] = useState<"off" | "loading" | "on">("off"),
    [message, setMessage] = useState(""),
    [status, setStatus] = useState("Hold up one hand"),
    [cursor, setCursor] = useState<Point | null>(null),
    [drawing, setDrawing] = useState(false),
    [saved, setSaved] = useState(true),
    [showGuide, setShowGuide] = useState(false);
  const board = useRef<SVGSVGElement | null>(null),
    video = useRef<HTMLVideoElement | null>(null),
    stream = useRef<MediaStream | null>(null),
    tracker = useRef<MediaPipeHands | null>(null),
    frame = useRef(0),
    generation = useRef(0),
    mounted = useRef(true),
    data = useRef<Stroke[]>([]),
    active = useRef<string | null>(null),
    pinched = useRef(false),
    brush = useRef({ color, width }),
    last = useRef<Point | null>(null),
    messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    lastDraw = useRef(false);
  brush.current = { color, width };
  function notify(text: string) {
    setMessage(text);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(""), 6000);
  }
  function commit(next: Stroke[]) {
    data.current = next;
    setStrokes(next);
  }
  function begin(p: Point) {
    if (data.current.length >= 300) {
      notify(
        "This drawing has 300 strokes. Undo or clear a little space to keep drawing.",
      );
      return;
    }
    const id = crypto.randomUUID();
    active.current = id;
    last.current = p;
    commit([...data.current, { id, ...brush.current, points: [p] }]);
    setDrawing(true);
  }
  function move(p: Point) {
    if (!active.current) return;
    const previous = last.current;
    if (previous && Math.hypot(p.x - previous.x, p.y - previous.y) < 2) return;
    last.current = p;
    commit(
      data.current.map((s) =>
        s.id === active.current && s.points.length < 2000
          ? { ...s, points: [...s.points, p] }
          : s,
      ),
    );
  }
  function end() {
    active.current = null;
    last.current = null;
    setDrawing(false);
  }
  function stopCamera() {
    generation.current++;
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    const previous = tracker.current;
    tracker.current = null;
    if (previous) void previous.close().catch(() => {});
    if (video.current) video.current.srcObject = null;
    pinched.current = false;
    cursorPoint.current = null;
    lastDraw.current = false;
    active.current = null;
    last.current = null;
    if (mounted.current) {
      setCamera("off");
      setCursor(null);
      setDrawing(false);
    }
  }
  useEffect(() => {
    mounted.current = true;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (validStrokes(parsed)) {
          data.current = parsed;
          setStrokes(parsed);
        } else
          setMessage(
            "The previous drawing could not be read. Start a new one below.",
          );
      }
    } catch {
      setSaved(false);
    }
    setReady(true);
    return () => {
      mounted.current = false;
      // Flush a final stroke even when the user leaves before the debounce.
      try {
        localStorage.setItem(storageKey, JSON.stringify(data.current));
      } catch {
        /* Storage errors are reported by the scene. */
      }
      generation.current++;
      cancelAnimationFrame(frame.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      const previous = tracker.current;
      tracker.current = null;
      if (previous) void previous.close().catch(() => {});
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(strokes));
        setSaved(true);
      } catch {
        setSaved(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [strokes, ready]);
  useEffect(() => {
    const handler = () => {
      if (document.hidden) stopCamera();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  async function startCamera() {
    if (camera !== "off") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      notify(
        "Camera access needs HTTPS and a supported browser. You can draw with touch or a mouse.",
      );
      return;
    }
    const token = ++generation.current;
    setCamera("loading");
    setStatus("Opening your camera…");
    setMessage("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      if (!mounted.current || token !== generation.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      if (!video.current) throw new Error("Camera preview is unavailable.");
      video.current.srcObject = media;
      await video.current.play();
      setStatus("Preparing hand tracking…");
      await loadTracker();
      if (!mounted.current || token !== generation.current) return;
      const Hands = (window as unknown as { Hands: typeof MediaPipeHands })
        .Hands;
      const hands = new Hands({
        locateFile: (name: string) => `/hand-tracking/${name}`,
      });
      tracker.current = hands;
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        selfieMode: false,
      });
      hands.onResults((results: Results) => {
        if (!mounted.current || token !== generation.current) return;
        const gesture = getHandGesture(
          results.multiHandLandmarks?.[0],
          pinched.current,
          cursorPoint.current,
        );
        if (!gesture) {
          setCursor(null);
          cursorPoint.current = null;
          setStatus("Hold up one hand");
          if (pinched.current) end();
          pinched.current = false;
          return;
        }
        const { point, pinched: isPinched } = gesture;
        cursorPoint.current = point;
        setCursor(point);
        setStatus(
          isPinched ? "Drawing a little magic…" : "Pinch thumb + index to draw",
        );
        if (isPinched && !pinched.current) begin(point);
        else if (isPinched) move(point);
        else if (pinched.current) end();
        pinched.current = isPinched;
      });
      await hands.initialize();
      if (!mounted.current || token !== generation.current) return;
      setCamera("on");
      setStatus("Hold up one hand");
      const tick = async () => {
        if (!mounted.current || token !== generation.current) return;
        try {
          if (video.current && video.current.readyState >= 2)
            await hands.send({ image: video.current });
          if (mounted.current && token === generation.current)
            frame.current = requestAnimationFrame(tick);
        } catch {
          if (mounted.current && token === generation.current) {
            stopCamera();
            notify(
              "Hand tracking stopped. Try again, or draw with your mouse or finger.",
            );
          }
        }
      };
      void tick();
      onChime();
    } catch (error) {
      if (!mounted.current || token !== generation.current) return;
      stopCamera();
      const name = error instanceof Error ? error.name : "";
      notify(
        name === "NotAllowedError"
          ? "Camera permission was declined. Enable it in browser settings to try again, or use touch / mouse."
          : name === "NotFoundError"
            ? "No camera was found. Your mouse or finger works just as well."
            : name === "NotReadableError"
              ? "The camera is in use by another app. Close it there and try again."
              : "Hand tracking could not start on this device. You can still draw with your mouse or finger.",
      );
    }
  }
  const cursorPoint = useRef<Point | null>(null);
  function point(e: React.PointerEvent<SVGSVGElement>): Point {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1000, ((e.clientX - r.left) / r.width) * 1000)),
      y: Math.max(0, Math.min(650, ((e.clientY - r.top) / r.height) * 650)),
    };
  }
  return (
    <section
      className="forest-scene scene-enter"
      aria-label="Whisperwood drawing grove"
    >
      <div className="forest-mist" />
      <div className="forest-silhouettes" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <div
            key={i}
            className="forest-tree"
            style={{
              left: `${((i * 17) % 105) - 5}%`,
              height: `${40 + (i % 4) * 12}%`,
              opacity: 0.12 + (i % 3) * 0.06,
              transform: `scaleX(${i % 2 ? -1 : 1})`,
            }}
          />
        ))}
      </div>
      <div className="place-heading">
        <div className="realm-eyebrow">
          <span /> ISLAND 02 · THE ENCHANTED GROVE
        </div>
        <h1>
          Leave a little <em>magic.</em>
        </h1>
        <p>Your hand is the brush. The forest is listening.</p>
      </div>
      <div className="grove-layout">
        <aside className="grove-aside">
          <div className="grove-card">
            <span className="card-kicker">
              <Hand size={14} /> AIR CANVAS
            </span>
            <h2>
              Draw beyond
              <br />
              the ordinary.
            </h2>
            <p>
              Raise your hand. Pinch your thumb and index finger together, then
              move to leave a trail of light.
            </p>
            <div className="gesture-illustration" aria-hidden="true">
              <Hand size={68} strokeWidth={0.8} />
              <span className="pinch-ring" />
              <i />
              <i />
              <i />
            </div>
            <button
              className={`camera-button ${camera === "on" ? "enabled" : ""}`}
              disabled={camera === "loading"}
              onClick={() =>
                camera === "on" ? stopCamera() : void startCamera()
              }
            >
              {camera === "loading" ? (
                <LoaderCircle size={16} className="spin" />
              ) : camera === "on" ? (
                <CameraOff size={16} />
              ) : (
                <Camera size={16} />
              )}{" "}
              {camera === "loading"
                ? "Preparing the magic…"
                : camera === "on"
                  ? "Turn camera off"
                  : "Enable hand drawing"}
            </button>
            {camera === "loading" && (
              <button className="cancel-camera" onClick={stopCamera}>
                Cancel camera setup
              </button>
            )}
            <span className="camera-privacy">
              Camera stays on your device. Always.
            </span>
          </div>
          <button
            className="guide-toggle"
            onClick={() => setShowGuide(!showGuide)}
            aria-expanded={showGuide}
          >
            <Info size={14} /> A little guidance{" "}
            <span>{showGuide ? "−" : "+"}</span>
          </button>
          {showGuide && (
            <div className="gesture-guide">
              <p>
                <b>Pinch</b> to draw. <b>Release</b> to move without leaving a
                mark. Keep your whole hand visible in good light.
              </p>
              <p>
                You can also drag directly on the canvas using your mouse or
                finger. Camera drawing requires a camera-enabled browser over
                HTTPS.
              </p>
            </div>
          )}
          <div className="grove-companion">
            <div className="fern-sprite" aria-hidden="true">
              <i />
              <i />
              <span>••</span>
            </div>
            <p>
              “It doesn’t have to be anything.
              <br />
              It can just be <em>yours.</em>”
              <span>FERN, KEEPER OF SMALL WONDERS</span>
            </p>
          </div>
        </aside>
        <div className="drawing-workspace">
          <div className="drawing-topline">
            <span>
              <span className="live-dot" />{" "}
              {camera === "on" ? status : "A CANVAS FOR YOUR WANDERING MIND"}
            </span>
            <span className={saved ? "" : "storage-warning"}>
              {saved ? "Saved on this device" : "Changes may not be saved"}
            </span>
          </div>
          <div className="drawing-surface">
            <svg
              ref={board}
              className="drawing-board"
              viewBox="0 0 1000 650"
              preserveAspectRatio="none"
              aria-label="Drawing canvas. Drag to draw glowing trails."
              onPointerDown={(e) => {
                if (camera !== "off") return;
                e.currentTarget.setPointerCapture(e.pointerId);
                lastDraw.current = true;
                begin(point(e));
              }}
              onPointerMove={(e) => {
                if (lastDraw.current && camera === "off") move(point(e));
              }}
              onPointerUp={() => {
                if (lastDraw.current) {
                  end();
                  lastDraw.current = false;
                }
              }}
              onPointerCancel={() => {
                end();
                lastDraw.current = false;
              }}
            >
              <defs>
                <radialGradient id="forest-paper">
                  <stop stopColor="#1b3534" />
                  <stop offset="1" stopColor="#101f26" />
                </radialGradient>
                <filter
                  id="ink-glow"
                  x="-100%"
                  y="-100%"
                  width="300%"
                  height="300%"
                >
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="1000" height="650" fill="url(#forest-paper)" />
              <image
                href="/art/whisperwood-clearing.webp"
                x="0"
                y="0"
                width="1000"
                height="650"
                preserveAspectRatio="xMidYMid slice"
                opacity=".87"
              />
              {Array.from({ length: 45 }, (_, i) => (
                <circle
                  key={i}
                  cx={(i * 137.7 + 43) % 1000}
                  cy={(i * 83.3 + 25) % 650}
                  r={i % 7 === 0 ? 1.6 : 0.7}
                  fill="#d1e4bf"
                  opacity={0.08 + (i % 4) * 0.04}
                />
              ))}
              {strokes.map((s) =>
                s.points.length === 1 ? (
                  <circle
                    key={s.id}
                    cx={s.points[0].x}
                    cy={s.points[0].y}
                    r={s.width / 2}
                    fill={s.color}
                    filter="url(#ink-glow)"
                  />
                ) : (
                  <polyline
                    key={s.id}
                    points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={s.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#ink-glow)"
                  />
                ),
              )}
              {cursor && (
                <g className="hand-cursor" pointerEvents="none">
                  <circle
                    cx={cursor.x}
                    cy={cursor.y}
                    r={drawing ? 12 : 20}
                    fill={drawing ? color : "none"}
                    fillOpacity=".2"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeDasharray={drawing ? undefined : "3 5"}
                  />
                  <circle cx={cursor.x} cy={cursor.y} r="3" fill={color} />
                </g>
              )}
            </svg>
            {strokes.length === 0 && (
              <div className="canvas-empty" aria-hidden="true">
                <Sparkles size={26} strokeWidth={0.8} />
                <p>What will your hands dream of?</p>
                <span>
                  {camera === "on"
                    ? "PINCH TO LEAVE YOUR FIRST MARK"
                    : "DRAW HERE WITH YOUR MOUSE OR FINGER"}
                </span>
              </div>
            )}
            <div
              className={`camera-preview ${camera !== "off" ? "visible" : ""}`}
            >
              <video
                ref={video}
                muted
                playsInline
                autoPlay
                aria-label="Mirrored camera preview"
              />
              <span>
                {camera === "loading"
                  ? "Preparing…"
                  : "LOCAL CAMERA · NOT RECORDED"}
              </span>
            </div>
          </div>
          <div className="drawing-toolbar">
            <div className="ink-colors" aria-label="Ink color">
              {palette.map((c, i) => (
                <button
                  key={c}
                  title={["Fern", "Honey", "Lilac", "Mist", "Rose"][i]}
                  aria-label={`${["Fern", "Honey", "Lilac", "Mist", "Rose"][i]} ink`}
                  aria-pressed={color === c}
                  style={{ "--ink-color": c } as React.CSSProperties}
                  className={color === c ? "chosen" : ""}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check size={12} />}
                </button>
              ))}
            </div>
            <div className="brush-widths">
              {[2, 4, 7].map((w, i) => (
                <button
                  key={w}
                  aria-label={`${["Fine", "Medium", "Bold"][i]} brush`}
                  aria-pressed={width === w}
                  className={width === w ? "chosen" : ""}
                  onClick={() => setWidth(w)}
                >
                  <i style={{ width: w + 2, height: w + 2 }} />
                </button>
              ))}
            </div>
            <span className="drawing-tool-separator" />
            <button
              aria-label="Undo last stroke"
              title="Undo"
              disabled={!strokes.length || drawing}
              onClick={() => {
                end();
                commit(data.current.slice(0, -1));
              }}
            >
              <Undo2 size={17} />
            </button>
            <button
              aria-label="Clear drawing"
              title="Clear drawing"
              disabled={!strokes.length || drawing}
              onClick={() => {
                if (
                  confirm("Clear this drawing? Its strokes will be removed.")
                ) {
                  end();
                  commit([]);
                }
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
          <div className="drawing-caption">
            <span>
              <MousePointer2 size={12} /> Mouse & touch are welcome, too.
            </span>
            <span>
              {strokes.length} little{" "}
              {strokes.length === 1 ? "gesture" : "gestures"}
            </span>
          </div>
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
