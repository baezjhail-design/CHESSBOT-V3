const PATHS: Record<string, string> = {
  play: 'M8 5.5v13l11-6.5z',
  pause: 'M8 5h3v14H8zM13 5h3v14h-3z',
  flag: 'M6 3v18M6 4h11l-2.5 4L17 12H6',
  flip: 'M7 7h11l-3-3M17 17H6l3 3',
  stop: 'M7 7h10v10H7z',
  board: 'M4 4h16v16H4zM4 12h16M12 4v16',
  pulse: 'M3 12h4l2.5-6 4 12 2.5-6h5',
  sliders: 'M5 6h8M17 6h2M5 12h2M11 12h8M5 18h10M19 18h0M13 4v4M9 10v4M17 16v4',
  chip: 'M8 8h8v8H8zM10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3',
  reset: 'M5 12a7 7 0 1 0 2.2-5.1M5 5v4h4',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M12 4l9 16H3zM12 10v4M12 17.2v.1',
  plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  mic: 'M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM6 11.5a6 6 0 0 0 12 0M12 17.5V21',
  home: 'M4 11l8-7 8 7M6 10v10h12V10',
  close: 'M6 6l12 12M18 6L6 18',
  chevron: 'M9 6l6 6-6 6',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}
