"use client";

import { useState, useCallback, useRef, useEffect } from 'react';

interface TouchPosition {
  x: number;
  y: number;
}

interface TouchGestureState {
  isTouching: boolean;
  startPosition: TouchPosition | null;
  currentPosition: TouchPosition | null;
  delta: TouchPosition;
  velocity: TouchPosition;
  pinchDistance: number | null;
  rotation: number;
}

interface TouchGestureOptions {
  onTap?: (position: TouchPosition) => void;
  onDoubleTap?: (position: TouchPosition) => void;
  onLongPress?: (position: TouchPosition) => void;
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', velocity: number) => void;
  onPan?: (delta: TouchPosition, velocity: TouchPosition) => void;
  onPinch?: (scale: number, center: TouchPosition) => void;
  onRotate?: (angle: number, center: TouchPosition) => void;
  longPressDelay?: number;
  swipeThreshold?: number;
  pinchThreshold?: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipe,
    onPan,
    onPinch,
    onRotate,
    longPressDelay = 500,
    swipeThreshold = 50,
    pinchThreshold = 10
  } = options;

  const [gestureState, setGestureState] = useState<TouchGestureState>({
    isTouching: false,
    startPosition: null,
    currentPosition: null,
    delta: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    pinchDistance: null,
    rotation: 0
  });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const previousPositionRef = useRef<TouchPosition | null>(null);
  const previousTimeRef = useRef<number>(0);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialRotationRef = useRef<number>(0);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const getTouchPosition = (touch: React.Touch | Touch): TouchPosition => ({
    x: touch.clientX,
    y: touch.clientY
  });

  const getDistance = (touch1: React.Touch | Touch, touch2: React.Touch | Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touch1: React.Touch | Touch, touch2: React.Touch | Touch): number => {
    return Math.atan2(
      touch2.clientY - touch1.clientY,
      touch2.clientX - touch1.clientX
    ) * (180 / Math.PI);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const now = Date.now();
    
    setGestureState(prev => ({
      ...prev,
      isTouching: true,
      startPosition: getTouchPosition(touches[0]),
      currentPosition: getTouchPosition(touches[0]),
      delta: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 }
    }));

    previousPositionRef.current = getTouchPosition(touches[0]);
    previousTimeRef.current = now;

    // Handle double tap detection
    const timeSinceLastTap = now - lastTapRef.current;
    if (timeSinceLastTap < 300 && touches.length === 1) {
      onDoubleTap?.(getTouchPosition(touches[0]));
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Start long press timer
    if (touches.length === 1) {
      clearLongPressTimer();
      longPressTimerRef.current = setTimeout(() => {
        onLongPress?.(getTouchPosition(touches[0]));
      }, longPressDelay);
    }

    // Handle pinch start
    if (touches.length === 2) {
      clearLongPressTimer();
      initialPinchDistanceRef.current = getDistance(touches[0], touches[1]);
      initialRotationRef.current = getAngle(touches[0], touches[1]);
    }
  }, [onDoubleTap, onLongPress, longPressDelay, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const now = Date.now();

    if (touches.length === 1 && previousPositionRef.current) {
      const currentPosition = getTouchPosition(touches[0]);
      const delta = {
        x: currentPosition.x - gestureState.startPosition!.x,
        y: currentPosition.y - gestureState.startPosition!.y
      };

      // Calculate velocity
      const dt = now - previousTimeRef.current;
      const velocity = dt > 0 ? {
        x: (currentPosition.x - previousPositionRef.current.x) / dt * 16, // pixels per frame at 60fps
        y: (currentPosition.y - previousPositionRef.current.y) / dt * 16
      } : { x: 0, y: 0 };

      setGestureState(prev => ({
        ...prev,
        currentPosition,
        delta,
        velocity
      }));

      onPan?.(delta, velocity);

      // Cancel long press if moved significantly
      if (Math.abs(delta.x) > 10 || Math.abs(delta.y) > 10) {
        clearLongPressTimer();
      }

      previousPositionRef.current = currentPosition;
      previousTimeRef.current = now;
    }

    // Handle pinch move
    if (touches.length === 2 && initialPinchDistanceRef.current) {
      const currentDistance = getDistance(touches[0], touches[1]);
      const scale = currentDistance / initialPinchDistanceRef.current;
      const center = {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      };

      if (Math.abs(currentDistance - initialPinchDistanceRef.current) > pinchThreshold) {
        onPinch?.(scale, center);
      }

      // Handle rotation
      const currentRotation = getAngle(touches[0], touches[1]);
      const rotationDelta = currentRotation - initialRotationRef.current;
      onRotate?.(rotationDelta, center);
    }
  }, [gestureState.startPosition, onPan, onPinch, onRotate, pinchThreshold, clearLongPressTimer]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const touches = e.touches;
    const changedTouches = e.changedTouches;

    clearLongPressTimer();

    // Handle tap detection
    if (changedTouches.length === 1 && gestureState.startPosition) {
      const endPosition = getTouchPosition(changedTouches[0]);
      const distance = Math.sqrt(
        Math.pow(endPosition.x - gestureState.startPosition.x, 2) +
        Math.pow(endPosition.y - gestureState.startPosition.y, 2)
      );

      // It's a tap if moved less than 10px
      if (distance < 10 && now - lastTapRef.current < 300) {
        onTap?.(endPosition);
      }
    }

    // Handle swipe detection
    if (gestureState.startPosition && gestureState.currentPosition) {
      const dx = gestureState.currentPosition.x - gestureState.startPosition.x;
      const dy = gestureState.currentPosition.y - gestureState.startPosition.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > swipeThreshold) {
        const velocity = Math.sqrt(
          gestureState.velocity.x ** 2 + gestureState.velocity.y ** 2
        );

        if (absDx > absDy) {
          onSwipe?.(dx > 0 ? 'right' : 'left', velocity);
        } else {
          onSwipe?.(dy > 0 ? 'down' : 'up', velocity);
        }
      }
    }

    // Reset state if no touches remaining
    if (touches.length === 0) {
      setGestureState({
        isTouching: false,
        startPosition: null,
        currentPosition: null,
        delta: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        pinchDistance: null,
        rotation: 0
      });
      initialPinchDistanceRef.current = null;
      previousPositionRef.current = null;
    } else if (touches.length === 1) {
      // Reset for remaining single touch
      initialPinchDistanceRef.current = null;
      setGestureState(prev => ({
        ...prev,
        startPosition: getTouchPosition(touches[0]),
        currentPosition: getTouchPosition(touches[0]),
        delta: { x: 0, y: 0 }
      }));
    }
  }, [gestureState, onTap, onSwipe, swipeThreshold, clearLongPressTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearLongPressTimer();
  }, [clearLongPressTimer]);

  const bind = useCallback(() => ({
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchEnd
  }), [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    gestureState,
    bind
  };
};

