"use client";
import { useEffect, useRef, useState } from "react";
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
type Theme = "moon" | "rose" | "aurora";
const filters: Record<Theme, string> = {
  moon: "grayscale(.65) contrast(.92) brightness(1.08)",
  rose: "sepia(.22) saturate(.82) brightness(1.05)",
  aurora: "hue-rotate(18deg) saturate(.75) contrast(.94)",
};
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
    [busy, setBusy] = useState(false);
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
      previous?.focus();
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
    ctx.filter = filters[theme];
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
        ctx.filter = filters[theme];
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
      const c = document.createElement("canvas");
      c.width = 540;
      c.height = shots.length * 375 + 100;
      const ctx = c.getContext("2d")!;
      const paper =
        theme === "moon" ? "#e0e2eb" : theme === "rose" ? "#ead8d6" : "#d5e4de";
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, c.width, c.height);
      for (let i = 0; i < shots.length; i++) {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = shots[i];
        });
        ctx.drawImage(img, 30, 30 + i * 375, 480, 345);
      }
      ctx.fillStyle = theme === "rose" ? "#9d727b" : "#6f7e83";
      ctx.font = "italic 20px Georgia";
      ctx.textAlign = "center";
      ctx.fillText("a moment, kept in moonlight", 270, c.height - 32);
      for (const [x, y] of [
        [15, 15],
        [525, 15],
        [15, c.height - 15],
        [525, c.height - 15],
      ]) {
        ctx.font = "18px Georgia";
        ctx.fillText("✧", x, y);
      }
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
  return (
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
            {shots.length ? (
              shots.map((src, i) => (
                <button
                  key={i}
                  aria-label={`Remove photo ${i + 1}`}
                  onClick={() => setShots((s) => s.filter((_, n) => n !== i))}
                >
                  <img src={src} alt={`Photo ${i + 1}`} />
                  <span>×</span>
                </button>
              ))
            ) : (
              <div className="strip-placeholders">
                {[0, 1, 2].map((i) => (
                  <span key={i}>
                    <ImagePlus size={22} />
                  </span>
                ))}
              </div>
            )}
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
              onClick={() => setShots([])}
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
    </div>
  );
}
