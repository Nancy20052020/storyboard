"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Plus,
  Minus,
  Scan,
  MapPin,
  Clock,
  LocateFixed,
  Stars,
  PenLine,
  Link2,
  BookOpen,
  Trash2,
  ChevronRight,
  Check,
  Eye,
} from "lucide-react";
import catalog from "@/data/sky-catalog.json";
import {
  precessJ2000,
  projectStar,
  siderealDegrees,
  horizontalPosition,
  galacticToEquatorial,
  wrapDegrees,
} from "@/lib/astronomy.mjs";
type RealStar = {
  id: string;
  hip: number;
  ra: number;
  dec: number;
  mag: number;
  bv: number;
  name: string;
  constellation: string;
  designation: string;
};
type Thought = { title: string; text: string };
type SkyNotes = {
  thoughts: Record<string, Thought>;
  connections: [string, string][];
};
type LegacyStar = {
  id: string;
  title: string;
  note: string;
  [key: string]: unknown;
};
type LegacySky = { stars: LegacyStar[]; [key: string]: unknown };
const storageKey = "starwoven-real-sky-v1";
const stars: RealStar[] = (
  catalog.stars as unknown as [
    number,
    number,
    number,
    number,
    number,
    string,
    string,
    string,
  ][]
).map(([hip, ra, dec, mag, bv, name, constellation, designation]) => ({
  id: `hip-${hip}`,
  hip,
  ra,
  dec,
  mag,
  bv,
  name:
    name ||
    (designation && constellation
      ? `${designation} ${constellation}`
      : `HIP ${hip}`),
  constellation,
  designation,
}));
const byId = new Map(stars.map((s) => [s.id, s]));
const constellations = catalog.constellations.sort((a, b) =>
  a.name.localeCompare(b.name),
);
const locations = [
  { name: "New Delhi", lat: 28.6139, lon: 77.209 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Sydney", lat: -33.8688, lon: 151.2093 },
];
function validNotes(v: unknown): v is SkyNotes {
  const s = v as SkyNotes;
  return (
    !!s &&
    !!s.thoughts &&
    typeof s.thoughts === "object" &&
    !Array.isArray(s.thoughts) &&
    Object.keys(s.thoughts).length <= 1000 &&
    Object.entries(s.thoughts).every(
      ([id, t]) =>
        byId.has(id) &&
        t &&
        typeof t.title === "string" &&
        t.title.length <= 100 &&
        typeof t.text === "string" &&
        t.text.length <= 10000,
    ) &&
    Array.isArray(s.connections) &&
    s.connections.length <= 2500 &&
    s.connections.every(
      (e) =>
        Array.isArray(e) &&
        e.length === 2 &&
        e[0] !== e[1] &&
        e.every((id) => byId.has(id)),
    )
  );
}
function localDateTime(d: Date) {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}
export default function RealSky({ onChime }: { onChime: () => void }) {
  const [notes, setNotes] = useState<SkyNotes>({
      thoughts: {},
      connections: [],
    }),
    [ready, setReady] = useState(false),
    [saved, setSaved] = useState(true),
    [legacy, setLegacy] = useState<LegacySky | null>(null),
    [legacyId, setLegacyId] = useState<string | null>(null),
    [pickingLegacy, setPickingLegacy] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [query, setQuery] = useState(""),
    [selectedConstellation, setSelectedConstellation] = useState(""),
    [observer, setObserver] = useState(locations[0]),
    [date, setDate] = useState(new Date("2026-01-01T00:00:00Z")),
    [camera, setCamera] = useState({ ra: 0, dec: 28, zoom: 1 }),
    [following, setFollowing] = useState(true),
    [lines, setLines] = useState(true),
    [names, setNames] = useState(true),
    [magnitude, setMagnitude] = useState(5.6),
    [settings, setSettings] = useState(false),
    [library, setLibrary] = useState(false),
    [connect, setConnect] = useState(false),
    [anchor, setAnchor] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [size, setSize] = useState({ w: 1200, h: 800 });
  const canvas = useRef<HTMLCanvasElement>(null),
    hits = useRef<{ star: RealStar; x: number; y: number }[]>([]),
    drag = useRef<{
      x: number;
      y: number;
      ra: number;
      dec: number;
      moved: boolean;
    } | null>(null),
    frame = useRef(0),
    newestCamera = useRef(camera);
  newestCamera.current = camera;
  const chosen = selected ? byId.get(selected) : undefined,
    legacyThought = legacy?.stars.find((s) => s.id === legacyId);
  useEffect(() => {
    setDate(new Date());
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const value = JSON.parse(raw);
        if (validNotes(value)) setNotes(value);
        else
          setNotice(
            "Saved star notes could not be read. Your earlier writing is still kept separately.",
          );
      }
      const reference = JSON.parse(
        localStorage.getItem("starwoven-sky-observer-v1") || "null",
      );
      if (
        reference &&
        typeof reference.name === "string" &&
        reference.name.length <= 50 &&
        Number.isFinite(reference.lat) &&
        Math.abs(reference.lat) <= 90 &&
        Number.isFinite(reference.lon) &&
        Math.abs(reference.lon) <= 180
      )
        setObserver(reference);
      const old = localStorage.getItem("starwoven-sky-v1");
      if (old) {
        const value = JSON.parse(old);
        if (
          value &&
          Array.isArray(value.stars) &&
          value.stars.every(
            (s: LegacyStar) =>
              s &&
              typeof s.id === "string" &&
              typeof s.title === "string" &&
              typeof s.note === "string",
          )
        )
          setLegacy(value);
      }
    } catch {
      setSaved(false);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [notes, ready]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "starwoven-sky-observer-v1",
          JSON.stringify(observer),
        );
      } catch {}
  }, [observer, ready]);
  useEffect(() => {
    if (ready && legacy)
      try {
        localStorage.setItem("starwoven-sky-v1", JSON.stringify(legacy));
      } catch {
        setSaved(false);
      }
  }, [legacy, ready]);
  useEffect(() => {
    if (following)
      setCamera((c) => ({
        ...c,
        ra: siderealDegrees(date, observer.lon),
        dec: observer.lat,
      }));
  }, [date, observer, following]);
  useEffect(() => {
    if (!following) return;
    const timer = setInterval(() => setDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, [following]);
  useEffect(() => {
    const resize = () => {
      if (canvas.current) {
        const r = canvas.current.getBoundingClientRect();
        setSize({ w: r.width, h: r.height });
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.current) ro.observe(canvas.current);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelected(null);
        setLegacyId(null);
        setSettings(false);
        setLibrary(false);
        setAnchor(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const positioned = useMemo(
    () => stars.map((s) => ({ ...s, ...precessJ2000(s.ra, s.dec, date) })),
    [date],
  );
  const byPosition = useMemo(
    () => new Map(positioned.map((s) => [s.id, s])),
    [positioned],
  );
  const constellationGeometry = useMemo(
    () =>
      constellations.map((c) => ({
        ...c,
        center: precessJ2000(c.center[0], c.center[1], date),
        paths: c.lines.map((path) =>
          path.map((p) => precessJ2000(p[0], p[1], date)),
        ),
      })),
    [date],
  );
  const galaxy = useMemo(
    () =>
      Array.from({ length: 181 }, (_, i) =>
        precessJ2000(
          galacticToEquatorial(i * 2).ra,
          galacticToEquatorial(i * 2).dec,
          date,
        ),
      ),
    [date],
  );
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const context = c.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;
    const dpr = Math.min(devicePixelRatio || 1, 2),
      { w, h } = size;
    if (c.width !== Math.round(w * dpr)) c.width = Math.round(w * dpr);
    if (c.height !== Math.round(h * dpr)) c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(
      w * 0.6,
      h * 0.45,
      0,
      w * 0.5,
      h * 0.5,
      Math.max(w, h),
    );
    bg.addColorStop(0, "#10172b");
    bg.addColorStop(0.6, "#060e1c");
    bg.addColorStop(1, "#030813");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const radius = Math.max(w, h) * 0.78 * camera.zoom,
      cx = w * 0.52,
      cy = h * 0.5;
    const project = (s: { ra: number; dec: number }) => {
      const p = projectStar(s.ra, s.dec, camera.ra, camera.dec);
      return { x: cx + p.x * radius, y: cy + p.y * radius, z: p.z };
    };
    function strokePath(
      path: { ra: number; dec: number }[],
      color: string,
      width: number,
      blur = 0,
    ) {
      ctx.beginPath();
      let open = false;
      for (const s of path) {
        const p = project(s);
        if (p.z <= 0.02) {
          open = false;
          continue;
        }
        if (!open) {
          ctx.moveTo(p.x, p.y);
          open = true;
        } else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowBlur = blur;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.save();
    ctx.filter = "blur(22px)";
    strokePath(galaxy, "rgba(113,101,162,.055)", 100 * camera.zoom, 65);
    strokePath(galaxy, "rgba(154,133,180,.065)", 46 * camera.zoom, 35);
    ctx.restore();
    if (lines)
      for (const constellation of constellationGeometry)
        for (const path of constellation.paths)
          strokePath(
            path,
            constellation.id === selectedConstellation
              ? "rgba(225,204,155,.72)"
              : "rgba(135,159,191,.22)",
            constellation.id === selectedConstellation ? 1.15 : 0.65,
          );
    for (const [a, b] of notes.connections) {
      const s = byPosition.get(a),
        t = byPosition.get(b);
      if (s && t) strokePath([s, t], "rgba(232,198,137,.7)", 1.15);
    }
    const found: typeof hits.current = [];
    for (const s of positioned) {
      if (
        s.mag > magnitude &&
        !notes.thoughts[s.id] &&
        s.id !== selected &&
        s.id !== anchor
      )
        continue;
      const p = project(s);
      if (p.z <= 0 || p.x < -15 || p.x > w + 15 || p.y < -15 || p.y > h + 15)
        continue;
      const r =
        Math.max(0.6, 2.1 - s.mag * 0.25) *
        Math.min(1.7, Math.sqrt(camera.zoom));
      const color =
        s.bv < 0.1 ? "#c2d9ff" : s.bv > 0.95 ? "#f3ccab" : "#e9edf8";
      ctx.globalAlpha = Math.min(1, 1.05 - s.mag * 0.08);
      if (s.mag < 1.6 || s.id === selected || notes.thoughts[s.id]) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
        glow.addColorStop(0, s.id === selected ? "#ead3a76b" : "#c3d9ff45");
        glow.addColorStop(1, "#c3d9ff00");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (notes.thoughts[s.id] || s.id === selected || s.id === anchor) {
        ctx.strokeStyle = s.id === anchor ? "#d9addb" : "#d8bd85";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (names && (s.mag < 1.2 || notes.thoughts[s.id] || s.id === selected)) {
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = notes.thoughts[s.id] ? "#dfc799" : "#aabdd5";
        ctx.font = "11px Georgia";
        ctx.fillText(s.name, p.x + 9, p.y - 7);
      }
      found.push({ star: s, x: p.x, y: p.y });
    }
    ctx.globalAlpha = 1;
    hits.current = found;
    if (names) {
      ctx.font = "9px Arial";
      ctx.fillStyle = "#7b8aa4";
      ctx.textAlign = "center";
      for (const c of constellationGeometry) {
        const p = project(c.center);
        if (p.z > 0.2 && p.x > 60 && p.x < w - 60 && p.y > 75 && p.y < h - 90) {
          ctx.globalAlpha = c.id === selectedConstellation ? 0.8 : 0.35;
          ctx.fillText(c.name.toUpperCase(), p.x, p.y);
        }
      }
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }
  }, [
    positioned,
    byPosition,
    constellationGeometry,
    galaxy,
    camera,
    size,
    lines,
    names,
    magnitude,
    notes,
    selected,
    anchor,
    selectedConstellation,
  ]);
  function focusStar(star: RealStar) {
    const p = byPosition.get(star.id)!;
    setFollowing(false);
    setCamera((c) => ({
      ...c,
      ra: p.ra,
      dec: p.dec,
      zoom: Math.max(c.zoom, 1.05),
    }));
    selectStar(star);
    setQuery("");
  }
  function selectStar(star: RealStar) {
    setPickingLegacy(false);
    onChime();
    if (connect) {
      if (!anchor) setAnchor(star.id);
      else if (anchor !== star.id) {
        setNotes((n) => ({
          ...n,
          connections: n.connections.some(
            (e) => e.includes(anchor) && e.includes(star.id),
          )
            ? n.connections.filter(
                (e) => !(e.includes(anchor) && e.includes(star.id)),
              )
            : [...n.connections, [anchor, star.id]],
        }));
        setAnchor(null);
      }
      return;
    }
    setSelected(star.id);
    setLibrary(false);
    setSettings(false);
  }
  function focusConstellation(id: string) {
    setSelectedConstellation(id);
    const c = constellationGeometry.find((c) => c.id === id);
    if (c) {
      setFollowing(false);
      setCamera({ ra: c.center.ra, dec: c.center.dec, zoom: 1.3 });
      onChime();
    }
  }
  function updateThought(change: Partial<Thought>) {
    if (legacyId && legacyThought) {
      setLegacy((l) =>
        l
          ? {
              ...l,
              stars: l.stars.map((s) =>
                s.id === legacyId
                  ? {
                      ...s,
                      title: change.title ?? s.title,
                      note: change.text ?? s.note,
                    }
                  : s,
              ),
            }
          : l,
      );
      return;
    }
    if (!chosen) return;
    setNotes((n) => ({
      ...n,
      thoughts: {
        ...n.thoughts,
        [chosen.id]: {
          title: change.title ?? n.thoughts[chosen.id]?.title ?? "",
          text: change.text ?? n.thoughts[chosen.id]?.text ?? "",
        },
      },
    }));
  }
  function attachLegacy() {
    if (!legacyThought || !chosen) return;
    const existing = notes.thoughts[chosen.id];
    if (
      existing &&
      (existing.title || existing.text) &&
      !confirm(
        "This star already has writing. Replace it with this earlier thought? The earlier copy stays safe.",
      )
    )
      return;
    setNotes((n) => ({
      ...n,
      thoughts: {
        ...n.thoughts,
        [chosen.id]: { title: legacyThought.title, text: legacyThought.note },
      },
    }));
    setLegacyId(null);
    setNotice(
      `Your thought now belongs to ${chosen.name}. The earlier copy is kept safe.`,
    );
  }
  function reset() {
    setDate(new Date());
    setFollowing(true);
    setCamera({
      ra: siderealDegrees(new Date(), observer.lon),
      dec: observer.lat,
      zoom: 1,
    });
    setSelectedConstellation("");
  }
  async function locate() {
    if (!navigator.geolocation) {
      setNotice("Location is unavailable. Choose a city instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setObserver({
          name: "Your location",
          lat: p.coords.latitude,
          lon: p.coords.longitude,
        });
        setFollowing(true);
      },
      () => setNotice("Location could not be read. Choose a city instead."),
      { timeout: 10000, maximumAge: 600000 },
    );
  }
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? stars
          .filter(
            (s) => s.name.toLowerCase().includes(q) || String(s.hip) === q,
          )
          .sort((a, b) => a.mag - b.mag)
          .slice(0, 8)
      : [];
  }, [query]);
  const actual = chosen ? byPosition.get(chosen.id) : undefined,
    where = actual
      ? horizontalPosition(
          actual.ra,
          actual.dec,
          observer.lat,
          observer.lon,
          date,
        )
      : null;
  const currentThought = legacyThought
    ? { title: legacyThought.title, text: legacyThought.note }
    : chosen
      ? notes.thoughts[chosen.id] || { title: "", text: "" }
      : null;
  return (
    <section className="real-sky-scene" aria-label="Your real star sky">
      <canvas
        ref={canvas}
        className="real-star-canvas"
        aria-label="Real star sky. Drag to look around; click a star to write. Use the star search for keyboard selection."
        role="img"
        tabIndex={0}
        onKeyDown={(e) => {
          if (
            [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "+",
              "-",
              "Home",
            ].includes(e.key)
          )
            e.preventDefault();
          if (e.key === "Home") reset();
          else if (e.key === "+" || e.key === "-")
            setCamera((c) => ({
              ...c,
              zoom: Math.max(
                0.5,
                Math.min(4, c.zoom + (e.key === "+" ? 0.2 : -0.2)),
              ),
            }));
          else if (e.key.startsWith("Arrow")) {
            setFollowing(false);
            setCamera((c) => ({
              ...c,
              ra: wrapDegrees(
                c.ra +
                  (e.key === "ArrowLeft" ? 8 : e.key === "ArrowRight" ? -8 : 0),
              ),
              dec: Math.max(
                -85,
                Math.min(
                  85,
                  c.dec +
                    (e.key === "ArrowUp" ? 8 : e.key === "ArrowDown" ? -8 : 0),
                ),
              ),
            }));
          }
        }}
        onPointerDown={(e) => {
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            ra: camera.ra,
            dec: camera.dec,
            moved: false,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) d.moved = true;
          if (d.moved) {
            setFollowing(false);
            const next = {
              ...newestCamera.current,
              ra: wrapDegrees(d.ra + ((e.clientX - d.x) * 0.09) / camera.zoom),
              dec: Math.max(
                -85,
                Math.min(85, d.dec + ((e.clientY - d.y) * 0.09) / camera.zoom),
              ),
            };
            cancelAnimationFrame(frame.current);
            frame.current = requestAnimationFrame(() => setCamera(next));
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d?.moved) return;
          const r = e.currentTarget.getBoundingClientRect(),
            x = e.clientX - r.left,
            y = e.clientY - r.top;
          const hit = hits.current
            .map((p) => ({ ...p, distance: Math.hypot(p.x - x, p.y - y) }))
            .filter((p) => p.distance < 13)
            .sort((a, b) => a.distance - b.distance)[0];
          if (hit) selectStar(hit.star);
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      />
      <div className="real-sky-heading">
        <div className="realm-eyebrow">
          <span /> ONE SKY. YOUR STORIES AMONG REAL STARS.
        </div>
        <h1>
          Nancy, choose
          <br />
          <em>your little light.</em>
        </h1>
        <p>
          Every point is a real catalogued star.
          <br />
          Pick one. Leave a thought. Make a connection.
        </p>
      </div>
      <div className="real-sky-controls">
        <div className="star-search">
          <Search size={14} />
          <input
            aria-label="Find a real star"
            placeholder="Sirius, Antares, Polaris…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="Clear star search" onClick={() => setQuery("")}>
              <X size={13} />
            </button>
          )}
          {query && (
            <div
              className="star-results"
              role="list"
              aria-label="Matching stars"
            >
              {results.length ? (
                results.map((s) => (
                  <button key={s.id} onClick={() => focusStar(s)}>
                    <span>
                      {s.name}
                      <small>
                        {s.constellation} · HIP {s.hip}
                      </small>
                    </span>
                    <PenLine size={12} />
                  </button>
                ))
              ) : (
                <p>No matching stars. Try a name or Hipparcos number.</p>
              )}
            </div>
          )}
        </div>
        <select
          aria-label="Find a constellation"
          value={selectedConstellation}
          onChange={(e) => focusConstellation(e.target.value)}
        >
          <option value="">Follow a constellation…</option>
          {constellations.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.id === "Sco" ? " / Scorpio" : ""}
            </option>
          ))}
        </select>
        <div className="real-sky-actions">
          <button
            onClick={() => {
              setSettings((v) => !v);
              setSelected(null);
              setLegacyId(null);
              setLibrary(false);
            }}
            aria-expanded={settings}
          >
            <MapPin size={12} />
            {observer.name}
          </button>
          <button
            onClick={() => {
              setLibrary((v) => !v);
              setSelected(null);
              setLegacyId(null);
              setSettings(false);
            }}
            aria-expanded={library}
          >
            <BookOpen size={12} />
            Your saved thoughts
          </button>
        </div>
      </div>
      <div className="sky-instrument-bar">
        <button onClick={reset}>
          <Scan size={13} />
          Your sky now
        </button>
        <i />
        <button
          aria-label="Zoom into the real sky"
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.min(4, c.zoom + 0.25) }))
          }
        >
          <Plus size={15} />
        </button>
        <button
          aria-label="Zoom out of the real sky"
          onClick={() =>
            setCamera((c) => ({ ...c, zoom: Math.max(0.5, c.zoom - 0.25) }))
          }
        >
          <Minus size={15} />
        </button>
        <i />
        <button aria-pressed={lines} onClick={() => setLines((v) => !v)}>
          <Eye size={12} />
          Constellations
        </button>
        <button
          aria-pressed={connect}
          onClick={() => {
            setConnect((v) => !v);
            setAnchor(null);
          }}
        >
          <Link2 size={13} />
          Connect stars
        </button>
        <span className={saved ? "" : "storage-warning"}>
          {saved ? "Saved here" : "Not saved on this device"}
        </span>
      </div>
      <div className="sky-live-status">
        <span className="live-dot" />
        {following ? "SKY OVER" : "EXPLORING FROM"}{" "}
        {observer.name.toUpperCase()} ·{" "}
        {ready
          ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Opening your sky…"}
        <small>
          {connect
            ? anchor
              ? "Choose the next real star. Choose the same pair to remove a link."
              : "Choose two real stars to weave a connection."
            : "Drag to look around · click a star to write"}
        </small>
      </div>
      {pickingLegacy && legacyThought && (
        <div className="pending-star-thought">
          Finding a star for “{legacyThought.title}”
          <button onClick={() => setPickingLegacy(false)}>
            Back to writing
          </button>
        </div>
      )}
      {settings && (
        <aside className="sky-settings">
          <button
            className="panel-close"
            aria-label="Close sky settings"
            onClick={() => setSettings(false)}
          >
            <X size={15} />
          </button>
          <span className="card-kicker">YOUR PLACE BENEATH THE SKY</span>
          <h2>A real sky, wherever you are.</h2>
          <label>
            Reference location
            <select
              aria-label="Sky reference location"
              value={
                locations.some((l) => l.name === observer.name)
                  ? observer.name
                  : "custom"
              }
              onChange={(e) => {
                const l = locations.find((l) => l.name === e.target.value);
                if (l) {
                  setObserver(l);
                  setFollowing(true);
                }
              }}
            >
              {locations.map((l) => (
                <option key={l.name}>{l.name}</option>
              ))}
              {observer.name === "Your location" && (
                <option value="custom">Your location</option>
              )}
            </select>
          </label>
          <button className="sky-locate" onClick={() => void locate()}>
            <LocateFixed size={13} />
            Use my location
          </button>
          <label>
            <Clock size={11} />
            Time in your device timezone
            <input
              type="datetime-local"
              aria-label="Sky date and time"
              value={localDateTime(date)}
              onChange={(e) => {
                const next = new Date(e.target.value);
                if (Number.isFinite(next.getTime())) {
                  setFollowing(false);
                  setDate(next);
                  setCamera((c) => ({
                    ...c,
                    ra: siderealDegrees(next, observer.lon),
                    dec: observer.lat,
                  }));
                }
              }}
            />
          </label>
          <label>
            Visible star depth <span>{magnitude.toFixed(1)} mag</span>
            <input
              type="range"
              aria-label="Visible star depth"
              min={3}
              max={6}
              step={0.1}
              value={magnitude}
              onChange={(e) => setMagnitude(Number(e.target.value))}
            />
          </label>
          <button
            className="names-toggle"
            onClick={() => setNames((v) => !v)}
            aria-pressed={names}
          >
            Star names {names ? "on" : "off"}
          </button>
          <p>
            5,044 measured stars and 88 constellations. Positions use
            Hipparcos/XHIP coordinates, precessed from J2000. No planets,
            refraction, or proper-motion correction. New Delhi is a reference
            until you choose a location.
          </p>
        </aside>
      )}
      {library && (
        <aside className="sky-thought-library">
          <button
            className="panel-close"
            aria-label="Close saved thoughts"
            onClick={() => setLibrary(false)}
          >
            <X size={15} />
          </button>
          <span className="card-kicker">THE LIGHTS YOU’VE LEFT BEHIND</span>
          <h2>Your saved thoughts</h2>
          {Object.entries(notes.thoughts).map(([id, t]) => (
            <button
              key={id}
              onClick={() => {
                setLegacyId(null);
                focusStar(byId.get(id)!);
              }}
            >
              <Stars size={12} />
              <span>
                {t.title || byId.get(id)!.name}
                <small>{byId.get(id)!.name}</small>
              </span>
              <ChevronRight size={12} />
            </button>
          ))}
          {!Object.keys(notes.thoughts).length && (
            <p>Choose a real star to leave your first thought.</p>
          )}
          {!!legacy?.stars.length && (
            <>
              <h3>Earlier thoughts, kept safe</h3>
              <p>Pick a thought, then a real star to give it a home.</p>
              {legacy.stars.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setLegacyId(t.id);
                    setSelected(null);
                    setLibrary(false);
                  }}
                >
                  <PenLine size={12} />
                  <span>
                    {t.title || "An earlier thought"}
                    <small>Waiting for a real star</small>
                  </span>
                  <ChevronRight size={12} />
                </button>
              ))}
            </>
          )}
        </aside>
      )}
      {currentThought && !pickingLegacy && (
        <aside className="real-star-editor" aria-label="Write on a real star">
          <button
            className="panel-close"
            aria-label="Close star writing"
            onClick={() => {
              setSelected(null);
              setLegacyId(null);
            }}
          >
            <X size={15} />
          </button>
          <span className="card-kicker">
            {chosen
              ? "A REAL STAR. A LITTLE PIECE OF YOU."
              : "AN EARLIER THOUGHT, KEPT SAFE"}
          </span>
          <h2>{chosen?.name || "Find this thought a star."}</h2>
          {chosen && (
            <div className="star-science">
              <span>
                HIP {chosen.hip} · {chosen.constellation} ·{" "}
                {chosen.mag.toFixed(2)} mag
              </span>
              <span>
                {where && where.altitude >= 0 ? "Above" : "Below"} the horizon ·{" "}
                {Math.abs(where?.altitude || 0).toFixed(0)}° from{" "}
                {observer.name}
              </span>
            </div>
          )}
          <input
            aria-label="Name this thought"
            maxLength={100}
            placeholder="Give this thought a name…"
            value={currentThought.title}
            onChange={(e) => updateThought({ title: e.target.value })}
          />
          <textarea
            aria-label="Write your thought"
            maxLength={10000}
            placeholder="A memory, a wish, a thought worth keeping…"
            value={currentThought.text}
            onChange={(e) => updateThought({ text: e.target.value })}
          />
          {legacyThought && chosen ? (
            <button className="attach-thought" onClick={attachLegacy}>
              <Link2 size={12} />
              Attach this thought to {chosen.name}
            </button>
          ) : legacyThought ? (
            <>
              <p>
                Choose a real star to give this thought a home. Your earlier
                copy stays safe.
              </p>
              <button
                className="attach-thought"
                onClick={() => {
                  setPickingLegacy(true);
                  document
                    .querySelector<HTMLInputElement>(
                      '[aria-label="Find a real star"]',
                    )
                    ?.focus();
                }}
              >
                <Stars size={12} />
                Choose its real star
              </button>
            </>
          ) : (
            <div className="star-editor-footer">
              <span>
                <Check size={11} />
                Saved as you write
              </span>
              <button
                aria-label="Remove writing from this star"
                disabled={!chosen || !notes.thoughts[chosen.id]}
                onClick={() => {
                  if (
                    chosen &&
                    confirm(
                      "Remove the writing from this star? The star and connections will stay.",
                    )
                  )
                    setNotes((n) => {
                      const t = { ...n.thoughts };
                      delete t[chosen.id];
                      return { ...n, thoughts: t };
                    });
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </aside>
      )}
      {notice && (
        <div className="realm-toast" role="status">
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </section>
  );
}
