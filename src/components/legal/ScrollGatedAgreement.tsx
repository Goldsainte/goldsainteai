/* ScrollGatedAgreement — Apple-style "scroll to the bottom before you can
 * accept" container, plus the evidence needed to make that acceptance mean
 * something later: when the reader opened it, when they reached the bottom,
 * and a SHA-256 hash of the exact text they were shown.
 *
 * Used by creator onboarding (Creator Partnership Agreement) and the agent
 * terms modal. The gate is UX + evidence, not security — enforcement lives
 * in RLS (file 247).
 *
 * Edge cases handled:
 *  - content shorter than the box (large screens): unlocks immediately, and a
 *    ResizeObserver re-checks on any resize, so the gate can never dead-end.
 *  - keyboard / assistive scrolling: we listen to the scroll event itself,
 *    which fires for wheel, keys, touch, and screen-reader scrolling alike.
 *  - 2px sub-pixel rounding: bottom is "within 24px", not exact.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AgreementEvidence {
  openedAt: string;              // ISO — when the gated box mounted
  scrolledToBottomAt: string;    // ISO — first time the reader hit the bottom
  contentHash: string;           // SHA-256 hex of the container's visible text
}

interface ScrollGatedAgreementProps {
  children: React.ReactNode;
  /** Fires once, when the reader first reaches the bottom. */
  onCompleted: (evidence: AgreementEvidence) => void;
  /** Box height; default keeps the doc clearly "a thing to scroll". */
  heightClassName?: string;
  className?: string;
}

const BOTTOM_TOLERANCE_PX = 24;

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function ScrollGatedAgreement({
  children,
  onCompleted,
  heightClassName = 'h-[420px]',
  className = '',
}: ScrollGatedAgreementProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef<string>(new Date().toISOString());
  const firedRef = useRef(false);
  const [reachedBottom, setReachedBottom] = useState(false);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  const complete = useCallback(async () => {
    if (firedRef.current) return;
    firedRef.current = true;
    setReachedBottom(true);
    const el = containerRef.current;
    let contentHash = '';
    try {
      contentHash = await sha256Hex(el?.textContent ?? '');
    } catch {
      // crypto.subtle unavailable (non-HTTPS dev) — record without a hash
      // rather than block acceptance.
    }
    onCompletedRef.current({
      openedAt: openedAtRef.current,
      scrolledToBottomAt: new Date().toISOString(),
      contentHash,
    });
  }, []);

  const checkPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el || firedRef.current) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_TOLERANCE_PX;
    if (atBottom) void complete();
  }, [complete]);

  useEffect(() => {
    // Initial check covers the shorter-than-the-box case; the observer
    // re-checks when the box or its content changes size.
    checkPosition();
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => checkPosition());
    ro.observe(el);
    return () => ro.disconnect();
  }, [checkPosition]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        onScroll={checkPosition}
        tabIndex={0}
        role="document"
        aria-label="Agreement text — scroll to the end to enable acceptance"
        className={`${heightClassName} overflow-y-auto rounded-xl border border-[#E5DFC6] bg-white p-5 focus:outline-none focus:ring-2 focus:ring-[#0c4d47]/30`}
      >
        {children}
      </div>
      <div
        className={`mt-2 flex items-center gap-1.5 text-[12.5px] transition-opacity ${
          reachedBottom ? 'text-[#0c4d47]' : 'text-[#6B7280]'
        }`}
        aria-live="polite"
      >
        {reachedBottom ? (
          <>Read to the end — you can accept below.</>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
            Scroll to the end of the agreement to enable acceptance.
          </>
        )}
      </div>
    </div>
  );
}
