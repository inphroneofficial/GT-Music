import { useRef, useCallback } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface SwipeOptions {
  onSwipe: (dir: Direction) => void;
  threshold?: number;
}

export function useSwipeGesture({ onSwipe, threshold = 50 }: SwipeOptions) {
  const startY = useRef(0);
  const startX = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
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

  return { onTouchStart, onTouchEnd };
}
