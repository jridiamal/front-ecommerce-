"use client";

import Header from "@/components/Header";
import Center from "@/components/Center";
import Footer from "@/components/Footer";
import styled, { keyframes } from "styled-components";
import { useState, useEffect, useContext, useRef } from "react";
import { CartContext } from "@/components/CartContext";
import { AnimationContext } from "@/components/AnimationContext";
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { motion, AnimatePresence } from "framer-motion";

/* ===== STYLES ===== */

const shine = keyframes`
  0% { left: -75%; }
  100% { left: 125%; }
`;

const Page = styled.div`background: #f9fafb; min-height: 100vh;`;
const Grid = styled.div`display: grid; gap: 50px; margin-top: 50px; @media(min-width:900px){grid-template-columns:1.1fr 1fr;}`;
const Box = styled(motion.div)`background:white; border-radius:20px; padding:25px; box-shadow:0 12px 30px rgba(0,0,0,.08); position:relative; &:hover { transform: translateY(-5px); }`;
const ImgWrapper = styled.div`position:relative; overflow:hidden; border-radius:18px; height:400px; cursor:pointer;`;
const AnimatedProductImg = styled(motion.img)`position:absolute; inset:0; width:100%; height:100%; object-fit:contain;`;
const StockRibbon = styled.div`position:absolute; top:14px; right:-26px; width:180px; text-align:center; padding:6px 0; font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:0.7px; color:#fff; z-index:30; pointer-events:none; transform:rotate(45deg); border-radius:4px; background:linear-gradient(145deg,#ff3b3b,#c70039); box-shadow:0 5px 15px rgba(0,0,0,0.3); overflow:hidden;`;
const ShineEffect = styled.span`position:absolute; top:0; left:-75%; width:50%; height:100%; background:linear-gradient(120deg,rgba(255,255,255,0.4),rgba(255,255,255,0),rgba(255,255,255,0.4)); transform:skewX(-25deg); animation:${shine} 2s infinite;`;
const ColorWrapper = styled.div`display:flex; justify-content:center; gap:10px; margin:12px 0;`;
const ColorCircle = styled.button`width:20px; height:20px; border-radius:50%; border:2px solid ${({ active }) => (active ? "#000" : "#eee")}; cursor:pointer; position:relative; padding:0; background-color:${({ color }) => color}; transition: all 0.2s ease; overflow:hidden; &:hover { transform: scale(1.15); } ${({ isOutOfStock }) => isOutOfStock && `&::after{content:""; position:absolute; top:50%; left:-10%; width:120%; height:2px; background:#ff3b3b; transform:translateY(-50%) rotate(-45deg); z-index:5;} cursor:not-allowed; opacity:0.5;`}`;
const Content = styled.div`padding:20px 15px; text-align:center;`;
const Title = styled.h2`font-size:1.2rem; font-weight:600; margin-bottom:8px; color:#222;`;
const Price = styled.div`font-size:1.1rem; font-weight:700; color:#000; span{ font-size:0.8rem; color:#f00; margin-left:4px; font-weight:400; }`;
const AddBtn = styled(motion.button)`width:100%; padding:12px; border-radius:16px; border:none; background:#5542F6; color:white; font-size:1rem; margin-top:10px; cursor:pointer; &:disabled{ opacity:0.5; cursor:not-allowed; }`;

/* ===== COMPONENT ===== */

export default function ProductDetail({ product }) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const imgRef = useRef(null);

  const [selectedColor, setSelectedColor] = useState(null);
  const colorVariants = product?.properties?.colorVariants || [];
  const hasColors = colorVariants.length > 0;

  // Default image if user doesn't select color
  const defaultVariant = colorVariants.find(v => !v.outOfStock && !v.color) || {};
  const defaultImage = defaultVariant.imageUrl || product.images?.[0];

  const [currentImage, setCurrentImage] = useState(defaultImage);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!selectedColor) setCurrentImage(defaultImage);
  }, [selectedColor, defaultImage]);

  const selectColor = (variant) => {
    if (variant.outOfStock) return;
    setSelectedColor(variant.color);
    if (variant.imageUrl) setCurrentImage(variant.imageUrl);
  };

  const canAddToCart = !product.stock === 0 && (!hasColors || (selectedColor || defaultVariant));

  const handleAddToCart = () => {
    const variantToAdd = hasColors ? colorVariants.find(v => v.color === selectedColor) || defaultVariant : {};
    addProduct({
      _id: product._id,
      color: variantToAdd.color || null,
      colorId: variantToAdd._id || null,
      image: variantToAdd.imageUrl || defaultImage,
      outOfStock: variantToAdd.outOfStock || product.stock === 0
    });

    if (imgRef.current) {
      triggerFlyAnimation(imgRef.current, imgRef.current.getBoundingClientRect());
    }
  };

  return (
    <Page>
      <Header />
      <Center>
        <Grid>
          <Box onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {product.stock === 0 && (
              <StockRibbon><ShineEffect />Rupture</StockRibbon>
            )}
            <ImgWrapper ref={imgRef}>
              <AnimatePresence mode="wait">
                <AnimatedProductImg
                  key={currentImage}
                  src={currentImage}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration:0.3 }}
                />
              </AnimatePresence>
            </ImgWrapper>

            {hasColors && (
              <ColorWrapper>
                {colorVariants.map((v,i)=>(
                  <ColorCircle
                    key={i}
                    color={v.color}
                    active={selectedColor===v.color}
                    isOutOfStock={v.outOfStock}
                    onClick={() => selectColor(v)}
                  />
                ))}
              </ColorWrapper>
            )}
          </Box>

          <Box>
            <Title>{product.title}</Title>
            <Price>{product.price.toFixed(2)} DT <span>(HT)</span></Price>

            <AddBtn
              disabled={!canAddToCart}
              onClick={handleAddToCart}
            >
              {product.stock===0 ? "Produit épuisé" : "Ajouter au panier"}
            </AddBtn>
          </Box>
        </Grid>
      </Center>
      <Footer />
    </Page>
  );
}

/* ===== SERVER SIDE ===== */

export async function getServerSideProps({ query }) {
  await mongooseConnect();
  const product = await Product.findById(query.id).lean();
  return { props: { product: JSON.parse(JSON.stringify(product)) } };
}
