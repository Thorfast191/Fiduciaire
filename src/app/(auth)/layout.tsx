import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F5F7F5] px-4 py-10 sm:px-6">
      <div className="flex min-h-screen flex-col">
        {/* Brand */}
        <div className="pt-4 text-center sm:pt-8">
          <Link
            href="/"
            className="inline-block text-[27px] font-semibold tracking-[-0.04em] text-[#17231D]"
          >
            fiduvia
          </Link>

          <p className="mt-1.5 text-[13px] text-[#7A847E]">
            Fiduciaire & comptabilité en ligne
          </p>
        </div>

        {/* Auth content */}
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>

        {/* Footer */}
        <footer className="pb-4 text-center">
          <p className="text-[11px] leading-5 text-[#8A938D]">
            © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
            en ligne.
          </p>
        </footer>
      </div>
    </main>
  );
}
