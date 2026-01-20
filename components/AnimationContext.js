// components/AnimationContext.js
"use client"
import { createContext, useRef, useState } from "react";

export const AnimationContext = createContext({});

export function AnimationContextProvider({ children }) {
  const cartRefDesktop = useRef(null);
  const cartRefMobile = useRef(null);
  const [animationInfo, setAnimationInfo] = useState(null);

  const triggerAnimation = (imageSrc, startRect) => {
    // Check if either cart ref exists and is visible
    const isMobile = window.innerWidth < 768;
    const cartRef = isMobile ? cartRefMobile : cartRefDesktop;
    
    if (cartRef.current) {
      const cartRect = cartRef.current.getBoundingClientRect();
      
      // Calculate center position of cart icon
      const endX = cartRect.left + cartRect.width / 2;
      const endY = cartRect.top + cartRect.height / 2;
      
      // Calculate start position (center of clicked image)
      const startX = startRect.left + startRect.width / 2;
      const startY = startRect.top + startRect.height / 2;

      setAnimationInfo({
        imageSrc,
        startX,
        startY,
        endX,
        endY,
        width: Math.min(startRect.width, 80), // Cap max width for animation
        height: Math.min(startRect.height, 80), // Cap max height
      });

      // Clear animation after it completes
      setTimeout(() => {
        setAnimationInfo(null);
      }, 700);
    }
  };

  return (
    <AnimationContext.Provider
      value={{
        animationInfo,
        triggerAnimation,
        cartRefDesktop,
        cartRefMobile,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}