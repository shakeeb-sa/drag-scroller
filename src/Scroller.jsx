import React, { useEffect, useState, useRef } from 'react';

const Scroller = () => {
  // --- STATE (UI Visibility) ---
  const [isVisible, setIsVisible] = useState(false);
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
  const [speedText, setSpeedText] = useState("Speed: 1.5x");
  const [isActiveColor, setIsActiveColor] = useState(false);

  // --- REFS (Logic Variables - No Re-renders) ---
  const isScrolling = useRef(false);
  const originY = useRef(0);a
  const currentY = useRef(0);
  const scrollSpeed = useRef(0);
  const scrollTarget = useRef(window);
  const sensitivity = useRef(1.5);
  const animationFrameId = useRef(null);
  
  // Timing & Menu Blocking Refs
  const longPressTimer = useRef(null);
  const startCoords = useRef({ x: 0, y: 0 });
  const preventNextMenu = useRef(false);
  const HOLD_DURATION = 200; // 0.2s hold

  // --- HELPER: Find Scrollable Target ---
  const getScrollableTarget = (node) => {
    if (!node) return window;
    let curr = node;
    while (curr && curr !== document.body && curr !== document) {
      const style = window.getComputedStyle(curr);
      const overflowY = style.overflowY;
      if ((overflowY === 'auto' || overflowY === 'scroll') && curr.scrollHeight > curr.clientHeight) {
        return curr;
      }
      curr = curr.parentNode;
    }
    return window;
  };

  // --- SCROLL LOOP ---
  const scrollLoop = () => {
    if (isScrolling.current) {
      if (scrollSpeed.current !== 0) {
        if (scrollTarget.current === window) {
          window.scrollBy(0, scrollSpeed.current);
        } else {
          scrollTarget.current.scrollTop += scrollSpeed.current;
        }
      }
      animationFrameId.current = requestAnimationFrame(scrollLoop);
    }
  };

  const calculateSpeed = () => {
    const distance = currentY.current - originY.current;
    const deadZone = 20;

    if (Math.abs(distance) < deadZone) {
      scrollSpeed.current = 0;
      setIsActiveColor(false);
    } else {
      setIsActiveColor(true);
      const effectiveDist = Math.abs(distance) - deadZone;
      const direction = Math.sign(distance);
      // Exponential Math
      scrollSpeed.current = direction * Math.pow(effectiveDist, 1.2) * (0.05 * sensitivity.current);
    }
  };

  const startScrolling = (x, y) => {
    isScrolling.current = true;
    originY.current = y;
    currentY.current = y;
    
    setAnchorPos({ x, y });
    setIsVisible(true);
    updateLabel();
    
    document.body.style.cursor = 'ns-resize';
    scrollLoop();
  };

  const stopScrolling = () => {
    isScrolling.current = false;
    scrollSpeed.current = 0;
    setIsVisible(false);
    document.body.style.cursor = 'default';
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const updateLabel = () => {
    setSpeedText(`Speed: ${sensitivity.current.toFixed(1)}x`);
  };

  // --- EFFECT: Global Event Listeners ---
  useEffect(() => {
    const handleMouseDown = (e) => {
      // STOP Logic
      if (isScrolling.current) {
        stopScrolling();
        if (e.button === 2) preventNextMenu.current = true;
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // START Logic (Right Click)
      if (e.button === 2) {
        startCoords.current = { x: e.clientX, y: e.clientY };
        
        longPressTimer.current = setTimeout(() => {
          scrollTarget.current = getScrollableTarget(e.target);
          startScrolling(e.clientX, e.clientY);
          preventNextMenu.current = true;
        }, HOLD_DURATION);
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 2) clearTimeout(longPressTimer.current);
    };

    const handleMouseMove = (e) => {
      // Cancel timer if dragged while waiting
      if (!isScrolling.current && longPressTimer.current) {
        if (Math.abs(e.clientX - startCoords.current.x) > 5 || 
            Math.abs(e.clientY - startCoords.current.y) > 5) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }

      if (isScrolling.current) {
        currentY.current = e.clientY;
        calculateSpeed();
      }
    };

    const handleContextMenu = (e) => {
      if (isScrolling.current || preventNextMenu.current) {
        e.preventDefault();
        preventNextMenu.current = false;
        return false;
      }
    };

    const handleKeyDown = (e) => {
      if (!isScrolling.current) return;
      
      if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
        sensitivity.current += 0.2;
        updateLabel();
        calculateSpeed();
      }
      if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
        sensitivity.current = Math.max(0.2, sensitivity.current - 0.2);
        updateLabel();
        calculateSpeed();
      }
    };

    // Bind Listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: anchorPos.y,
        left: anchorPos.x,
        transform: 'translate(-50%, -50%)',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: isActiveColor ? 'rgba(255, 69, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
        border: '2px solid white',
        zIndex: 2147483647,
        pointerEvents: 'none',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        color: 'white',
        textAlign: 'center',
        lineHeight: '36px',
        fontSize: '20px',
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        transition: 'background-color 0.2s'
      }}
    >
      ↕
      <div style={{
        position: 'absolute',
        top: '-40px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#000',
        color: '#fff',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
      }}>
        {speedText}
        <br />
        <span style={{ fontSize: '10px', opacity: 0.8 }}>(W/S to adjust)</span>
      </div>
    </div>
  );
};

export default Scroller;