import { Button } from '@/components/ui/button';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout flex items-center justify-center px-6">
      {/* Texture */}
      <div className="absolute inset-0 zvc-scanlines pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 zvc-grain pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center py-24">
        <span className="zvc-kicker mb-6">Lost Reel</span>
        <h1 className="zvc-heading zvc-stamp text-[5rem] md:text-[9rem] leading-none mb-2">
          404
        </h1>
        <p className="font-display uppercase text-glow text-2xl md:text-3xl mb-4">
          Page Not Found
        </p>
        <p className="zvc-body text-glow/60 max-w-md mb-10">
          Sorry, the page you are looking for does not exist — it may have been
          cut from the final print.
        </p>
        <Button asChild className="text-lg">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </main>
  );
}