// Hook specifically for map touch interactions
export const useMapTouchGestures = (mapRef: React.RefObject<HTMLDivElement>) => {
  const [isPinching, setIsPinching] = useState(false);

  const handlePinch = useCallback((scale: number) => {
    setIsPinching(true);
    // Scale will be handled by Mapbox's native pinch zoom
  }, []);

  const handlePan = useCallback((delta: TouchPosition) => {
    if (isPinching) return;
    // Pan will be handled by Mapbox's native drag
  }, [isPinching]);

  const { bind } = useTouchGestures({
    onPinch: handlePinch,
    onPan: handlePan
  });

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;

    const bindHandlers = bind();
    
    element.addEventListener('touchstart', bindHandlers.onTouchStart as any, { passive: true });
    element.addEventListener('touchmove', bindHandlers.onTouchMove as any, { passive: true });
    element.addEventListener('touchend', bindHandlers.onTouchEnd as any, { passive: true });
    element.addEventListener('touchcancel', bindHandlers.onTouchEnd as any, { passive: true });

    return () => {
      element.removeEventListener('touchstart', bindHandlers.onTouchStart as any);
      element.removeEventListener('touchmove', bindHandlers.onTouchMove as any);
      element.removeEventListener('touchend', bindHandlers.onTouchEnd as any);
      element.removeEventListener('touchcancel', bindHandlers.onTouchEnd as any);
    };
  }, [mapRef, bind]);

  return { isPinching };
};
