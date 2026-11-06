"use client";
import { useEffect, useRef, useState } from "react";
import {
  Music2,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  Trash2,
  X,
  Headphones,
} from "lucide-react";
import { vaultAll, vaultPut, vaultDelete } from "@/lib/local-vault";
type Track = { id: string; title: string; blob: Blob; createdAt: string };
function durationLabel(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`;
}
export default function PersonalMusic({
  open,
  onClose,
  onStartPlaying,
}: {
  open: boolean;
  onClose: () => void;
  onStartPlaying: () => void;
}) {
  const [tracks, setTracks] = useState<Track[]>([]),
    [selected, setSelected] = useState<string | null>(null),
    [playing, setPlaying] = useState(false),
    [volume, setVolume] = useState(0.45),
    [loop, setLoop] = useState(true),
    [progress, setProgress] = useState(0),
    [duration, setDuration] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const audio = useRef<HTMLAudioElement>(null),
    file = useRef<HTMLInputElement>(null),
    url = useRef(""),
    mounted = useRef(true);
  const current = tracks.find((t) => t.id === selected);
  useEffect(() => {
    mounted.current = true;
    void vaultAll<Track>("music")
      .then((items) => {
        if (mounted.current) {
          setTracks(items);
          setSelected(items[0]?.id || null);
        }
      })
      .catch(() =>
        setMessage("Your music library is unavailable in this browser."),
      );
    return () => {
      mounted.current = false;
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);
  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    player.pause();
    setPlaying(false);
    setProgress(0);
    setDuration(0);
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = "";
    if (current) {
      url.current = URL.createObjectURL(current.blob);
      player.src = url.current;
      player.load();
    } else player.removeAttribute("src");
  }, [current]);
  useEffect(() => {
    if (audio.current) audio.current.volume = volume;
  }, [volume]);
  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      let added = 0;
      const next = [...tracks];
      for (const f of Array.from(files)) {
        if (next.length >= 12) {
          setMessage("Your shelf holds twelve songs. Remove one to make room.");
          break;
        }
        if (f.size > 40 * 1024 * 1024) {
          setMessage("Choose a song smaller than 40 MB.");
          continue;
        }
        if (
          !f.type.startsWith("audio/") &&
          !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name)
        ) {
          setMessage("Choose an audio file such as MP3, M4A, WAV, or OGG.");
          continue;
        }
        const track = {
          id: crypto.randomUUID(),
          title: f.name.replace(/\.[^.]+$/, ""),
          blob: f,
          createdAt: new Date().toISOString(),
        };
        await vaultPut("music", track);
        next.push(track);
        added++;
      }
      setTracks(next);
      if (!selected && next.length) setSelected(next[0].id);
      if (added)
        setMessage(
          `${added === 1 ? "Your song is" : "Your songs are"} on the shelf. Tap play when you’re ready.`,
        );
    } catch {
      setMessage(
        "This device could not save the song. Try a smaller file or free some storage.",
      );
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  async function toggle() {
    const player = audio.current;
    if (!player || !current) return;
    if (!player.paused) {
      player.pause();
      return;
    }
    try {
      await player.play();
      onStartPlaying();
      setMessage("");
    } catch {
      setMessage(
        "This song could not play. Try an MP3, WAV, or another supported audio file.",
      );
    }
  }
  function step(direction: number) {
    if (!tracks.length) return;
    const index = tracks.findIndex((t) => t.id === selected);
    setSelected(tracks[(index + direction + tracks.length) % tracks.length].id);
  }
  async function remove(id: string) {
    try {
      await vaultDelete("music", id);
      const next = tracks.filter((t) => t.id !== id);
      setTracks(next);
      if (selected === id) setSelected(next[0]?.id || null);
    } catch {
      setMessage("The song could not be removed. Please try again.");
    }
  }
  return (
    <>
      <audio
        ref={audio}
        loop={loop}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={() => setDuration(audio.current?.duration || 0)}
        onTimeUpdate={() => setProgress(audio.current?.currentTime || 0)}
        onEnded={() => setPlaying(false)}
        onError={() => {
          if (current)
            setMessage("This audio format could not play in your browser.");
        }}
      />
      {open && (
        <aside
          className="personal-music-panel"
          role="dialog"
          aria-label="Your personal music shelf"
        >
          <button
            className="panel-close"
            aria-label="Close music shelf"
            onClick={onClose}
          >
            <X size={16} />
          </button>
          <span className="card-kicker">
            <Headphones size={12} /> A SOUNDTRACK THAT FEELS LIKE YOU
          </span>
          <h2>
            Your little
            <br />
            <em>record shelf.</em>
          </h2>
          <p>Bring a favorite song. Let it follow you between islands.</p>
          <button
            className="add-music"
            onClick={() => file.current?.click()}
            disabled={busy}
          >
            <Plus size={14} />
            {busy ? "Putting it on the shelf…" : "Add your songs"}
          </button>
          <input
            ref={file}
            aria-label="Choose personal songs"
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
            multiple
            hidden
            onChange={(e) => void addFiles(e.target.files)}
          />
          <div className="record-list">
            {tracks.map((t) => (
              <div key={t.id} className={selected === t.id ? "selected" : ""}>
                <button onClick={() => setSelected(t.id)}>
                  <Music2 size={13} />
                  <span>{t.title}</span>
                </button>
                <button
                  aria-label={`Remove song ${t.title}`}
                  onClick={() => void remove(t.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {!tracks.length && (
              <p className="empty-records">
                A quiet shelf, waiting for your first song.
              </p>
            )}
          </div>
          {current && (
            <div className="record-player">
              <span className="now-playing">{current.title}</span>
              <div className="record-buttons">
                <button
                  aria-label="Previous personal song"
                  onClick={() => step(-1)}
                >
                  <SkipBack size={16} />
                </button>
                <button
                  className="record-play"
                  aria-label={
                    playing ? "Pause personal song" : "Play personal song"
                  }
                  onClick={() => void toggle()}
                >
                  {playing ? <Pause size={19} /> : <Play size={19} />}
                </button>
                <button aria-label="Next personal song" onClick={() => step(1)}>
                  <SkipForward size={16} />
                </button>
                <button
                  aria-label="Loop personal song"
                  aria-pressed={loop}
                  onClick={() => setLoop((v) => !v)}
                >
                  <Repeat size={14} />
                </button>
              </div>
              <input
                aria-label="Song position"
                type="range"
                min={0}
                max={Number.isFinite(duration) && duration > 0 ? duration : 1}
                step={0.1}
                value={Math.min(progress, duration || 0)}
                onChange={(e) => {
                  if (audio.current)
                    audio.current.currentTime = Number(e.target.value);
                  setProgress(Number(e.target.value));
                }}
              />
              <div className="track-time">
                <span>{durationLabel(progress)}</span>
                <span>{durationLabel(duration)}</span>
              </div>
              <label className="record-volume">
                <Volume2 size={13} />
                <input
                  aria-label="Personal music volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                />
              </label>
            </div>
          )}
          {message && (
            <p className="music-message" role="status">
              {message}
            </p>
          )}
          <small>Kept on this device. Nothing is uploaded.</small>
        </aside>
      )}
    </>
  );
}
