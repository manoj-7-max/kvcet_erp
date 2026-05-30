'use client';

export default function MeshGradient() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-neutral-950">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-900/20 blur-[120px]" />
    </div>
  );
}
