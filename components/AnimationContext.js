"use client";
import { createContext, useRef, useState } from "react";

export const AnimationContext = createContext({});

export function AnimationContextProvider({ children }) {
  const cartRef = useRef(null);
  const [animationInfo, setAnimationInfo] = useState(null);

  const triggerFlyAnimation = (imageElement, imageRect) => {
    if (!cartRef.current) {
      console.warn("Cart ref not available");
      return;
    }

    // Get cart position relative to viewport
    const cartRect = cartRef.current.getBoundingClientRect();
    
    // Calculate positions - center of image to center of cart
    const startX = imageRect.left + imageRect.width / 2;
    const startY = imageRect.top + imageRect.height / 2;
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    // Adjust for scroll position to get absolute coordinates
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    setAnimationInfo({
      imageSrc: imageElement.src,
      startX: startX + scrollX,
      startY: startY + scrollY,
      endX: endX + scrollX,
      endY: endY + scrollY,
      width: Math.min(imageRect.width, 100),
      height: Math.min(imageRect.height, 100),
    });

    // Clear animation after it completes
    setTimeout(() => {
      setAnimationInfo(null);
    }, 700);
  };

  return (
    <AnimationContext.Provider
      value={{
        cartRef,
        animationInfo,
        triggerFlyAnimation,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}