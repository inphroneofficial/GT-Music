import { useRef, useCallback } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface SwipeOptions {
  onSwipe: (dir: Direction) => void;
  threshold?: number;
}

export function useSwipeGesture({ onSwipe, threshold = 50 }: SwipeOptions) {
  const startY = useRef(0);
  const startX = useRef(0);
  const moved = useRef(false);
  const startedOnInteractive = useRef(false);

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('button, a, input, textarea, select, [role="button"], [data-no-swipe="true"]'));
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startedOnInteractive.current = isInteractiveTarget(e.target);
    moved.current = false;
    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - startY.current;
    const dx = e.touches[0].clientX - startX.current;

    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      moved.current = true;
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startedOnInteractive.current && !moved.current) return;

    const dy = e.changedTouches[0].clientY - startY.current;
    const dx = e.changedTouches[0].clientX - startX.current;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absY > absX && absY > threshold) {
      onSwipe(dy < 0 ? 'up' : 'down');
    } else if (absX > absY && absX > threshold) {
      onSwipe(dx < 0 ? 'left' : 'right');
    }
  }, [onSwipe, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
