const ITEMS = [
  'Manali',
  'Kasol',
  'Sissu',
  '12 Boys · 12 Girls',
  'Bonfire Night',
  'Ice Breaker Sessions',
  'Verified Profiles',
  '5 Nights / 6 Days',
  '60% Chance of Love',
] as const

export default function MarqueeStrip() {
  const track = [...ITEMS, ...ITEMS]

  return (
    <div className="mq-wrap">
      <div className="mq-track">
        {track.map((item, i) => (
          <span key={`${item}-${i}`} style={{ display: 'contents' }}>
            <span className="mq-i">{item}</span>
            <span className="mq-d">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
