import { useCallback, useRef } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';

type DragState = {
  active: boolean;
  moved: boolean;
  input: 'none' | 'pointer' | 'touch';
  startX: number;
  startY: number;
  startScrollLeft: number;
};

const initialState: DragState = {
  active: false,
  moved: false,
  input: 'none',
  startX: 0,
  startY: 0,
  startScrollLeft: 0,
};

export function useHorizontalDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const stateRef = useRef<DragState>({ ...initialState });

  const startDrag = useCallback((clientX: number, clientY: number, input: DragState['input']) => {
    const rail = ref.current;
    if (!rail) return;

    stateRef.current = {
      active: true,
      moved: false,
      input,
      startX: clientX,
      startY: clientY,
      startScrollLeft: rail.scrollLeft,
    };
  }, []);

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    const rail = ref.current;
    const state = stateRef.current;
    if (!rail || !state.active) return false;

    const deltaX = clientX - state.startX;
    const deltaY = clientY - state.startY;
    const horizontalIntent = Math.abs(deltaX) > 6 && Math.abs(deltaX) > Math.abs(deltaY) * 0.7;

    if (!horizontalIntent && !state.moved) return false;

    state.moved = true;
    rail.scrollLeft = state.startScrollLeft - deltaX;
    return true;
  }, []);

  const endDrag = useCallback(() => {
    const didMove = stateRef.current.moved;
    stateRef.current.active = false;
    stateRef.current.input = 'none';

    if (didMove) {
      window.setTimeout(() => {
        stateRef.current.moved = false;
      }, 140);
    }
  }, []);

  const scrollByPage = useCallback((direction: 'previous' | 'next') => {
    const rail = ref.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction === 'next' ? rail.clientWidth * 0.82 : -rail.clientWidth * 0.82,
      behavior: 'smooth',
    });
  }, []);

  const scrollToSelector = useCallback((selector: string) => {
    const rail = ref.current;
    const target = rail?.querySelector<HTMLElement>(selector);
    if (!rail || !target) return;

    const targetLeft = target.offsetLeft - (rail.clientWidth - target.clientWidth) / 2;
    rail.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
  }, []);

  const dragHandlers = {
    onClickCapture: (event: ReactMouseEvent<T>) => {
      if (!stateRef.current.moved) return;
      event.preventDefault();
      event.stopPropagation();
      stateRef.current.moved = false;
    },
    onPointerDown: (event: ReactPointerEvent<T>) => {
      if (!event.isPrimary || event.pointerType === 'mouse') return;
      if (stateRef.current.input === 'touch') return;
      startDrag(event.clientX, event.clientY, 'pointer');
      ref.current?.setPointerCapture?.(event.pointerId);
    },
    onPointerMove: (event: ReactPointerEvent<T>) => {
      if (!event.isPrimary) return;
      if (stateRef.current.input !== 'pointer') return;
      if (moveDrag(event.clientX, event.clientY)) event.preventDefault();
    },
    onPointerUp: (event: ReactPointerEvent<T>) => {
      ref.current?.releasePointerCapture?.(event.pointerId);
      if (stateRef.current.input !== 'pointer') return;
      endDrag();
    },
    onPointerCancel: () => {
      if (stateRef.current.input !== 'pointer') return;
      endDrag();
    },
    onTouchStart: (event: ReactTouchEvent<T>) => {
      const touch = event.touches[0];
      if (!touch) return;
      startDrag(touch.clientX, touch.clientY, 'touch');
    },
    onTouchMove: (event: ReactTouchEvent<T>) => {
      if (stateRef.current.input !== 'touch') return;
      const touch = event.touches[0];
      if (!touch) return;
      if (moveDrag(touch.clientX, touch.clientY)) event.preventDefault();
    },
    onTouchEnd: endDrag,
    onTouchCancel: endDrag,
  };

  return {
    ref,
    dragHandlers,
    scrollByPage,
    scrollToSelector,
  };
}
