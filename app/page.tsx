import Link from "next/link";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-black text-white">
      <h1 className="text-4xl font-black tracking-tight">Drag Race Telemetry</h1>
      <div className="flex gap-4">
        <Link href="/admin" className="rounded-lg bg-red-600 px-6 py-3 font-semibold hover:bg-red-500">
          Admin panel
        </Link>
        <Link
          href="/display"
          className="rounded-lg border border-white/20 px-6 py-3 font-semibold hover:bg-white/10"
        >
          Public display
        </Link>
      </div>
    </div>
  );
}
