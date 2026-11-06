"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  CameraOff,
  X,
  Upload,
  RotateCcw,
  Check,
  ImagePlus,
  LoaderCircle,
} from "lucide-react";
import { vaultPut, type LocalMedia } from "@/lib/local-vault";
import {
  photoTemplates,
  stickerChoices,
  photoLayout,
  photoFilters as filters,
  renderKeepsake,
  type PhotoTheme as Theme,
  type PhotoTemplate,
  type PhotoSticker,
} from "@/lib/photo-keepsake";
export default function PhotoBooth({
  onClose,
  onAttach,
}: {
  onClose: () => void;
  onAttach: (id: string) => void;
}) {
  const [theme, setTheme] = useState<Theme>("moon"),
    [camera, setCamera] = useState<"off" | "loading" | "on">("off"),
    [shots, setShots] = useState<string[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [template, setTemplate] = useState<PhotoTemplate>("strip"),
    [caption, setCaption] = useState("a moment, kept in moonlight"),
    [stickers, setStickers] = useState<PhotoSticker[]>([]),
    [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const preview = useRef<HTMLCanvasElement>(null),
    composition = useRef<HTMLDivElement>(null),
    stickerDrag = useRef<{
      id: string;
      x: number;
      y: number;
      sx: number;
      sy: number;
    } | null>(null);
  const layout = photoLayout(template, shots.length),
    activeSticker = stickers.find((s) => s.id === selectedSticker);
  useEffect(() => {
    let cancelled = false;
    void renderKeepsake({
      shots,
      theme,
      template,
      caption,
      stickers: [],
      withStickers: false,
    })
      .then((canvas) => {
        if (cancelled || !preview.current) return;
        preview.current.width = canvas.width;
        preview.current.height = canvas.height;
        preview.current.getContext("2d")?.drawImage(canvas, 0, 0);
      })
      .catch(() =>
        setMessage(
          "This preview could not open. Try choosing the photo again.",
        ),
      );
    return () => {
      cancelled = true;
    };
  }, [shots, theme, template, caption]);
  function addSticker(choice: (typeof stickerChoices)[number]) {
    if (stickers.length >= 12) {
      setMessage(
        "Twelve little keepsakes are enough for this frame. Remove one to add another.",
      );
      return;
    }
    const id = crypto.randomUUID();
    setStickers((s) => [
      ...s,
      {
        id,
        ...choice,
        x: 78 - (s.length % 3) * 24,
        y: 17 + Math.floor(s.length / 3) * 20,
        size: 8,
        rotation: -12,
      },
    ]);
    setSelectedSticker(id);
  }
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    file = useRef<HTMLInputElement>(null),
    mounted = useRef(true),
    generation = useRef(0),
    close = useRef<HTMLButtonElement>(null);
  function stop() {
    generation.current++;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (mounted.current) setCamera("off");
  }
  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".photo-booth button:not([disabled]),.photo-booth input:not([hidden])",
          ),
        );
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("keydown", keys);
    document.addEventListener("visibilitychange", hide);
    return () => {
      mounted.current = false;
      generation.current++;
      stream.current?.getTracks().forEach((t) => t.stop());
      document.removeEventListener("keydown", keys);
      document.removeEventListener("visibilitychange", hide);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [onClose]);
  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Camera access needs HTTPS and a camera-enabled browser. You can choose photos instead.",
      );
      return;
    }
    const token = ++generation.current;
    setCamera("loading");
    setMessage("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 900, height: 700, facingMode: "user" },
        audio: false,
      });
      if (!mounted.current || token !== generation.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      video.current!.srcObject = media;
      await video.current!.play();
      if (mounted.current && token === generation.current) setCamera("on");
    } catch {
      if (mounted.current && token === generation.current) {
        stop();
        setMessage(
          "The camera could not open. Allow camera permission, or bring a photo from your device.",
        );
      }
    }
  }
  function capture() {
    if (!video.current || video.current.readyState < 2 || shots.length >= 3)
      return;
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 450;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video.current, 0, 0, c.width, c.height);
    setShots((s) => [...s, c.toDataURL("image/jpeg", 0.87)]);
  }
  async function addPhotos(files: FileList | null) {
    if (!files) return;
    try {
      const next = [...shots];
      for (const f of Array.from(files)) {
        if (next.length === 3) break;
        if (!f.type.startsWith("image/") || f.size > 15 * 1024 * 1024) {
          setMessage("Choose an image smaller than 15 MB.");
          continue;
        }
        const bitmap = await createImageBitmap(f);
        const c = document.createElement("canvas");
        c.width = 600;
        c.height = 450;
        const ctx = c.getContext("2d")!;
        const ratio = Math.max(600 / bitmap.width, 450 / bitmap.height);
        ctx.drawImage(
          bitmap,
          (600 - bitmap.width * ratio) / 2,
          (450 - bitmap.height * ratio) / 2,
          bitmap.width * ratio,
          bitmap.height * ratio,
        );
        bitmap.close();
        next.push(c.toDataURL("image/jpeg", 0.87));
      }
      setShots(next);
    } catch {
      setMessage(
        "This image could not be opened. Try a JPEG, PNG, or WebP photo.",
      );
    } finally {
      if (file.current) file.current.value = "";
    }
  }
  async function attach() {
    if (!shots.length) return;
    setBusy(true);
    try {
      const c = await renderKeepsake({
        shots,
        theme,
        template,
        caption,
        stickers,
      });
      const blob = await new Promise<Blob>((resolve, reject) =>
        c.toBlob(
          (b) => (b ? resolve(b) : reject(new Error())),
          "image/webp",
          0.9,
        ),
      );
      const id = crypto.randomUUID();
      await vaultPut<LocalMedia>("media", {
        id,
        blob,
        createdAt: new Date().toISOString(),
      });
      stop();
      onAttach(id);
      onClose();
    } catch {
      setMessage(
        "This device could not keep the photo strip. Your letter is still safe.",
      );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return createPortal(
    <div className="photo-booth-backdrop">
      <section
        className={`photo-booth booth-${theme}`}
        role="dialog"
        aria-modal="true"
        aria-label="Ethereal photo booth"
      >
        <button
          ref={close}
          className="panel-close"
          aria-label="Close photo booth"
          onClick={() => {
            stop();
            onClose();
          }}
        >
          <X size={18} />
        </button>
        <div className="booth-heading">
          <span className="card-kicker">THE MOONLIGHT PHOTO BOOTH</span>
          <h2>
            A little proof
            <br />
            <em>you were here.</em>
          </h2>
          <p>One moment or a strip of three. A keepsake for your letter.</p>
        </div>
        <div className="booth-layout">
          <div>
            <div className="booth-live">
              <video
                ref={video}
                muted
                autoPlay
                playsInline
                style={{ filter: filters[theme] }}
                aria-label="Photo booth camera preview"
              />
              {camera === "off" && (
                <div className="booth-empty">
                  <Camera size={32} strokeWidth={1} />
                  <p>Step into the soft light.</p>
                  <button onClick={() => void start()}>
                    <Camera size={14} />
                    Open camera
                  </button>
                </div>
              )}
              {camera === "loading" && (
                <span className="booth-loading">
                  <LoaderCircle className="spin" size={22} />
                  Opening your camera…
                </span>
              )}
              <span className="booth-corner">✧</span>
            </div>
            <div className="booth-themes" role="group" aria-label="Photo theme">
              {(["moon", "rose", "aurora"] as const).map((t) => (
                <button
                  key={t}
                  className={theme === t ? "selected" : ""}
                  aria-pressed={theme === t}
                  onClick={() => setTheme(t)}
                >
                  {t === "moon"
                    ? "Moon silver"
                    : t === "rose"
                      ? "Rose haze"
                      : "Aurora mist"}
                </button>
              ))}
            </div>
            <div
              className="booth-templates"
              role="group"
              aria-label="Photo keepsake template"
            >
              {photoTemplates.map((t) => (
                <button
                  key={t.id}
                  aria-pressed={template === t.id}
                  onClick={() => setTemplate(t.id)}
                >
                  <span
                    className={`template-mini mini-${t.id}`}
                    aria-hidden="true"
                  />
                  <b>{t.name}</b>
                  <small>{t.description}</small>
                </button>
              ))}
            </div>
            <label className="booth-caption">
              A little caption
              <input
                aria-label="Photo keepsake caption"
                value={caption}
                maxLength={65}
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>
            <div className="booth-sticker-library">
              <span className="card-kicker">A FEW LITTLE EMBELLISHMENTS</span>
              <div>
                {stickerChoices.map((s) => (
                  <button
                    key={s.name}
                    aria-label={`Add ${s.name} sticker`}
                    onClick={() => addSticker(s)}
                  >
                    <span>{s.glyph}</span>
                    <small>{s.name}</small>
                  </button>
                ))}
              </div>
            </div>
            {activeSticker && (
              <div className="booth-sticker-tools">
                <label>
                  Size
                  <input
                    aria-label="Photo sticker size"
                    type="range"
                    min={3}
                    max={16}
                    value={activeSticker.size}
                    onChange={(e) =>
                      setStickers((ss) =>
                        ss.map((s) =>
                          s.id === activeSticker.id
                            ? { ...s, size: Number(e.target.value) }
                            : s,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Turn
                  <input
                    aria-label="Photo sticker rotation"
                    type="range"
                    min={-45}
                    max={45}
                    value={activeSticker.rotation}
                    onChange={(e) =>
                      setStickers((ss) =>
                        ss.map((s) =>
                          s.id === activeSticker.id
                            ? { ...s, rotation: Number(e.target.value) }
                            : s,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  onClick={() => {
                    setStickers((ss) =>
                      ss.filter((s) => s.id !== activeSticker.id),
                    );
                    setSelectedSticker(null);
                  }}
                >
                  Remove sticker
                </button>
              </div>
            )}
            <div className="booth-actions">
              <button onClick={() => file.current?.click()}>
                <Upload size={14} />
                Choose photos
              </button>
              {camera === "on" && (
                <button
                  className="booth-shutter"
                  disabled={shots.length >= 3}
                  onClick={capture}
                >
                  <Camera size={16} />
                  Capture moment {Math.min(shots.length + 1, 3)} / 3
                </button>
              )}
              {camera !== "off" && (
                <button aria-label="Turn photo booth camera off" onClick={stop}>
                  <CameraOff size={15} />
                </button>
              )}
            </div>
            <input
              ref={file}
              type="file"
              accept="image/*"
              multiple
              hidden
              aria-label="Choose photos for your letter"
              onChange={(e) => void addPhotos(e.target.files)}
            />
          </div>
          <div className="booth-strip-preview">
            <span className="card-kicker">YOUR MOMENTS</span>
            <div
              className={`keepsake-composition composition-${template}`}
              ref={composition}
              style={{ aspectRatio: `${layout.width}/${layout.height}` }}
            >
              <canvas
                ref={preview}
                aria-label={`${photoTemplates.find((t) => t.id === template)?.name} keepsake preview`}
              />
              <svg
                className="photo-sticker-layer"
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                aria-label="Move stickers on your keepsake"
              >
                {stickers.map((s) => (
                  <g
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Move ${s.name} sticker`}
                    className={selectedSticker === s.id ? "selected" : ""}
                    transform={`translate(${(s.x / 100) * layout.width} ${(s.y / 100) * layout.height}) rotate(${s.rotation})`}
                    onClick={() => setSelectedSticker(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setSelectedSticker(s.id);
                      if (e.key === "Delete") {
                        setStickers((ss) => ss.filter((v) => v.id !== s.id));
                        setSelectedSticker(null);
                      }
                      const dx =
                          e.key === "ArrowRight"
                            ? 2
                            : e.key === "ArrowLeft"
                              ? -2
                              : 0,
                        dy =
                          e.key === "ArrowDown"
                            ? 2
                            : e.key === "ArrowUp"
                              ? -2
                              : 0;
                      if (dx || dy) {
                        e.preventDefault();
                        setStickers((ss) =>
                          ss.map((v) =>
                            v.id === s.id
                              ? {
                                  ...v,
                                  x: Math.max(3, Math.min(97, v.x + dx)),
                                  y: Math.max(3, Math.min(97, v.y + dy)),
                                }
                              : v,
                          ),
                        );
                      }
                    }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      stickerDrag.current = {
                        id: s.id,
                        x: e.clientX,
                        y: e.clientY,
                        sx: s.x,
                        sy: s.y,
                      };
                      setSelectedSticker(s.id);
                    }}
                    onPointerMove={(e) => {
                      const d = stickerDrag.current;
                      if (!d || d.id !== s.id || !composition.current) return;
                      const r = composition.current.getBoundingClientRect();
                      setStickers((ss) =>
                        ss.map((v) =>
                          v.id === s.id
                            ? {
                                ...v,
                                x: Math.max(
                                  3,
                                  Math.min(
                                    97,
                                    d.sx + ((e.clientX - d.x) / r.width) * 100,
                                  ),
                                ),
                                y: Math.max(
                                  3,
                                  Math.min(
                                    97,
                                    d.sy + ((e.clientY - d.y) / r.height) * 100,
                                  ),
                                ),
                              }
                            : v,
                        ),
                      );
                    }}
                    onPointerUp={() => {
                      stickerDrag.current = null;
                    }}
                    onPointerCancel={() => {
                      stickerDrag.current = null;
                    }}
                  >
                    <rect
                      x={(-layout.width * s.size) / 140}
                      y={(-layout.width * s.size) / 140}
                      width={(layout.width * s.size) / 70}
                      height={(layout.width * s.size) / 70}
                      fill="transparent"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="Georgia"
                      fontSize={(layout.width * s.size) / 100}
                      fill={
                        template === "botanical"
                          ? "#7a8059"
                          : theme === "rose"
                            ? "#995f78"
                            : "#88744e"
                      }
                    >
                      {s.glyph}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <p className="composition-hint">
              Choose a frame. Drag the little embellishments into place.
            </p>
            <div className="booth-shot-thumbnails">
              {shots.map((src, i) => (
                <button
                  key={i}
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setShots((ss) => ss.filter((_, n) => n !== i))}
                >
                  <img src={src} alt={`Photo ${i + 1}`} />
                  <span>×</span>
                </button>
              ))}
            </div>
            <button
              className="booth-attach"
              disabled={!shots.length || busy}
              onClick={() => void attach()}
            >
              {busy ? (
                <LoaderCircle size={14} className="spin" />
              ) : (
                <Check size={14} />
              )}
              Attach to my letter
            </button>
            <button
              className="booth-reset"
              disabled={!shots.length}
              onClick={() => {
                setShots([]);
                setStickers([]);
                setSelectedSticker(null);
              }}
            >
              <RotateCcw size={12} />
              Start this strip again
            </button>
          </div>
        </div>
        {message && (
          <p className="booth-message" role="status">
            {message}
          </p>
        )}
        <small className="booth-privacy">
          The camera and photos stay on this device. Nothing is recorded or
          uploaded.
        </small>
      </section>
    </div>,
    document.body,
  );
}
