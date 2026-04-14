import { useRef, useCallback } from 'react';

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ left: 0, top: 0, x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const ele = ref.current;
    if (!ele) return;
    
    // Only drag with left mouse button
    if (e.button !== 0) return;

    isDragging.current = false;
    startPos.current = {
      left: ele.scrollLeft,
      top: ele.scrollTop,
      x: e.clientX,
      y: e.clientY,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startPos.current.x;
      const dy = moveEvent.clientY - startPos.current.y;
      
      // Minimum movement threshold to distinguish from a click
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        isDragging.current = true;
        ele.scrollTop = startPos.current.top - dy;
        ele.scrollLeft = startPos.current.left - dx;
        
        document.body.style.cursor = 'grabbing';
        ele.style.userSelect = 'none';
        ele.style.scrollBehavior = 'auto'; // Disable smooth scroll during drag for responsiveness
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      
      if (ele) {
        ele.style.removeProperty('user-select');
        ele.style.scrollBehavior = 'smooth';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  return { ref, onMouseDown, isDragging };
}
