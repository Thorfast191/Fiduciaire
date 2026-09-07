"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Messages } from "@/lib/i18n/messages/fr";
import { LoginForm } from "./LoginForm";

const LoginModalContext = createContext<{ open: () => void } | null>(null);

/** Opens the login modal. Returns null outside the provider (e.g. on `/login`). */
export function useLoginModal() {
  return useContext(LoginModalContext);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Wraps the marketing site so any "Se connecter" trigger can raise the login
 * modal in place, the way the client's mockup does (`Fiduvia.dc.html:3901`),
 * instead of navigating away from the page.
 */
export function LoginModalProvider({
  t,
  children,
}: {
  t: Messages;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  /** The element that opened the modal, so focus can go back to it on close. */
  const openerRef = useRef<HTMLElement | null>(null);
  /** Whether the current press started on the backdrop rather than in the card. */
  const pressedBackdropRef = useRef(false);

  const open = useCallback(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    openerRef.current?.focus();
  }, []);

  // Move focus into the dialog once it exists.
  useEffect(() => {
    if (isOpen) emailRef.current?.focus();
  }, [isOpen]);

  // Escape closes; Tab stays inside the dialog.
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }

      if (e.key !== "Tab" || !cardRef.current) return;

      const items = Array.from(
        cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  // Hold the page still behind the overlay.
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  return (
    <LoginModalContext.Provider value={{ open }}>
      {children}

      {isOpen ? (
        /* `items-start` plus `my-auto` on the card centres it when it fits and
           lets it scroll from the top when it does not; `items-center` clips the
           card's head off on a short viewport. */
        <div
          onMouseDown={(e) => {
            pressedBackdropRef.current = e.target === e.currentTarget;
          }}
          onClick={(e) => {
            // Dismiss only on a press that both started and ended on the
            // backdrop — otherwise drag-selecting text in a field and releasing
            // outside the card would close it and discard what was typed.
            if (e.target === e.currentTarget && pressedBackdropRef.current) {
              close();
            }
          }}
          className="fixed inset-0 z-[90] flex animate-[fadeBg_.18s_ease] items-start justify-center overflow-y-auto bg-[rgba(13,21,38,.55)] p-6 backdrop-blur-[3px]"
        >
          <div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-title"
            className="my-auto w-full max-w-[420px] animate-[popIn_.22s_ease] rounded-[var(--radius-xl)] bg-[var(--surface-card)] px-8 py-[34px] shadow-[0_40px_90px_-30px_rgba(11,32,48,.6)]"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-[var(--teal-100)] text-[var(--brand)]">
                <LockIcon />
              </span>

              <button
                type="button"
                onClick={close}
                aria-label={t.common.close}
                className="fx-modal-close"
              >
                ×
              </button>
            </div>

            <LoginForm
              t={t}
              onFieldRef={(el) => {
                emailRef.current = el;
              }}
            />
          </div>
        </div>
      ) : null}
    </LoginModalContext.Provider>
  );
}

function LockIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
