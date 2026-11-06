"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Mail,
  Plus,
  Camera,
  Stamp,
  Leaf,
  Sparkles,
  Heart,
  X,
  Inbox,
  PenLine,
  Check,
  Trash2,
  RotateCw,
  ChevronLeft,
} from "lucide-react";
import {
  vaultAll,
  vaultGet,
  vaultPut,
  vaultDelete,
  type LocalMedia,
} from "@/lib/local-vault";
import PhotoBooth from "./PhotoBooth";
type Accessory = {
  id: string;
  kind: "seal" | "rose" | "lavender" | "stamp" | "moon" | "ribbon" | "photo";
  x: number;
  y: number;
  rotation: number;
  size: number;
  mediaId?: string;
};
type Letter = {
  id: string;
  to: string;
  from: string;
  body: string;
  paper: "ivory" | "rose" | "midnight";
  ink: "umber" | "violet" | "forest";
  writing?: "classic" | "handwritten" | "script" | "typewriter";
  accessories: Accessory[];
  createdAt: string;
  postedAt: string | null;
};
const key = "starwoven-letter-active";
const recoveryKey = "starwoven-letter-recovery";
function blank(): Letter {
  return {
    id: crypto.randomUUID(),
    to: "",
    from: "Nancy",
    body: "",
    paper: "ivory",
    ink: "umber",
    writing: "classic",
    accessories: [],
    createdAt: new Date().toISOString(),
    postedAt: null,
  };
}
function valid(v: unknown): v is Letter {
  const l = v as Letter;
  return (
    !!l &&
    typeof l.id === "string" &&
    typeof l.to === "string" &&
    typeof l.from === "string" &&
    typeof l.body === "string" &&
    l.body.length <= 20000 &&
    ["ivory", "rose", "midnight"].includes(l.paper) &&
    ["umber", "violet", "forest"].includes(l.ink) &&
    (l.writing === undefined ||
      ["classic", "handwritten", "script", "typewriter"].includes(l.writing)) &&
    Array.isArray(l.accessories) &&
    l.accessories.length <= 30 &&
    l.accessories.every(
      (a) =>
        a &&
        typeof a.id === "string" &&
        [
          "seal",
          "rose",
          "lavender",
          "stamp",
          "moon",
          "ribbon",
          "photo",
        ].includes(a.kind) &&
        Number.isFinite(a.x) &&
        Number.isFinite(a.y) &&
        Number.isFinite(a.rotation) &&
        Number.isFinite(a.size),
    ) &&
    typeof l.createdAt === "string" &&
    (l.postedAt === null || typeof l.postedAt === "string")
  );
}
const keepsakes = [
  { kind: "seal" as const, name: "Wax seal" },
  { kind: "rose" as const, name: "Pressed rose" },
  { kind: "lavender" as const, name: "Lavender sprig" },
  { kind: "stamp" as const, name: "Botanical stamp" },
  { kind: "moon" as const, name: "Moon charm" },
  { kind: "ribbon" as const, name: "Silk ribbon" },
];
export default function LetterAtelier({ onChime }: { onChime: () => void }) {
  const [letter, setLetter] = useState<Letter | null>(null),
    [letters, setLetters] = useState<Letter[]>([]),
    [ready, setReady] = useState(false),
    [saved, setSaved] = useState(true),
    [accessoriesOpen, setAccessoriesOpen] = useState(false),
    [postbox, setPostbox] = useState(false),
    [booth, setBooth] = useState(false),
    [activeAccessory, setActiveAccessory] = useState<string | null>(null),
    [photos, setPhotos] = useState<Record<string, string>>({}),
    [folding, setFolding] = useState(false),
    [message, setMessage] = useState(""),
    [deleting, setDeleting] = useState<Letter | null>(null);
  const deleted = useRef(new Set<string>()),
    saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    current = useRef(letter),
    paper = useRef<HTMLDivElement>(null),
    drag = useRef<{
      id: string;
      x: number;
      y: number;
      ax: number;
      ay: number;
      moved: boolean;
    } | null>(null),
    moved = useRef(false),
    mounted = useRef(true),
    urls = useRef<string[]>([]);
  current.current = letter;
  useEffect(() => {
    mounted.current = true;
    void vaultAll<Letter>("letters")
      .then((items) => {
        if (!mounted.current) return;
        let list = items
          .filter(valid)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        let active: string | null = null;
        try {
          active = localStorage.getItem(key);
          const raw = localStorage.getItem(recoveryKey);
          if (raw) {
            const recovered = JSON.parse(raw);
            if (valid(recovered) && !recovered.postedAt)
              list = [recovered, ...list.filter((l) => l.id !== recovered.id)];
          }
        } catch {}
        setLetters(list);
        const chosen =
          list.find((l) => l.id === active && !l.postedAt) ||
          list.find((l) => !l.postedAt) ||
          blank();
        setLetter(chosen);
        setReady(true);
      })
      .catch(() => {
        if (mounted.current) {
          setLetter(blank());
          setReady(true);
          setSaved(false);
          setMessage(
            "Your postbox could not open. You can still write here during this visit.",
          );
        }
      });
    return () => {
      mounted.current = false;
      const l = current.current;
      if (l && !deleted.current.has(l.id))
        void vaultPut("letters", l).catch(() => {});
      urls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  useEffect(() => {
    if (!ready || !letter || deleted.current.has(letter.id)) return;
    try {
      localStorage.setItem(key, letter.id);
      localStorage.setItem(recoveryKey, JSON.stringify(letter));
    } catch {}
    setSaved(false);
    const timeout = setTimeout(() => {
      if (deleted.current.has(letter.id)) return;
      void vaultPut("letters", letter)
        .then(() => {
          if (mounted.current && !deleted.current.has(letter.id)) {
            setSaved(true);
            setLetters((items) => [
              letter,
              ...items.filter((l) => l.id !== letter.id),
            ]);
          }
        })
        .catch(() => {
          if (mounted.current) setSaved(false);
        });
    }, 300);
    saveTimer.current = timeout;
    return () => clearTimeout(timeout);
  }, [letter, ready]);
  useEffect(() => {
    if (!letter) return;
    let cancelled = false;
    for (const a of letter.accessories) {
      if (a.kind !== "photo" || !a.mediaId || photos[a.mediaId]) continue;
      void vaultGet<LocalMedia>("media", a.mediaId)
        .then((item) => {
          if (!item || cancelled) return;
          const url = URL.createObjectURL(item.blob);
          urls.current.push(url);
          setPhotos((p) => ({ ...p, [item.id]: url }));
        })
        .catch(() =>
          setMessage(
            "A photo could not be opened, but your writing is still here.",
          ),
        );
    }
    return () => {
      cancelled = true;
    };
  }, [letter, photos]);
  useEffect(() => {
    if (!deleting) return;
    const previous = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector(".letter-delete-dialog");
    const buttons = dialog?.querySelectorAll<HTMLButtonElement>("button");
    buttons?.[0]?.focus();
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleting(null);
      if (e.key === "Tab" && buttons?.length) {
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [deleting]);
  const closeBooth = useCallback(() => setBooth(false), []);
  function update(p: Partial<Letter>) {
    setLetter((l) => (l ? { ...l, ...p } : l));
  }
  function add(kind: Accessory["kind"], mediaId?: string) {
    if (!letter) return;
    if (letter.accessories.length >= 30) {
      setMessage(
        "This letter already has thirty keepsakes. Remove one to make room.",
      );
      return;
    }
    const id = crypto.randomUUID();
    const a: Accessory = {
      id,
      kind,
      mediaId,
      x: kind === "photo" ? 77 : 85,
      y: kind === "stamp" ? 12 : kind === "seal" ? 88 : 65,
      rotation: kind === "photo" ? -7 : kind === "seal" ? 0 : -12,
      size: 1,
    };
    update({ accessories: [...letter.accessories, a] });
    setActiveAccessory(id);
    setAccessoriesOpen(false);
    onChime();
  }
  async function newLetter() {
    if (letter)
      try {
        await vaultPut("letters", letter);
      } catch {
        setMessage(
          "This letter could not be saved. Your writing is still open.",
        );
        return;
      }
    setLetter(blank());
    setActiveAccessory(null);
    setPostbox(false);
    setFolding(false);
  }
  async function post() {
    if (!letter || !letter.body.trim()) return;
    const posted = { ...letter, postedAt: new Date().toISOString() };
    try {
      await vaultPut("letters", posted);
      setLetter(posted);
      setLetters((items) => [
        posted,
        ...items.filter((l) => l.id !== posted.id),
      ]);
      setFolding(true);
      setActiveAccessory(null);
      onChime();
      setMessage("Folded, sealed, and kept in your personal postbox.");
    } catch {
      setMessage(
        "Your device could not keep the letter. Your draft is still here.",
      );
    }
  }
  async function openLetter(next: Letter) {
    if (letter)
      try {
        await vaultPut("letters", letter);
      } catch {
        setMessage(
          "This draft could not be saved. Your writing is still open.",
        );
        return;
      }
    setLetter(next);
    setFolding(false);
    setPostbox(false);
    setActiveAccessory(null);
  }
  async function deleteLetter(target: Letter) {
    deleted.current.add(target.id);
    if (current.current?.id === target.id && saveTimer.current)
      clearTimeout(saveTimer.current);
    try {
      await vaultDelete("letters", target.id);
      setLetters((items) => items.filter((l) => l.id !== target.id));
      if (current.current?.id === target.id) {
        try {
          localStorage.removeItem(recoveryKey);
        } catch {}
        const next = blank();
        current.current = next;
        setLetter(next);
        setFolding(false);
        setActiveAccessory(null);
      }
      setDeleting(null);
      setMessage("The letter has been removed from your postbox.");
      for (const a of target.accessories) {
        if (
          a.mediaId &&
          !letters.some(
            (l) =>
              l.id !== target.id &&
              l.accessories.some((k) => k.mediaId === a.mediaId),
          )
        )
          void vaultDelete("media", a.mediaId).catch(() => {});
      }
    } catch {
      deleted.current.delete(target.id);
      if (current.current?.id === target.id)
        setLetter((l) => (l ? { ...l } : l));
      setMessage(
        "This letter could not be deleted. It is still kept in your postbox.",
      );
    }
  }
  const accessory = letter?.accessories.find((a) => a.id === activeAccessory);
  if (!letter) return <div className="realm-loading">Opening the atelier…</div>;
  return (
    <section className="letter-atelier" aria-label="Postscript letter atelier">
      <div className="letter-room-backdrop" />
      <div className="letter-room-heading">
        <span className="realm-eyebrow">
          <span /> POSTSCRIPT · THE GARDEN LETTER ATELIER
        </span>
        <h1>
          Some words deserve
          <br />
          <em>a place to stay.</em>
        </h1>
        <p>
          A letter to someone. A letter to yourself.
          <br />
          Something you never have to send.
        </p>
      </div>
      <button
        className="postbox-button scene-postbox"
        onClick={() => setPostbox((v) => !v)}
        aria-expanded={postbox}
      >
        <span className="atelier-prop-art prop-postbox" aria-hidden="true" />
        <span>
          Your postbox
          <small>
            {letters.filter((l) => l.postedAt).length} sealed letters
          </small>
        </span>
      </button>
      <button
        className="scene-photo-pavilion"
        aria-label="Enter the garden photo booth"
        onClick={() => setBooth(true)}
      >
        <span
          className="atelier-prop-art prop-photo-pavilion"
          aria-hidden="true"
        />
        <span className="pavilion-sign">
          Moonlight studio<small>Step inside for a photograph</small>
        </span>
      </button>
      <div className={`letter-desk ${folding ? "letter-folded" : ""}`}>
        <div className="letter-desk-meta">
          <span>
            <PenLine size={12} />
            {letter.postedAt ? "A letter kept" : "A letter in the making"}
          </span>
          <span className={saved ? "" : "storage-warning"}>
            {saved ? "Saved on this device" : "Changes may not be saved"}
          </span>{" "}
          <button
            className="delete-current-letter"
            aria-label="Delete current letter"
            onClick={() => setDeleting(letter)}
          >
            <Trash2 size={12} />
            Delete this letter
          </button>
        </div>
        <div
          ref={paper}
          className={`letter-paper paper-${letter.paper} ink-${letter.ink} writing-${letter.writing || "classic"}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveAccessory(null);
          }}
        >
          <div className="paper-grain" />
          <div className="letter-date">a quiet moment, just for you</div>
          <label className="letter-to">
            <span>Dear</span>
            <input
              aria-label="Letter recipient"
              maxLength={100}
              placeholder="future me…"
              value={letter.to}
              onChange={(e) => update({ to: e.target.value })}
            />
          </label>
          <textarea
            className="letter-body"
            aria-label="Write your letter"
            placeholder="What have you been carrying? Let the page hold a little of it…"
            maxLength={20000}
            value={letter.body}
            onChange={(e) => update({ body: e.target.value, postedAt: null })}
          />
          <label className="letter-from">
            <span>With a little love,</span>
            <input
              aria-label="Letter signature"
              maxLength={80}
              value={letter.from}
              onChange={(e) => update({ from: e.target.value })}
            />
          </label>
          <div className="letter-keepsakes">
            {letter.accessories.map((a) => (
              <button
                key={a.id}
                className={`letter-accessory accessory-${a.kind} ${activeAccessory === a.id ? "selected" : ""}`}
                aria-label={`Move ${a.kind} keepsake`}
                style={
                  {
                    left: `${a.x}%`,
                    top: `${a.y}%`,
                    rotate: `${a.rotation}deg`,
                    "--accessory-scale": a.size,
                  } as React.CSSProperties
                }
                onPointerDown={(e) => {
                  e.stopPropagation();
                  drag.current = {
                    id: a.id,
                    x: e.clientX,
                    y: e.clientY,
                    ax: a.x,
                    ay: a.y,
                    moved: false,
                  };
                  moved.current = false;
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = drag.current;
                  if (!d || d.id !== a.id || !paper.current) return;
                  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4)
                    d.moved = true;
                  if (d.moved) {
                    moved.current = true;
                    const r = paper.current.getBoundingClientRect();
                    setLetter((l) =>
                      l
                        ? {
                            ...l,
                            accessories: l.accessories.map((v) =>
                              v.id === a.id
                                ? {
                                    ...v,
                                    x: Math.max(
                                      4,
                                      Math.min(
                                        96,
                                        d.ax +
                                          ((e.clientX - d.x) / r.width) * 100,
                                      ),
                                    ),
                                    y: Math.max(
                                      5,
                                      Math.min(
                                        95,
                                        d.ay +
                                          ((e.clientY - d.y) / r.height) * 100,
                                      ),
                                    ),
                                  }
                                : v,
                            ),
                          }
                        : l,
                    );
                  }
                }}
                onPointerUp={() => {
                  drag.current = null;
                }}
                onPointerCancel={() => {
                  drag.current = null;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveAccessory(a.id);
                  moved.current = false;
                }}
              >
                {a.kind === "seal" ? (
                  <span className="wax-seal">
                    <Heart size={24} strokeWidth={1} />
                  </span>
                ) : a.kind === "rose" ? (
                  <span className="botanical-specimen specimen-3" />
                ) : a.kind === "lavender" ? (
                  <span className="botanical-specimen specimen-5" />
                ) : a.kind === "stamp" ? (
                  <span className="letter-stamp">
                    <Leaf size={23} />
                    <small>POSTSCRIPT</small>
                  </span>
                ) : a.kind === "moon" ? (
                  <span className="letter-moon-charm">☾</span>
                ) : a.kind === "ribbon" ? (
                  <span className="silk-ribbon" />
                ) : a.mediaId && photos[a.mediaId] ? (
                  <img
                    src={photos[a.mediaId]}
                    alt="Your ethereal photo keepsake"
                  />
                ) : (
                  <span className="photo-loading">
                    <Camera size={20} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {folding && (
          <div className="sealed-letter-overlay">
            <div className="sealed-envelope">
              <Mail size={60} strokeWidth={0.7} />
              <span className="wax-seal">
                <Heart size={20} />
              </span>
            </div>
            <h2>
              A little kindness,
              <br />
              folded into an envelope.
            </h2>
            <button onClick={() => void newLetter()}>
              <Plus size={13} />
              Begin another letter
            </button>
            <button onClick={() => setFolding(false)}>
              Unfold this letter
            </button>
          </div>
        )}
      </div>
      <div className="letter-tools scene-tool-tray">
        <label>
          Paper
          <select
            aria-label="Letter paper"
            value={letter.paper}
            onChange={(e) =>
              update({ paper: e.target.value as Letter["paper"] })
            }
          >
            <option value="ivory">Warm ivory</option>
            <option value="rose">Rose linen</option>
            <option value="midnight">Midnight</option>
          </select>
        </label>
        <label>
          Ink
          <select
            aria-label="Letter ink"
            value={letter.ink}
            onChange={(e) => update({ ink: e.target.value as Letter["ink"] })}
          >
            <option value="umber">Sepia</option>
            <option value="violet">Violet</option>
            <option value="forest">Forest</option>
          </select>
        </label>
        <label>
          Writing
          <select
            aria-label="Letter writing style"
            value={letter.writing || "classic"}
            onChange={(e) =>
              update({ writing: e.target.value as Letter["writing"] })
            }
          >
            <option value="classic">Literary serif</option>
            <option value="handwritten">Handwritten</option>
            <option value="script">Love-letter script</option>
            <option value="typewriter">Old typewriter</option>
          </select>
        </label>
        <button
          onClick={() => setAccessoriesOpen((v) => !v)}
          aria-expanded={accessoriesOpen}
        >
          <Stamp size={15} />
          <span>Keepsakes</span>
        </button>
        <button onClick={() => setBooth(true)}>
          <Camera size={15} />
          <span>Photo booth</span>
        </button>
        <button
          className="post-letter-action"
          disabled={!letter.body.trim() || !!letter.postedAt}
          onClick={() => void post()}
        >
          <Mail size={15} />
          <span>Fold & post</span>
        </button>
      </div>
      {accessoriesOpen && (
        <aside className="keepsake-palette">
          <button
            className="panel-close"
            aria-label="Close keepsakes"
            onClick={() => setAccessoriesOpen(false)}
          >
            <X size={14} />
          </button>
          <span className="card-kicker">LITTLE THINGS, LOVINGLY KEPT</span>
          <h2>Make it feel like you.</h2>
          <div>
            {keepsakes.map((k) => (
              <button
                key={k.kind}
                onClick={() => add(k.kind)}
                aria-label={`Add ${k.name}`}
              >
                <span className={`keepsake-sample sample-${k.kind}`}>
                  {k.kind === "seal" ? (
                    <Heart size={23} />
                  ) : k.kind === "rose" || k.kind === "lavender" ? (
                    <span
                      className={`botanical-specimen specimen-${k.kind === "rose" ? 3 : 5}`}
                    />
                  ) : k.kind === "stamp" ? (
                    <Stamp size={23} />
                  ) : k.kind === "moon" ? (
                    <span>☾</span>
                  ) : (
                    <span className="silk-ribbon" />
                  )}
                </span>
                <b>{k.name}</b>
              </button>
            ))}
          </div>
        </aside>
      )}
      {accessory && !folding && (
        <aside className="keepsake-inspector">
          <button
            aria-label="Close keepsake details"
            className="panel-close"
            onClick={() => setActiveAccessory(null)}
          >
            <X size={13} />
          </button>
          <span className="card-kicker">A KEEPSAKE ON YOUR PAGE</span>
          <p>Drag it to place it.</p>
          <label>
            Size
            <input
              aria-label="Keepsake size"
              type="range"
              min={0.5}
              max={1.7}
              step={0.05}
              value={accessory.size}
              onChange={(e) =>
                update({
                  accessories: letter.accessories.map((a) =>
                    a.id === accessory.id
                      ? { ...a, size: Number(e.target.value) }
                      : a,
                  ),
                })
              }
            />
          </label>
          <label>
            <RotateCw size={11} />
            Turn
            <input
              aria-label="Keepsake rotation"
              type="range"
              min={-40}
              max={40}
              value={accessory.rotation}
              onChange={(e) =>
                update({
                  accessories: letter.accessories.map((a) =>
                    a.id === accessory.id
                      ? { ...a, rotation: Number(e.target.value) }
                      : a,
                  ),
                })
              }
            />
          </label>
          <button
            onClick={() => {
              update({
                accessories: letter.accessories.filter(
                  (a) => a.id !== accessory.id,
                ),
              });
              setActiveAccessory(null);
            }}
          >
            <Trash2 size={12} />
            Remove keepsake
          </button>
        </aside>
      )}
      {postbox && (
        <aside className="personal-postbox" aria-label="Your personal postbox">
          <button
            className="panel-close"
            aria-label="Close postbox"
            onClick={() => setPostbox(false)}
          >
            <X size={15} />
          </button>
          <span className="card-kicker">
            <Inbox size={12} /> LETTERS THAT FOUND A HOME
          </span>
          <h2>
            Your personal
            <br />
            <em>postbox.</em>
          </h2>
          <p>Kept here for you. These letters aren’t sent to anyone.</p>
          <button className="new-letter" onClick={() => void newLetter()}>
            <Plus size={13} />
            Write a new letter
          </button>
          <div>
            {letters.map((l) => (
              <div className="postbox-entry" key={l.id}>
                <button onClick={() => void openLetter(l)}>
                  <Mail size={19} />
                  <span>
                    To {l.to || "someone, someday"}
                    <small>
                      {l.postedAt ? "Sealed" : "Draft"} ·{" "}
                      {l.body.slice(0, 65) || "A blank page, waiting"}
                    </small>
                  </span>
                  <ChevronLeft size={12} />
                </button>
                <button
                  aria-label={`Delete letter to ${l.to || "someone, someday"}`}
                  onClick={() => setDeleting(l)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}
      {deleting &&
        createPortal(
          <div className="letter-delete-backdrop">
            <section
              className="letter-delete-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-label="Delete this letter?"
            >
              <Trash2 size={24} />
              <h2>Let this letter go?</h2>
              <p>
                To {deleting.to || "someone, someday"}. This removes the letter
                and its photo keepsakes from this device. It cannot be undone.
              </p>
              <button onClick={() => setDeleting(null)}>Keep my letter</button>
              <button onClick={() => void deleteLetter(deleting)}>
                Delete letter permanently
              </button>
            </section>
          </div>,
          document.body,
        )}
      {booth && (
        <PhotoBooth onClose={closeBooth} onAttach={(id) => add("photo", id)} />
      )}{" "}
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
