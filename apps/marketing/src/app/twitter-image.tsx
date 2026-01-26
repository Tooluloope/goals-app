import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 600,
};

export const contentType = 'image/png';

export default function TwitterImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
        color: '#ffffff',
        fontFamily: 'Space Grotesk, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '86%',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 48,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span
            style={{ fontSize: 18, letterSpacing: 6, textTransform: 'uppercase', color: '#a5b4fc' }}
          >
            Alignia
          </span>
          <h1 style={{ fontSize: 58, margin: 0 }}>
            Your 2026 goals,
            <br />
            on one rhythm.
          </h1>
          <p style={{ fontSize: 24, color: '#c7d2fe', maxWidth: 520 }}>
            Align habits, projects, and reviews with AI-powered insights.
          </p>
        </div>
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: 40,
            background: 'linear-gradient(180deg, #6366f1 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 68,
            fontWeight: 700,
          }}
        >
          A
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
