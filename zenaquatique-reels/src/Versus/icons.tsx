import React from "react";

type IconProps = { color: string; size: number };
type IconComponent = React.FC<IconProps>;

const Check: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="4,13 9,18 20,6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Cross: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <line x1={5} y1={5} x2={19} y2={19} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={19} y1={5} x2={5} y2={19} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </svg>
);

const TrendingUp: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="3,17 10,10 14,14 21,6" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="15,6 21,6 21,12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrendingDown: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polyline points="3,7 10,14 14,10 21,18" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="15,18 21,18 21,12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Clock: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2.5} />
    <polyline points="12,7 12,12 16,14" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Warning: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polygon points="12,3 22,20 2,20" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />
    <line x1={12} y1={9} x2={12} y2={14} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <circle cx={12} cy={17.3} r={1.15} fill={color} />
  </svg>
);

const Star: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <polygon
      points="12,2 15,9 22,9.5 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9.5 9,9"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </svg>
);

const Heart: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 20 C6 15 2 11.5 2 7.8 C2 5 4.2 3 6.8 3 C8.6 3 10.3 4 12 6 C13.7 4 15.4 3 17.2 3 C19.8 3 22 5 22 7.8 C22 11.5 18 15 12 20 Z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </svg>
);

const Lightbulb: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M9 18 h6 M10 21 h4 M12 3 a6 6 0 0 1 3.5 10.9 c-0.6 0.5 -1 1.3 -1 2.1 h-5 c0 -0.8 -0.4 -1.6 -1 -2.1 A6 6 0 0 1 12 3 Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRight: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <line x1={4} y1={12} x2={19} y2={12} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <polyline points="13,6 19,12 13,18" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Euro: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M18 6.5 A7 7 0 1 0 18 17.5" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    <line x1={3} y1={10} x2={14} y2={10} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    <line x1={3} y1={14} x2={13} y2={14} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </svg>
);

const Leaf: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 20 C4 10 10 4 20 4 C20 14 14 20 4 20 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <line x1={4} y1={20} x2={14} y2={10} stroke={color} strokeWidth={2} strokeLinecap="round" />
  </svg>
);

const Drop: IconComponent = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3 C16 9 19 12.5 19 15.5 A7 7 0 0 1 5 15.5 C5 12.5 8 9 12 3 Z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </svg>
);

// Small, brand-neutral overlay icon set. Vocabulary chosen to cover
// generic marketing/before-after beats (check/cross/trending/warning/
// clock/star/heart/lightbulb/arrow/euro) plus a couple relevant to
// ZenAquatique's aquascaping niche (leaf, drop). Icon selection is meant
// to be driven by a per-segment "icon" tag Claude adds to its generated
// script JSON in Make — see README's "Icônes contextuelles" section for
// the exact vocabulary Make should be told to use (must match these keys
// exactly, lowercase with underscores).
export const ICONS = {
  check: Check,
  cross: Cross,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  clock: Clock,
  warning: Warning,
  star: Star,
  heart: Heart,
  lightbulb: Lightbulb,
  arrow_right: ArrowRight,
  euro: Euro,
  leaf: Leaf,
  drop: Drop,
} as const satisfies Record<string, IconComponent>;

export type IconName = keyof typeof ICONS;
