"use client";
import RealSky from "./RealSky";
export default function Observatory({ onChime }: { onChime: () => void }) {
  return <RealSky onChime={onChime} />;
}
