import { useEffect, useRef, useCallback } from 'react';

/**
 * Adds elastic rubber-band overscroll to a scrollable container.
 * When the user scrolls past the top or bottom boundary, the content
 * stretches with dampened resistance and springs back on release.
 */
export function useElasticOverscroll(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  { enabled = true, damping = 0.3, maxOverscroll = 80 } = {}
) {
  const touchStartY = useRef(0);
  const currentOverscroll = useRef(0);
  const isOverscrolling = useRef(false);
  const rafId = useRef(0);

  const applyTransform = useCallback((offset: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.style.transform = offset !== 0 ? `translateY(${offset}px)` : '';
    el.style.transition = offset !== 0 ? 'none' : '';
  }, [scrollRef]);

  const springBack = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.style.transition = 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)';
    el.style.transform = 'translateY(0)';
    currentOverscroll.current = 0;
    isOverscrolling.current = false;
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      currentOverscroll.current = 0;
      isOverscrolling.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - touchStartY.current;
      const { scrollTop, scrollHeight, clientHeight } = el;

      const atTop = scrollTop <= 0 && deltaY > 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && deltaY < 0;

      if (atTop || atBottom) {
        // Only start overscrolling if we're truly at the boundary
        if (!isOverscrolling.current) {
          isOverscrolling.current = true;
          touchStartY.current = touchY; // reset start for clean measurement
          return;
        }

        const rawDelta = touchY - touchStartY.current;
        // Dampened offset with diminishing return
        const sign = rawDelta > 0 ? 1 : -1;
        const absDelta = Math.abs(rawDelta);
        const dampened = sign * Math.min(absDelta * damping, maxOverscroll);

        currentOverscroll.current = dampened;
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => applyTransform(dampened));
      } else if (isOverscrolling.current) {
        // User scrolled back within bounds — cancel overscroll
        cancelAnimationFrame(rafId.current);
        springBack();
      }
    };

    const handleTouchEnd = () => {
      if (isOverscrolling.current || currentOverscroll.current !== 0) {
        cancelAnimationFrame(rafId.current);
        springBack();
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
      cancelAnimationFrame(rafId.current);
    };
  }, [scrollRef, enabled, damping, maxOverscroll, applyTransform, springBack]);
}
