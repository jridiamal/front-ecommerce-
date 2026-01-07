'use client';

import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useContext, useRef, useState, useEffect } from "react";
import { CartContext } from "@/components/CartContext";
import { AnimationContext } from "./AnimationContext";
import { motion, AnimatePresence } from "framer-motion";

/* ========== ANIMATION ========== */
const shine = keyframes`
  0% { left: -75%; }
  100% { left: 125%; }
`;

/* ========== STYLES ========== */
const StockRibbon = styled.div`
  position: absolute;
  top: 14px;
  right: -26px;
  width: 180px;
  text-align: center;
  padding: 6px 0;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #fff;
  z-index: 30;
  pointer-events: none;
  transform: rotate(45deg);
  border-radius: 4px;
  background: linear-gradient(145deg, #ff3b3b, #c70039);
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  overflow: hidden;
`;

const ShineEffect = styled.span`
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    120deg,
    rgba(255,255,255,0.4),
    rgba(255,255,255,0),
    rgba(255,255,255,0.4)
  );
  transform: skewX(-25deg);
  animation: ${shine} 2s infinite;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  position: relative;
  ${({ disabled }) => disabled && `opacity: 0.7;`}
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  }
`;

const ImageBox = styled.div`
  position: relative;
  height: 220px;
  overflow: hidden;
  background: #f9f9f9;
  cursor: pointer;
`;

const AnimatedProductImg = styled(motion.img)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const Content = styled.div`
  padding: 20px 15px;
  text-align: center;
`;

const ColorWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const ColorCircle = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ active }) => (active ? "#000" : "#eee")};
  cursor: pointer;
  position: relative;
  padding: 0;
  background-color: ${({ color }) => color};
  transition: all 0.2s ease;
  overflow: hidden;
  &:hover { transform: scale(1.15); }

  ${({ isOutOfStock }) => isOutOfStock && `
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: -10%;
      width: 120%;
      height: 2px;
      background: #ff3b3b;
      transform: translateY(-50%) rotate(-45deg);
      z-index: 5;
    }
    cursor: not-allowed;
    opacity: 0.5;
  `}
`;

const Title = styled(Link)`
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #222;
  text-decoration: none;
  margin-bottom: 8px;
  &:hover { color: #007bff; }
`;

const Price = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #000;
  span { font-size: 0.8rem; color: #f00; margin-left: 4px; font-weight: 400; }
`;

/* ========== COMPONENT ========== */

export default function ProductBox({ _id, title, price, images=[], properties, outOfStock }) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const imageRef = useRef(null);

  const colorVariants = properties?.colorVariants || [];
  const availableVariants = colorVariants.filter(v => !v.outOfStock);
  const defaultVariant = availableVariants[0] || null;

  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImage, setCurrentImage] = useState(defaultVariant?.imageUrl || images[0]);
  const [hovered, setHovered] = useState(false);

  const currentVariant = colorVariants.find(v => v.color === selectedColor);
  const hasColors = colorVariants.length > 0;

  const isRupture = outOfStock || (hasColors && currentVariant?.outOfStock);
  const canAddToCart = !outOfStock && (!hasColors || (selectedColor && !currentVariant?.outOfStock));

  // Hover image animation
  useEffect(() => {
    let interval;
    if (hovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImage(prev => {
          const currentIdx = images.indexOf(prev);
          const nextIdx = (currentIdx + 1) % images.length;
          return images[nextIdx];
        });
      }, 1000);
    } else {
      setCurrentImage(defaultVariant?.imageUrl || images[0]);
    }
    return () => clearInterval(interval);
  }, [hovered, images, defaultVariant]);

  function handleAddToCart(e){
    e.preventDefault();
    if(!canAddToCart) return;

    triggerFlyAnimation(imageRef.current, imageRef.current.getBoundingClientRect());

    addProduct({
      _id,
      title,
      price,
      image: currentVariant?.imageUrl || images[0],
      color: currentVariant?.color || null,
      colorId: currentVariant?._id || null,
      qty:1,
    });
  }

  function selectColor(v){
    if(v.outOfStock || outOfStock) return;
    setSelectedColor(v.color);
    if(v.imageUrl) setCurrentImage(v.imageUrl);
  }

  return (
    <Card disabled={outOfStock}>
      {isRupture && <StockRibbon><ShineEffect />Rupture</StockRibbon>}
      <ImageBox
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <AnimatePresence mode="wait">
          <AnimatedProductImg
            key={currentImage}
            ref={imageRef}
            src={currentImage}
            alt={title}
            initial={{opacity:0, scale:0.9}}
            animate={{opacity:1, scale:1}}
            exit={{opacity:0, scale:1.1}}
            transition={{duration:0.3}}
          />
        </AnimatePresence>
      </ImageBox>
      <Content>
        {colorVariants.length > 0 && (
          <ColorWrapper>
            {colorVariants.map((v,i)=>(
              <ColorCircle
                key={i}
                color={v.color}
                active={selectedColor===v.color}
                isOutOfStock={v.outOfStock}
                onClick={(e)=>{e.preventDefault(); selectColor(v);}}
              />
            ))}
          </ColorWrapper>
        )}
        <Title href={`/product/${_id}`}>{title}</Title>
        <Price>{price} DT <span>(HT)</span></Price>
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          style={{
            marginTop:10,
            padding:"8px 12px",
            borderRadius:12,
            background:"#5542F6",
            color:"#fff",
            border:"none",
            cursor: canAddToCart ? "pointer" : "not-allowed"
          }}
        >
          {isRupture ? "Produit épuisé" : "Ajouter au panier"}
        </button>
      </Content>
    </Card>
  );
}
