"use client";
import { useState } from "react";
import { Orbit, PenLine } from "lucide-react";
import SkyJournal from "./SkyJournal";
import CosmicAtlas from "./CosmicAtlas";
export default function Observatory({ onChime }: { onChime: () => void }) {
  const [view, setView] = useState<"atlas" | "journal">("atlas");
  return (
    <div className={`observatory-view view-${view}`}>
      <div
        className="observatory-switch"
        role="group"
        aria-label="Observatory view"
      >
        <button
          aria-pressed={view === "atlas"}
          onClick={() => setView("atlas")}
        >
          <Orbit size={15} />
          Explore the universe
        </button>
        <button
          aria-pressed={view === "journal"}
          onClick={() => setView("journal")}
        >
          <PenLine size={14} />
          My stars & writing
        </button>
      </div>
      {view === "atlas" ? (
        <CosmicAtlas onChime={onChime} />
      ) : (
        <SkyJournal onChime={onChime} />
      )}
    </div>
  );
}
