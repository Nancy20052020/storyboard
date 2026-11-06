import { useId } from "react";
export type IslandKind = "sky" | "forest" | "lake";
export default function IslandArt({ kind }: { kind: IslandKind }) {
  const id = useId().replace(/:/g, "");
  const forest = kind === "forest",
    lake = kind === "lake";
  const top = forest ? "#345746" : lake ? "#48556e" : "#686283";
  return (
    <svg
      viewBox="0 0 600 450"
      fill="none"
      aria-hidden="true"
      className={`island-art art-${kind}`}
    >
      <defs>
        <linearGradient
          id={`${id}-rock`}
          x1="300"
          y1="250"
          x2="300"
          y2="420"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={forest ? "#263f3c" : "#39374e"} />
          <stop offset="1" stopColor="#121923" />
        </linearGradient>
        <radialGradient id={`${id}-top`}>
          <stop stopColor={top} />
          <stop
            offset="1"
            stopColor={forest ? "#203a32" : lake ? "#2e3b52" : "#38354f"}
          />
        </radialGradient>
        <radialGradient id={`${id}-glow`}>
          <stop
            stopColor={forest ? "#bde7a0" : lake ? "#a2d7dd" : "#d2c5ff"}
            stopOpacity=".6"
          />
          <stop
            offset="1"
            stopColor={forest ? "#bde7a0" : "#c1b9f9"}
            stopOpacity="0"
          />
        </radialGradient>
        <linearGradient
          id={`${id}-water`}
          x1="260"
          y1="210"
          x2="320"
          y2="310"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#a6d6d5" stopOpacity=".8" />
          <stop offset="1" stopColor="#375375" stopOpacity=".5" />
        </linearGradient>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <ellipse
        cx="300"
        cy="370"
        rx="192"
        ry="34"
        fill="#030b13"
        opacity=".25"
        filter={`url(#${id}-blur)`}
      />
      <path
        d="M91 248 128 305 180 316 217 370 253 362 292 413 329 352 368 368 414 310 468 297 511 246Z"
        fill={`url(#${id}-rock)`}
      />
      <path
        d="m128 279 52 37 37 54 4-86m37 10 34 119 8-118m68-12 0 85 46-58m-85 42 15-69"
        stroke={forest ? "#61826a" : "#79708e"}
        strokeOpacity=".13"
        strokeWidth="2"
      />
      <path
        d="m91 248 47 44 65 4 47 25 47-9 45 3 59-23 67 5 43-51-31-34-54-8-44-29-64 9-46-16-59 20-67 1-38 33Z"
        fill={`url(#${id}-top)`}
      />
      <path
        d="m92 247 55 24 53-2 49 20 52-5 46 7 50-23 61 8 52-30"
        stroke={forest ? "#9ac08b" : "#b5aac9"}
        strokeOpacity=".25"
        strokeWidth="2"
      />
      <ellipse
        cx="302"
        cy="242"
        rx="136"
        ry="70"
        fill={`url(#${id}-glow)`}
        opacity=".2"
      />
      {forest ? (
        <>
          {[
            { x: 161, y: 206, s: 0.8 },
            { x: 221, y: 173, s: 1.12 },
            { x: 355, y: 177, s: 1.25 },
            { x: 415, y: 217, s: 0.85 },
            { x: 278, y: 206, s: 0.65 },
          ].map((t, i) => (
            <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
              <path d="M0 42V-54" stroke="#9f9c72" strokeWidth="7" />
              <path
                d="m0 4-22-22M0-14l24-22"
                stroke="#8c926a"
                strokeWidth="4"
              />
              <path
                d="M-53-18C-84-50-31-65-34-84c-4-28 32-39 43-11 29-16 56 17 39 35 38 16 31 47-2 45-13 22-42 20-51 9-16 11-39 7-48-12Z"
                fill={
                  ["#385a43", "#4b7150", "#3e6447", "#54714a", "#5e7e53"][i]
                }
              />
              <path
                d="M-36-57c12-19 30-26 49-22M11-41c15-7 25-7 40-1"
                stroke="#a5c080"
                strokeOpacity=".2"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>
          ))}
          <path
            d="M197 267q54-44 94-14t76-15"
            stroke="#a5b68a"
            strokeWidth="13"
            strokeOpacity=".25"
            strokeLinecap="round"
          />
          <g transform="translate(322 242)">
            <ellipse cx="0" cy="8" rx="16" ry="7" fill="#102927" />
            <path
              d="M-10 6q-8-21-6-33l14 12q6-3 13-1l12-14q1 22-7 34"
              fill="#c8b58a"
            />
            <path d="m-12-17 8 8m19-8-7 8" stroke="#e4d1a5" strokeWidth="3" />
            <path
              d="M-6-6h1m12 0h1"
              stroke="#193e34"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          {[
            { x: 165, y: 254 },
            { x: 390, y: 253 },
            { x: 251, y: 272 },
          ].map((m, i) => (
            <g key={i} transform={`translate(${m.x} ${m.y})`}>
              <path d="M0 8V-3" stroke="#c5c39d" strokeWidth="3" />
              <path d="M-9-1Q0-19 9-1Z" fill="#bfcf9a" />
              <circle cx="-2" cy="-4" r="1.5" fill="#efffc5" />
            </g>
          ))}
          {[
            { x: 190, y: 144 },
            { x: 302, y: 145 },
            { x: 389, y: 187 },
            { x: 255, y: 225 },
            { x: 145, y: 234 },
            { x: 354, y: 260 },
          ].map((f, i) => (
            <g key={i}>
              <circle cx={f.x} cy={f.y} r="12" fill={`url(#${id}-glow)`} />
              <circle cx={f.x} cy={f.y} r="2" fill="#dcf9a8" />
            </g>
          ))}
          <path
            d="m140 289-3 31m305-28-10 30m-256-10 2 22"
            stroke="#83a47c"
            strokeOpacity=".4"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : lake ? (
        <>
          <path
            d="M185 236c20-39 83-55 133-40s109 36 87 64-87 32-142 17-103-13-78-41Z"
            fill={`url(#${id}-water)`}
            stroke="#aac8cf"
            strokeOpacity=".35"
            strokeWidth="2"
          />
          <ellipse
            cx="292"
            cy="240"
            rx="72"
            ry="19"
            stroke="#c2d7df"
            strokeOpacity=".18"
          />
          <ellipse
            cx="292"
            cy="240"
            rx="43"
            ry="10"
            stroke="#c2d7df"
            strokeOpacity=".3"
          />
          <g transform="translate(300 111)">
            <circle r="33" fill={`url(#${id}-glow)`} transform="scale(2)" />
            <path
              d="M13-31a34 34 0 1 0 17 49A29 29 0 0 1 13-31Z"
              fill="#e8dcba"
            />
            <path
              d="M0 44v65"
              stroke="#f3e6ba"
              strokeOpacity=".2"
              strokeDasharray="2 8"
            />
          </g>
          {[
            { x: 220, y: 230 },
            { x: 345, y: 244 },
            { x: 275, y: 265 },
          ].map((l, i) => (
            <g key={i} transform={`translate(${l.x} ${l.y})`}>
              <ellipse cy="14" rx="14" ry="3" fill="#e9d5a4" opacity=".2" />
              <rect
                x="-5"
                y="-8"
                width="10"
                height="16"
                rx="4"
                fill="#e7c487"
              />
              <path d="M-4-3h8m-4-4v14" stroke="#fff2c7" strokeOpacity=".6" />
              <circle r="25" fill={`url(#${id}-glow)`} />
            </g>
          ))}
          <path
            d="m151 255 14-15 12 12m252-9-14-21-18 13m-35-38 6-23 18 19"
            stroke="#8296a5"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M390 282q10 47-18 83"
            stroke="#7bbcc8"
            strokeWidth="10"
            strokeOpacity=".28"
          />
          <path
            d="M390 282q4 47-18 83"
            stroke="#c1ecdd"
            strokeWidth="2"
            strokeOpacity=".35"
          />
        </>
      ) : (
        <>
          <g transform="translate(300 173)">
            <ellipse cy="65" rx="82" ry="22" fill="#141e31" />
            <path d="M-73 59h146l-12-10H-60Z" fill="#8b8197" />
            <path d="M-53 49h106l-9-9h-88Z" fill="#b2a2b8" />
            <path d="M-23 39v-77h46v77" fill="#81778d" />
            <path d="M-29-38h58l-4-8h-50Z" fill="#b8a8bb" />
            <path d="M-13 38v-59q13-18 26 0v59" fill="#37394f" />
            <ellipse cy="-43" rx="10" ry="5" fill="#d6c6ef" />
            <circle cy="-68" r="29" fill={`url(#${id}-glow)`} />
            <path
              d="m0-84 5 12 13 4-13 5-5 13-5-13-13-5 13-4Z"
              fill="#e5d6ff"
            />
            <path
              d="M-50-2 0-68l54 72-31 33-72-39Z"
              stroke="#d9cbf6"
              strokeOpacity=".4"
              strokeDasharray="2 5"
            />
            <circle cx="-50" cy="-2" r="3" fill="#efdebb" />
            <circle cx="54" cy="4" r="3" fill="#efdebb" />
            <circle cx="23" cy="37" r="3" fill="#efdebb" />
          </g>
          <path
            d="m176 232 10-38 9 38-9 6Zm218 12 8-27 8 27-8 6Z"
            fill="#c6b5db"
            fillOpacity=".6"
          />
          <path
            d="m191 264 35-17m133 10 30 9m-144 10 9-5"
            stroke="#c1b4d1"
            strokeOpacity=".35"
            strokeWidth="2"
          />
          <path
            d="m174 301-6 36m246-37 8 34"
            stroke="#c6b2df"
            strokeWidth="2"
            strokeOpacity=".4"
          />
          <circle cx="424" cy="138" r="28" fill={`url(#${id}-glow)`} />
          <path d="m424 126 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#d5bce7" />
        </>
      )}
      <path
        d="M243 353 231 375 239 385 252 367Z"
        fill={forest ? "#38534b" : "#48445f"}
        opacity=".65"
      />
      <path
        d="m378 365 9 18 14-17-12-11Z"
        fill={forest ? "#38534b" : "#48445f"}
        opacity=".5"
      />
    </svg>
  );
}
