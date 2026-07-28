export default function SoldOutStamp({ size = 'lg' }: { size?: 'md' | 'lg' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-blackout/90 z-20">
      <div className="text-center">
        <div
          className={
            'zvc-stamp font-display text-destructive tracking-widest border-4 border-destructive px-4 py-1 ' +
            (size === 'lg' ? 'text-5xl md:text-6xl' : 'text-4xl md:text-5xl')
          }
          style={{ textShadow: 'none' }}
        >
          SOLD OUT
        </div>
        {size === 'lg' && (
          <div className="mt-4 font-utility text-glow/60 text-lg uppercase tracking-wider">
            Event at capacity
          </div>
        )}
      </div>
    </div>
  );
}
