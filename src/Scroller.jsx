import React, { useEffect, useState, useRef } from 'react';

const Scroller = () => {
  // --- STATE ---
  const [isVisible, setIsVisible] = useState(false);
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
  const [speedText, setSpeedText] = useState("Speed: 1.5x");
  const [isActiveColor, setIsActiveColor] = useState(false);
  
  // Alert State { text: string, type: 'on' | 'off' }
  const [alertData, setAlertData] = useState(null);

  // --- REFS ---
  const isEnabled = useRef(true); // Master Switch (Default ON)
  const isScrolling = useRef(false);
  const originY = useRef(0);
  const currentY = useRef(0);
  const scrollSpeed = useRef(0);
  const scrollTarget = useRef(window);
  const sensitivity = useRef(1.5);
  const animationFrameId = useRef(null);

  // --- HELPER FUNCTIONS ---

  function getScrollableTarget(node) {
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
  }

  function showAlert(isOn) {
    setAlertData({
        text: isOn ? "SCROLLER ENABLED" : "SCROLLER DISABLED",
        type: isOn ? 'on' : 'off'
    });
    // Hide after 1.2 seconds
    setTimeout(() => setAlertData(null), 1200);
  }

  function updateLabel() {
    setSpeedText(`Speed: ${sensitivity.current.toFixed(1)}x`);
  }

  function calculateSpeed() {
    const distance = currentY.current - originY.current;
    const deadZone = 20;

    if (Math.abs(distance) < deadZone) {
      scrollSpeed.current = 0;
      setIsActiveColor(false);
    } else {
      setIsActiveColor(true);
      const effectiveDist = Math.abs(distance) - deadZone;
      const direction = Math.sign(distance);
      scrollSpeed.current = direction * Math.pow(effectiveDist, 1.2) * (0.05 * sensitivity.current);
    }
  }

  function scrollLoop() {
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
  }

  function startScrolling(x, y) {
    isScrolling.current = true;
    originY.current = y;
    currentY.current = y;
    
    setAnchorPos({ x, y });
    setIsVisible(true);
    updateLabel();
    
    document.body.style.cursor = 'ns-resize';
    scrollLoop();
  }

  function stopScrolling() {
    isScrolling.current = false;
    scrollSpeed.current = 0;
    setIsVisible(false);
    document.body.style.cursor = 'default';
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
  }

  // --- EFFECTS ---
  useEffect(() => {
    function handleMouseDown(e) {
      if (!isEnabled.current) return; // Feature OFF

      if (isScrolling.current) {
        stopScrolling();
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Immediate start on Right Click (Button 2)
      if (e.button === 2) {
        scrollTarget.current = getScrollableTarget(e.target);
        startScrolling(e.clientX, e.clientY);
      }
    }

    function handleMouseMove(e) {
      if (isScrolling.current) {
        currentY.current = e.clientY;
        calculateSpeed();
      }
    }

    function handleContextMenu(e) {
      if (isEnabled.current) {
        e.preventDefault();
        return false;
      }
    }

    function handleKeyDown(e) {
      // --- MASTER TOGGLE (Ctrl + Shift + Q) ---
      if (e.ctrlKey && e.shiftKey && (e.code === 'KeyQ' || e.key.toLowerCase() === 'q')) {
        isEnabled.current = !isEnabled.current;
        
        if (!isEnabled.current && isScrolling.current) {
            stopScrolling();
        }
        
        // Show the new Big Popup
        showAlert(isEnabled.current);
        return;
      }

      // --- Speed Adjustments ---
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
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <>
      {/* BIG CENTER POPUP ALERT */}
      {alertData && (
        <div style={{
            position: 'fixed',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(20, 20, 20, 0.9)',
            color: 'white',
            padding: '25px 50px',
            borderRadius: '12px',
            fontSize: '20px',
            fontWeight: 'bold',
            zIndex: 2147483647,
            pointerEvents: 'none',
            fontFamily: 'Segoe UI, sans-serif',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            backdropFilter: 'blur(5px)',
            border: alertData.type === 'on' ? '2px solid #4CAF50' : '2px solid #F44336'
        }}>
            <span style={{ fontSize: '30px' }}>
                {alertData.type === 'on' ? '🟢' : '🔴'}
            </span>
            {alertData.text}
        </div>
      )}

      {/* SCROLLER ANCHOR UI */}
      {isVisible && (
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
      )}
    </>
  );
};

export default Scroller;