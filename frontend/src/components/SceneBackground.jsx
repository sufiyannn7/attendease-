// Ambient 3D scene for authenticated pages — floating gradient orbs,
// subtle grid, and drifting geometric shapes. Pure CSS (no WebGL).
export default function SceneBackground({ variant = 'default' }) {
  const configs = {
    default: [
      { c: 'bg-emerald/8', s: 'h-[26rem] w-[26rem]', pos: '-top-32 -left-24', d: '0s' },
      { c: 'bg-marker/10', s: 'h-[22rem] w-[22rem]', pos: 'top-1/4 -right-32', d: '-3s' },
      { c: 'bg-coral/6', s: 'h-[20rem] w-[20rem]', pos: '-bottom-24 left-1/3', d: '-6s' },
      { c: 'bg-emerald/5', s: 'h-[18rem] w-[18rem]', pos: 'bottom-1/4 -left-20', d: '-2s' },
    ],
    session: [
      { c: 'bg-emerald/12', s: 'h-[30rem] w-[30rem]', pos: '-top-40 -left-32', d: '0s' },
      { c: 'bg-marker/8', s: 'h-[24rem] w-[24rem]', pos: 'top-1/3 -right-24', d: '-4s' },
      { c: 'bg-emerald/6', s: 'h-[22rem] w-[22rem]', pos: '-bottom-32 right-1/4', d: '-7s' },
    ],
  };
  const orbs = configs[variant] || configs.default;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {orbs.map((o, i) => (
        <div key={i} className={`absolute ${o.pos} ${o.s} ${o.c} rounded-full blur-[110px]`}
          style={{ animation: `orbFloat 12s ease-in-out ${o.d} infinite alternate` }} />
      ))}
      {/* subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #1a2332 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      {/* floating geometric shapes */}
      <div className="absolute left-[15%] top-[20%] h-16 w-16 rotate-12 rounded-xl border-2 border-emerald/10 bg-emerald/5 backdrop-blur-sm"
        style={{ animation: 'shapeFloat 9s ease-in-out -1s infinite alternate' }} />
      <div className="absolute right-[12%] top-[35%] h-10 w-10 -rotate-6 rounded-full border-2 border-marker/15 bg-marker/5"
        style={{ animation: 'shapeFloat 11s ease-in-out -4s infinite alternate' }} />
      <div className="absolute bottom-[15%] left-[8%] h-8 w-8 rotate-45 border-2 border-coral/10 bg-coral/5"
        style={{ animation: 'shapeFloat 8s ease-in-out -2s infinite alternate' }} />
    </div>
  );
}
