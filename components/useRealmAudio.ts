"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
  async function prepareAudio() {
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
    await context.current!.resume();
  }
  const muteAmbient = useCallback(() => {
    if (context.current && master.current) {
      master.current.gain.cancelScheduledValues(context.current.currentTime);
      master.current.gain.setTargetAtTime(0, context.current.currentTime, 0.08);
    }
    setSound(false);
  }, []);
  async function startMelody() {
    try {
      await prepareAudio();
      muteAmbient();
      setError("");
    } catch {
      setError("Your browser could not start audio. You can still explore.");
      throw new Error("Audio could not start");
    }
  }
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
      await prepareAudio();
      await context.current!.resume();
      master.current!.gain.setTargetAtTime(
        0.65,
        context.current!.currentTime,
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
    muteAmbient();
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
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 2.1);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  async function playNote(frequency: number, kind: string) {
    try {
      await prepareAudio();
    } catch {
      setError("This note could not play. Please try again.");
      return;
    }
    muteAmbient();
    const ctx = context.current!;
    const oscillator = ctx.createOscillator(),
      harmonic = ctx.createOscillator(),
      envelope = ctx.createGain();
    oscillator.type = kind === "sunsprig" ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    harmonic.type = "sine";
    harmonic.frequency.value = frequency * (kind === "moonbell" ? 3 : 2);
    const overtone = ctx.createGain();
    overtone.gain.value = 0.12;
    envelope.gain.setValueAtTime(0.0001, ctx.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
    oscillator.connect(envelope);
    harmonic.connect(overtone);
    overtone.connect(envelope);
    envelope.connect(ctx.destination);
    oscillator.start();
    harmonic.start();
    oscillator.stop(ctx.currentTime + 2);
    harmonic.stop(ctx.currentTime + 2);
    oscillator.onended = () => {
      oscillator.disconnect();
      harmonic.disconnect();
      overtone.disconnect();
      envelope.disconnect();
    };
  }
  return { sound, toggle, chime, playNote, startMelody, muteAmbient, error };
}
