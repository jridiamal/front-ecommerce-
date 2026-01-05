"use client";

import React, { useContext } from "react";
import styled, { keyframes, css } from "styled-components";
import { AnimationContext } from "./AnimationContext";

const flyToCart = (deltaX, deltaY) => keyframes`
  0% { transform: translate(0px,0px) scale(1); opacity: 1; }
  100% { transform: translate(${deltaX}px, ${deltaY}px) scale(0); opacity: 0; }
`;

const AnimatedImage = styled.img`
  position: fixed;
  top: ${props => props.$startY}px;
  left: ${props => props.$startX}px;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  z-index: 9999;
  border-radius: 10px;
  object-fit: contain; 
  pointer-events: none;

  ${props => props.$shouldAnimate && css`
    animation: ${flyToCart(
      props.$endX - props.$startX,
      props.$endY - props.$startY
    )} 0.7s cubic-bezier(0.5,-0.5,0.7,0.9) forwards;
  `}
`;

export default function FlyAnimation() {
  const { animationInfo } = useContext(AnimationContext);

  if (!animationInfo) return null;

  const { imageSrc, startX, startY, endX, endY, width, height } = animationInfo;

  return (
    <AnimatedImage
      src={imageSrc}
      alt="Flying product"
      $startX={startX}
      $startY={startY}
      $endX={endX}
      $endY={endY}
      $width={width}
      $height={height}
      $shouldAnimate={true}
    />
  );
}
