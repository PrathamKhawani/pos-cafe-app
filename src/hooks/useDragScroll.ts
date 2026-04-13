import { useRef, useCallback, useEffect } from 'react';

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const ele = ref.current;
    if (!ele) return;
    
    // Only drag with left mouse button
    if (e.button !== 0) return;

    const startPos = {
      left: ele.scrollLeft,
      top: ele.scrollTop,
      x: e.clientX,
      y: e.clientY,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startPos.x;
      const dy = moveEvent.clientY - startPos.y;
      ele.scrollTop = startPos.top - dy;
      ele.scrollLeft = startPos.left - dx;
      
      // Add cursor class to body during drag
      document.body.style.cursor = 'grabbing';
      ele.style.userSelect = 'none';
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      ele.style.removeProperty('user-select');
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  return { ref, onMouseDown };
}
