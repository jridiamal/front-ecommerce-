// AnimationContext.js
"use client";
import React, { createContext, useRef, useState, useCallback, useMemo } from 'react';

// ADD DEFAULT VALUES HERE
export const AnimationContext = createContext({
    cartRef: { current: null },
    triggerFlyAnimation: () => {},
    animationInfo: null
});

export function AnimationContextProvider({ children }) {
    const cartRef = useRef(null);
    const [animationInfo, setAnimationInfo] = useState(null);

    const triggerFlyAnimation = useCallback((imageElement, startRect) => {
        // Safety check for SSR/Build
        if (!cartRef.current || !imageElement) return;
        
        const cartRect = cartRef.current.getBoundingClientRect();
        
        setAnimationInfo({
            imageSrc: imageElement.src,
            startX: startRect.left,
            startY: startRect.top,
            endX: cartRect.left,
            endY: cartRect.top,
            width: startRect.width,
            height: startRect.height,
        });
        
        setTimeout(() => setAnimationInfo(null), 700); 
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