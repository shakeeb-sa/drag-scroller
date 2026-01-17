import React, { useEffect, useState, useRef } from 'react';

const Scroller = () => {
  // --- STATE ---
  const [isVisible, setIsVisible] = useState(false);
  const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
  const [speedText, setSpeedText] = useState("Speed: 1.5x");
  const [isActiveColor, setIsActiveColor] = useState(false);
  const [arrowChar, setArrowChar] = useState('↕'); // Dynamic Arrow State
  
  // Menu State (Replaces simple Alert)
  const [menuData, setMenuData] = useState(null); // { isEnabled: boolean, isBlocked: boolean }

  // --- REFS ---
  const isEnabled = useRef(true); 
  const isScrolling = useRef(false);
  const originY = useRef(0);
  const currentY = useRef(0);
  const scrollSpeed = useRef(0);
  const scrollTarget = useRef(window);
  const sensitivity = useRef(1.5);
  const animationFrameId = useRef(null);
  const lastActiveRef = useRef(false);
  
  // Ref for the Arrow Element (For high-performance scaling without re-renders)
  const arrowDomRef = useRef(null);

  // --- CONSTANTS ---
  const STORAGE_KEY_BLOCK = 'react-scroller-blocked';

  // --- HELPER FUNCTIONS ---

  function isInputOrText(target) {
    if (!target) return false;
    const tagName = target.tagName.toLowerCase();
    if (tagName === 'input' || tagName === 'textarea') return true;
    if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true;
    if (target.closest('[contenteditable="true"]')) return true;
    return false;
  }

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

  // --- MENU & BLACKLIST LOGIC ---

  function checkIsBlocked() {
    try {
      return localStorage.getItem(STORAGE_KEY_BLOCK) === 'true';
    } catch (e) {
      return false;
    }
  }

  function toggleBlacklist() {
    const currentlyBlocked = checkIsBlocked();
    const newState = !currentlyBlocked;
    
    if (newState) {
      localStorage.setItem(STORAGE_KEY_BLOCK, 'true');
      isEnabled.current = false; // Immediately disable
    } else {
      localStorage.removeItem(STORAGE_KEY_BLOCK);
      isEnabled.current = true; // Immediately enable
    }

    // Refresh the menu to show new status
    showMenu();
  }

  function showMenu() {
    const blocked = checkIsBlocked();
    setMenuData({
      isEnabled: isEnabled.current,
      isBlocked: blocked
    });
    
    // Auto-hide menu after 3 seconds
    setTimeout(() => setMenuData(null), 3000);
  }

  function updateLabel() {
    setSpeedText(`Speed: ${sensitivity.current.toFixed(1)}x`);
  }

  // --- CORE PHYSICS LOOP ---

  function scrollLoop() {
    if (!isScrolling.current) return;

    // 1. Calculate Physics
    const distance = currentY.current - originY.current;
    const deadZone = 20;
    let newIsActive = false;
    let directionChar = '↕';

    if (Math.abs(distance) < deadZone) {
      scrollSpeed.current = 0;
      newIsActive = false;
      directionChar = '•'; // Dot when still
      
      // Reset Scale
      if (arrowDomRef.current) arrowDomRef.current.style.transform = 'translate(-50%, -50%) scale(1)';

    } else {
      newIsActive = true;
      const effectiveDist = Math.abs(distance) - deadZone;
      const direction = Math.sign(distance);
      
      // Calculate Speed
      scrollSpeed.current = direction * Math.pow(effectiveDist, 1.2) * (0.05 * sensitivity.current);

      // Determine Arrow Character
      directionChar = direction > 0 ? '↓' : '↑';

      // Dynamic Scaling (Direct DOM manipulation for performance)
      if (arrowDomRef.current) {
        // Scale grows with speed, capped at 2.5x
        const scale = Math.min(2.5, 1 + (Math.abs(scrollSpeed.current) / 30));
        arrowDomRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }
    }

    // 2. React State Updates (Throttled)
    if (newIsActive !== lastActiveRef.current) {
      lastActiveRef.current = newIsActive;
      setIsActiveColor(newIsActive);
    }
    
    // Only update text state if char changed (prevents re-renders)
    setArrowChar((prev) => prev !== directionChar ? directionChar : prev);

    // 3. Apply Scroll
    if (scrollSpeed.current !== 0) {
      if (scrollTarget.current === window) {
        window.scrollBy(0, scrollSpeed.current);
      } else {
        scrollTarget.current.scrollTop += scrollSpeed.current;
      }
    }

    animationFrameId.current = requestAnimationFrame(scrollLoop);
  }

  function startScrolling(x, y) {
    isScrolling.current = true;
    originY.current = y;
    currentY.current = y;
    
    setAnchorPos({ x, y });
    setIsVisible(true);
    updateLabel();
    
    document.body.style.cursor = 'ns-resize'; // Or 'none' if you want to hide it
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
  
  // Initial Load Check
  useEffect(() => {
    if (checkIsBlocked()) {
      isEnabled.current = false;
    }
  }, []);

  useEffect(() => {
    function handleMouseDown(e) {
      if (!isEnabled.current) return;

      if (isScrolling.current) {
        stopScrolling();
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.button === 2) {
        if (isInputOrText(e.target)) return;
        scrollTarget.current = getScrollableTarget(e.target);
        startScrolling(e.clientX, e.clientY);
      }
    }

    function handleMouseMove(e) {
      if (isScrolling.current) {
        currentY.current = e.clientY;
      }
    }

    function handleContextMenu(e) {
      if (isEnabled.current) {
        if (isInputOrText(e.target)) return;
        e.preventDefault();
        return false;
      }
    }

    function handleKeyDown(e) {
      // --- MASTER TOGGLE / MENU (Ctrl + Shift + Q) ---
      if (e.ctrlKey && e.shiftKey && (e.code === 'KeyQ' || e.key.toLowerCase() === 'q')) {
        // If site is blocked, we only toggle the menu, not the enabled state directly
        // If site is NOT blocked, we toggle enabled state
        
        if (!checkIsBlocked()) {
            isEnabled.current = !isEnabled.current;
        }
        
        if (!isEnabled.current && isScrolling.current) {
            stopScrolling();
        }
        
        showMenu(); // Show the UI
        return;
      }

      // --- Speed Adjustments ---
      if (!isScrolling.current) return;
      
      if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') {
        sensitivity.current += 0.2;
        updateLabel();
      }
      if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') {
        sensitivity.current = Math.max(0.2, sensitivity.current - 0.2);
        updateLabel();
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
      {/* SETTINGS MENU POPUP */}
      {menuData && (
        <div style={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(28, 28, 28, 0.95)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            zIndex: 2147483647,
            fontFamily: 'Segoe UI, sans-serif',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: '300px',
            textAlign: 'center'
        }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Drag Scroller Settings</h3>
            
            {/* Status Indicator */}
            <div style={{ 
                padding: '10px', 
                background: menuData.isEnabled ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                border: menuData.isEnabled ? '1px solid #4CAF50' : '1px solid #F44336',
                borderRadius: '6px',
                marginBottom: '15px',
                fontWeight: 'bold'
            }}>
                Status: {menuData.isEnabled ? 'ACTIVE 🟢' : 'DISABLED 🔴'}
            </div>

            {/* Blacklist Button */}
            <button 
                onClick={toggleBlacklist}
                style={{
                    width: '100%',
                    padding: '10px',
                    background: menuData.isBlocked ? '#4CAF50' : '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = menuData.isBlocked ? '#45a049' : '#444'}
                onMouseOut={(e) => e.target.style.background = menuData.isBlocked ? '#4CAF50' : '#333'}
            >
                {menuData.isBlocked 
                    ? `Enable on ${window.location.hostname}` 
                    : `🚫 Disable on ${window.location.hostname}`}
            </button>
            
            <div style={{ marginTop: '10px', fontSize: '11px', opacity: 0.6 }}>
                Press Ctrl+Shift+Q to close or toggle
            </div>
        </div>
      )}

      {/* SCROLLER ANCHOR UI */}
      {isVisible && (
        <div
            ref={arrowDomRef}
            style={{
                position: 'fixed',
                top: anchorPos.y,
                left: anchorPos.x,
                width: '40px',
                height: '40px',
                transform: 'translate(-50%, -50%)', // Initial transform
                borderRadius: '50%',
                backgroundColor: isActiveColor ? 'rgba(255, 69, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                border: '2px solid white',
                zIndex: 2147483647,
                pointerEvents: 'none',
                boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                color: 'white',
                textAlign: 'center',
                lineHeight: '36px',
                fontSize: '24px',
                fontFamily: 'sans-serif',
                fontWeight: 'bold',
                transition: 'background-color 0.2s', // Only animate color via CSS
                willChange: 'transform' // GPU Hint
            }}
        >
          {arrowChar}
          
          {/* Speed Label (Absolute, so it doesn't scale with the arrow) */}
          <div style={{
            position: 'absolute',
            top: '-45px',
            left: '50%',
            transform: 'translateX(-50%)', // Undo the parent scale if needed, but since it's outside text flow it might be fine
            // Actually, if parent scales, this scales. 
            // To fix label scaling, we would need to inverse scale or move it out.
            // For now, let's keep it simple. If arrow gets huge, text gets huge. It looks cool.
            background: '#000',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            pointerEvents: 'none'
          }}>
            {speedText}
          </div>
        </div>
      )}
    </>
  );
};

export default Scroller;