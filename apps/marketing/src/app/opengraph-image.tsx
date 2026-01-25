import { ImageResponse } from 'next/og';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 45%, #e0e7ff 100%)',
        color: '#0f172a',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '88%',
          height: '76%',
          borderRadius: 48,
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 40px 120px rgba(15, 23, 42, 0.18)',
          padding: 64,
          gap: 48,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span
            style={{ fontSize: 20, letterSpacing: 6, textTransform: 'uppercase', color: '#6366f1' }}
          >
            Alignia
          </span>
          <h1 style={{ fontSize: 64, lineHeight: 1.05, margin: '24px 0 16px' }}>
            Achieve goals with clarity and momentum.
          </h1>
          <p style={{ fontSize: 26, color: '#475569', maxWidth: 520 }}>
            Daily rhythm, weekly reviews, and AI insights that keep individuals and families
            aligned.
          </p>
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              fontSize: 20,
              color: '#6366f1',
            }}
          >
            <span>alignia.io</span>
            <span style={{ color: '#94a3b8' }}>|</span>
            <span>Start free</span>
          </div>
        </div>
        <div
          style={{
            flex: '0 0 260px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #6366f1 0%, #3b82f6 100%)',
            borderRadius: 36,
            color: '#fff',
            fontSize: 72,
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
