"use client";
import { useEffect, useRef, useState } from "react";
const tonesFor = (place: string) =>
  place === "forest"
    ? [146.83, 220, 293.66]
    : place === "lake"
      ? [110, 164.81, 220]
      : [130.81, 196, 261.63];
export default function useRealmAudio(place: string) {
  const [sound, setSound] = useState(false),
    [error, setError] = useState("");
  const context = useRef<AudioContext | null>(null),
    master = useRef<GainNode | null>(null),
    voices = useRef<OscillatorNode[]>([]);
  useEffect(
    () => () => {
      void context.current?.close();
    },
    [],
  );
  useEffect(() => {
    const frequencies = tonesFor(place);
    if (context.current)
      voices.current.forEach((o, i) =>
        o.frequency.setTargetAtTime(
          frequencies[i],
          context.current!.currentTime,
          1.2,
        ),
      );
  }, [place]);
  async function toggle() {
    try {
      if (sound) {
        master.current?.gain.setTargetAtTime(
          0,
          context.current!.currentTime,
          0.25,
        );
        setSound(false);
        return;
      }
      if (!context.current) {
        const ctx = new AudioContext();
        context.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(ctx.destination);
        master.current = gain;
        tonesFor(place).forEach((f, i) => {
          const o = ctx.createOscillator(),
            g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = f;
          o.detune.value = i * 3;
          g.gain.value = 0.017;
          o.connect(g);
          g.connect(gain);
          o.start();
          voices.current.push(o);
        });
      }
      await context.current.resume();
      master.current!.gain.setTargetAtTime(
        0.65,
        context.current.currentTime,
        0.5,
      );
      setSound(true);
      setError("");
    } catch {
      setError("Your browser could not start audio. You can still explore.");
    }
  }
  function chime() {
    if (!sound || !context.current || !master.current) return;
    const ctx = context.current,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.frequency.value = [523.25, 659.25, 783.99, 1046.5][
      Math.floor(Math.random() * 4)
    ];
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2);
    o.connect(g);
    g.connect(master.current);
    o.start();
    o.stop(ctx.currentTime + 2.1);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  return { sound, toggle, chime, error };
}
