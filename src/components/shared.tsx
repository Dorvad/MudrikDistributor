import logoGray from '../assets/logo-gray.png';
import logoPurple from '../assets/logo-purple.png';

const LOGOS = {
  // Selection screen.
  purple: { src: logoPurple, width: 1624, height: 132 },
  // Results screen, where the purple tones mark groups only.
  gray: { src: logoGray, width: 1590, height: 132 },
} as const;

export function Logo({ tone }: { tone: keyof typeof LOGOS }) {
  const logo = LOGOS[tone];
  return (
    <h1 className="logo">
      <img src={logo.src} alt="MudrikDidtribution" width={logo.width} height={logo.height} />
    </h1>
  );
}

/** Quiet notice for a browser that refuses to store data. */
export function StorageNote({ available }: { available: boolean }) {
  if (available) return null;
  return (
    <p className="storage-note" role="status">
      השמירה בין ביקורים אינה זמינה בדפדפן הזה. הנתונים יישמרו עד לרענון או לסגירת העמוד.
    </p>
  );
}
