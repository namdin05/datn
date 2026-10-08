const paths: Record<string, string> = {
  '◇': 'm12 3 9 5-9 5-9-5 9-5Zm-6 8v5l6 3 6-3v-5M21 8v7',
  '▦': 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  '▤': 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',
  '▥': 'M4 20V10M10 20V4M16 20v-7M3 20h18',
  '◉': 'M5 7a7 7 0 0 0 0 10M19 7a7 7 0 0 1 0 10M8 10a3 3 0 0 0 0 4M16 10a3 3 0 0 1 0 4M12 12h.01',
  '◎': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  '▣': 'M8 8h12v12H8zM16 8V4H4v12h4',
  '↪': 'M9 5H4v14h5M10 12h11m-4-4 4 4-4 4',
  '↗': 'M7 17 17 7M7 7h10v10',
  '→': 'M4 12h16m-6-6 6 6-6 6',
  '←': 'M20 12H4m6-6-6 6 6 6',
  '＋': 'M12 5v14M5 12h14',
  '×': 'M6 6l12 12M18 6 6 18',
  '✓': 'm5 12 4 4L19 6',
  '✎': 'm15 4 5 5M4 20l1-6L16 3l5 5L10 19l-6 1Z',
  '▷': 'm7 4 14 8-14 8V4Z',
  '◷': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2',
  '♧': 'M9 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM3 20v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2',
  '⚑': 'M5 21V3m0 1c5-3 9 3 14 0v10c-5 3-9-3-14 0',
  '↻': 'M20 7v5h-5M20 12a8 8 0 1 0-2 6',
  '✦': 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
  '☷': 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  '⊗': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 8l8 8M16 8l-8 8',
  eye: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  eyeOff: 'm3 3 18 18M10 5h2c7 0 10 7 10 7s-1 2-3 4M6 6c-3 2-4 6-4 6s3 7 10 7c2 0 4-1 5-2',
};

/** Decorative icons inherit text color and never replace a control's accessible label. */
export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] ?? paths['◇']} /></svg>;
}
