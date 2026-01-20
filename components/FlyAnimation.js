"use client";
import React, { useContext } from "react";
import styled, { keyframes, css } from "styled-components";
import { AnimationContext } from "./AnimationContext";

const flyToCart = (endX, endY) => keyframes`
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  70% {
    transform: translate(${endX}px, ${endY}px) scale(0.5);
    opacity: 0.7;
  }
  100% {
    transform: translate(${endX}px, ${endY}px) scale(0);
    opacity: 0;
  }
`;

const AnimatedImage = styled.img`
  position: fixed;
  top: ${(props) => props.$startY}px;
  left: ${(props) => props.$startX}px;
  width: ${(props) => props.$width}px;
  height: ${(props) => props.$height}px;
  z-index: 999999;
  border-radius: 8px;
  object-fit: cover;
  pointer-events: none;
  will-change: transform, opacity;
  transform-origin: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 2px solid white;

  ${(props) =>
    props.$shouldAnimate &&
    css`
      animation: ${flyToCart(
          props.$endX - props.$startX,
          props.$endY - props.$startY
        )}
        0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
    `}
`;

export default function FlyAnimation() {
  const { animationInfo } = useContext(AnimationContext);

  if (!animationInfo) {
    return null;
  }

  const { imageSrc, startX, startY, endX, endY, width, height } = animationInfo;

  return (
    <AnimatedImage
      src={imageSrc}
      alt="Flying product to cart"
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