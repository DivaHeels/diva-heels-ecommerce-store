'use client'

export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="bg"><body className="bg-white p-8 font-sans text-[#111]"><main className="mx-auto max-w-xl py-24"><h1 className="font-serif text-4xl">Възникна техническа грешка</h1><p className="mt-4 text-sm text-[#666]">Моля, опитайте отново.</p><button onClick={() => reset()} className="mt-8 bg-[#111] px-6 py-3 text-xs uppercase tracking-widest text-white">Опитай отново</button></main></body></html>
}
