export default function ScanLineOverlay() {
  return (
    <div
      className="animate-scanline"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(78, 154, 62, 0.015) 2px, rgba(78, 154, 62, 0.015) 4px)',
        opacity: 0.5,
      }}
    />
  );
}
