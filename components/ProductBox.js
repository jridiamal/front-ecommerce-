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

/* ================== STYLES OPTIMISÉS ================== */

const shine = keyframes`
  0% { left: -75%; }
  100% { left: 125%; }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  extra-overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  ${({ disabled }) => disabled && `opacity: 0.7;`}

  @media (hover: hover) {
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 25px rgba(0,0,0,0.12);
    }
  }
`;

const StockRibbon = styled.div`
  position: absolute;
  top: 10px;
  right: -35px;
  width: 130px;
  text-align: center;
  padding: 4px 0;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #fff;
  z-index: 30;
  transform: rotate(45deg);
  background: linear-gradient(145deg, #ff3b3b, #c70039);
  
  @media (min-width: 768px) {
    width: 180px;
    font-size: 0.75rem;
    right: -26px;
  }
`;

const ImageBox = styled.div`
  position: relative;
  height: 160px; /* Hauteur réduite pour mobile */
  overflow: hidden;
  background: #f9f9f9;
  border-radius: 12px 12px 0 0;

  @media (min-width: 768px) {
    height: 220px;
  }
`;

const IconsOverlay = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 25;
`;

const ActionButton = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  
  /* Sur mobile, on affiche les boutons directement */
  opacity: 1;
  transform: translateX(0);

  /* Sur Desktop, on garde l'effet d'animation au survol */
  @media (hover: hover) {
    opacity: 0;
    transform: translateX(-30px);
    ${Card}:hover & {
      opacity: 1;
      transform: translateX(0);
      transition-delay: ${({ delay }) => delay || "0s"};
    }
  }

  &:active { transform: scale(0.9); }
  svg { width: 16px; height: 16px; fill: currentColor; }
  &.wished { color: #ff3b3b; }
`;

const Content = styled.div`
  padding: 12px 8px;
  text-align: center;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Title = styled(Link)`
  font-size: 0.85rem;
  font-weight: 600;
  color: #222;
  text-decoration: none;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (min-width: 768px) { font-size: 1rem; }
`;

const Price = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #000;
  span { font-size: 0.7rem; color: #888; margin-left: 2px; }
`;

const ColorWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

/* ================== COMPONENT ================== */

export default function ProductBox({
  _id, title, price, images = [], properties, outOfStock, wished = false,
}) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const { status } = useSession();
  const imageRef = useRef(null);
  const [isWished, setIsWished] = useState(wished);
  const [hovered, setHovered] = useState(false);

  const colorVariants = properties?.colorVariants || [];
  const availableVariants = colorVariants.filter(v => !v.outOfStock);
  const defaultVariant = availableVariants[0] || null;

  const [selectedColor, setSelectedColor] = useState(defaultVariant?.color || null);
  const [currentImage, setCurrentImage] = useState(defaultVariant?.imageUrl || images[0]);

  const currentVariant = colorVariants.find(v => v.color === selectedColor);
  const isRupture = outOfStock || (colorVariants.length > 0 && currentVariant?.outOfStock);
  const canAddToCart = !outOfStock && (colorVariants.length === 0 || (selectedColor && !currentVariant?.outOfStock));

  useEffect(() => {
    let interval;
    if (hovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImage(prev => {
          const idx = images.indexOf(prev);
          return images[(idx + 1) % images.length];
        });
      }, 1200);
    } else if (!hovered) {
      setCurrentImage(currentVariant?.imageUrl || images[0]);
    }
    return () => clearInterval(interval);
  }, [hovered, images, currentVariant]);

  async function toggleWishlist(e) {
    e.preventDefault();
    if (status !== "authenticated") return toast.error("Connectez-vous");
    setIsWished(!isWished);
    try {
      await axios.post("/api/wishlist", { product: _id });
      toast.success(!isWished ? "Ajouté" : "Retiré");
    } catch { setIsWished(isWished); }
  }

  function handleAddToCart(e) {
    e.preventDefault();
    if (!canAddToCart) return toast.error("Indisponible");
    if (imageRef.current) {
      triggerFlyAnimation(imageRef.current, imageRef.current.getBoundingClientRect());
    }
    addProduct({ _id, color: selectedColor, image: currentImage });
  }

  return (
    <Card disabled={outOfStock}>
      {isRupture && <StockRibbon>Rupture</StockRibbon>}
      <ImageBox onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage}
            ref={imageRef}
            src={currentImage}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        </AnimatePresence>
        <IconsOverlay>
          <ActionButton type="button" className={isWished ? "wished" : ""} onClick={toggleWishlist}>
            <svg viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg>
          </ActionButton>
          <ActionButton type="button" delay="0.1s" onClick={handleAddToCart} style={{ opacity: canAddToCart ? 1 : 0.5 }}>
            <svg viewBox="0 0 24 24"><path d="M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z" /></svg>
          </ActionButton>
        </IconsOverlay>
      </ImageBox>
      <Content>
        <div>
          {colorVariants.length > 0 && (
            <ColorWrapper>
              {colorVariants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedColor(v.color); setCurrentImage(v.imageUrl); }}
                  style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    backgroundColor: v.color, border: selectedColor === v.color ? "2px solid #000" : "1px solid #ddd",
                    cursor: "pointer", opacity: v.outOfStock ? 0.3 : 1
                  }}
                />
              ))}
            </ColorWrapper>
          )}
          <Title href={`/product/${_id}`}>{title}</Title>
        </div>
        <Price>{price} DT <span>HT</span></Price>
      </Content>
    </Card>
  );
}