"use client";

import React, { createContext, useRef, useState, useCallback, useMemo } from "react";

export const AnimationContext = createContext({});

export function AnimationContextProvider({ children }) {
  const cartRef = useRef(null);
  const [animationInfo, setAnimationInfo] = useState(null);

  const triggerFlyAnimation = useCallback((imageElement, startRect) => {
    if (!cartRef.current) return;

    const cartRect = cartRef.current.getBoundingClientRect();

    setAnimationInfo({
      imageSrc: imageElement.src,
      startX: startRect.left,
      startY: startRect.top,
      endX: cartRect.left + cartRect.width/2 - startRect.width/2, // center image on cart
      endY: cartRect.top + cartRect.height/2 - startRect.height/2,
      width: startRect.width,
      height: startRect.height,
    });

    setTimeout(() => setAnimationInfo(null), 700); // duration animation
  }, []);

  const contextValue = useMemo(() => ({
    cartRef,
    triggerFlyAnimation,
    animationInfo,
  }), [animationInfo, triggerFlyAnimation]);

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
}
