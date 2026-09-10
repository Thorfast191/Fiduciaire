"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useLoginModal } from "./LoginModal";

/**
 * A "Se connecter" control. It is a real link to `/login`, so middle-click,
 * cmd-click and a JavaScript-less browser all still work; a plain left click
 * is intercepted and opens the modal over the page instead.
 */
export function LoginTrigger({
  className,
  style,
  children,
}: {
  className?: string;
  // Link colour must be set inline: the unlayered `a { color: inherit }` reset
  // in globals.css outranks any Tailwind text-colour utility on an <a>.
  style?: CSSProperties;
  children: ReactNode;
}) {
  const modal = useLoginModal();

  return (
    <Link
      href="/login"
      className={className}
      style={style}
      onClick={(e) => {
        // Let the browser handle anything but an unmodified primary click.
        if (
          !modal ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }

        e.preventDefault();
        modal.open();
      }}
    >
      {children}
    </Link>
  );
}
