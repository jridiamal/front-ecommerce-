"use client";

import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useContext, useRef, useState, useEffect } from "react";
import { CartContext } from "@/components/CartContext";
import { AnimationContext } from "./AnimationContext";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-toastify";


const shine = keyframes`
  0% { left: -75%; }
  100% { left: 125%; }
`;

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
  letter-spacing: 0.7px;
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

const IconsOverlay = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 25;
`;

const ActionButton = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  transform: translateX(-50px);
  opacity: 0;
  ${Card}:hover & {
    transform: translateX(0);
    opacity: 1;
    transition-delay: ${({ delay }) => delay || "0s"};
  }
  &:hover {
    background: #000;
    color: #fff;
    transform: scale(1.1);
  }
  svg { width: 18px; height: 18px; fill: currentColor; }
  &.wished { color: #ff3b3b; }
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
  span { font-size: 0.8rem; color: #f00e0eff; margin-left: 4px; font-weight: 400; }
`;


export default function ProductBox({
  _id,
  title,
  price,
  images = [],
  properties,
  outOfStock,
  wished = false,
}) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const { status } = useSession();
  const imageRef = useRef(null);

  const [isWished, setIsWished] = useState(wished);

  const colorVariants = properties?.colorVariants || [];
  const availableVariants = colorVariants.filter(v => !v.outOfStock);

  const defaultVariant = availableVariants[0] || null;

const [selectedColor, setSelectedColor] = useState(null);
  const [currentImage, setCurrentImage] = useState(
    defaultVariant?.imageUrl || images[0]
  );

  const [hovered, setHovered] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(1); // index image sur hover

  const currentVariant = colorVariants.find(v => v.color === selectedColor);
const hasColors = colorVariants.length > 0;

const isRupture =
  outOfStock || (hasColors && currentVariant?.outOfStock);

const canAddToCart =
  !outOfStock &&
  (!hasColors || (selectedColor && !currentVariant?.outOfStock));

  // cycle automatique des images au hover
  useEffect(() => {
    let interval;
    if (hovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImage(prev => {
          const currentIdx = images.indexOf(prev);
          const nextIdx = (currentIdx + 1) % images.length;
          return images[nextIdx];
        });
      }, 1000); // change d'image toutes les 1s
    } else {
      setCurrentImage(defaultVariant?.imageUrl || images[0]);
    }
    return () => clearInterval(interval);
  }, [hovered, images, defaultVariant]);

 

  async function toggleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();

    if (status !== "authenticated") {
      toast.error("Veuillez vous connecter");
      return;
    }

    const next = !isWished;
    setIsWished(next);

    try {
      await axios.post("/api/wishlist", { product: _id }, { withCredentials: true });
      toast.success(next ? "Ajouté aux favoris" : "Retiré des favoris");
    } catch {
      setIsWished(!next);
      toast.error("Erreur favoris");
    }
  }

 function handleAddToCart(e) {
  e.preventDefault();

  let imageToAdd = images[0]; 
  let colorToAdd = null;
  let colorIdToAdd = null;

  if (hasColors && selectedColor) {
    imageToAdd = currentVariant?.imageUrl || images[0];
    colorToAdd = currentVariant?.color;
    colorIdToAdd = currentVariant?._id || null;
  }

  if (imageRef.current) {
    triggerFlyAnimation(imageRef.current, imageRef.current.getBoundingClientRect());
  }

  addProduct({
    _id,
    colorId: colorIdToAdd,
    color: colorToAdd,
    image: imageToAdd,
  });

  toast.success("Produit ajouté au panier");
}

  

  function selectColor(variant) {
    if (variant.outOfStock || outOfStock) return;
    setSelectedColor(variant.color);
    if (variant.imageUrl) setCurrentImage(variant.imageUrl);
  }

  return (
    <Card disabled={outOfStock}>
      {isRupture && (
        <StockRibbon>
          <ShineEffect />
          Rupture
        </StockRibbon>
      )}

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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>

        <IconsOverlay>
          <ActionButton
            type="button"
            className={isWished ? "wished" : ""}
            onClick={toggleWishlist}
            title="Ajouter aux favoris"
          >
            <svg viewBox="0 0 24 24">
              <path
                d={
                  isWished
                    ? "M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
                    : "M12.1,18.55L12,18.65L11.89,18.55C7.14,14.24 4,11.39 4,8.5C4,6.5 5.5,5 7.5,5C8.64,5 9.74,5.54 10.45,6.38L12,8.21L13.55,6.38C14.26,5.54 15.36,5 16.5,5C18.5,5 20,6.5 20,8.5C20,11.39 16.86,14.24 12.1,18.55M16.5,3C14.76,3 13.09,3.81 12,5.08C10.91,3.81 9.24,3 7.5,3C4.42,3 2,5.41 2,8.5C2,12.27 5.4,15.36 10.55,20.03L12,21.35L13.45,20.03C18.6,15.36 22,12.27 22,8.5C22,5.41 19.58,3 16.5,3Z"
                }
              />
            </svg>
          </ActionButton>

          <ActionButton
            type="button"
            delay="0.1s"
           onClick={canAddToCart ? handleAddToCart : undefined}
style={{
  opacity: canAddToCart ? 1 : 0.4,
  cursor: canAddToCart ? "pointer" : "not-allowed",
}}

          >
            <svg viewBox="0 0 24 24">
              <path d="M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z" />
            </svg>
          </ActionButton>
        </IconsOverlay>
      </ImageBox>

      <Content>
        {colorVariants.length > 0 && (
          <ColorWrapper>
            {colorVariants.map((v, i) => (
              <ColorCircle
                key={i}
                type="button"
                color={v.color}
                active={selectedColor === v.color}
                isOutOfStock={v.outOfStock}
                onClick={(e) => {
                  e.preventDefault();
                  selectColor(v);
                }}
              />
            ))}
          </ColorWrapper>
        )}

        <Title href={`/product/${_id}`}>{title}</Title>
        <Price>{price} DT <span>(HT)</span></Price>
      </Content>
    </Card>
  );
}
