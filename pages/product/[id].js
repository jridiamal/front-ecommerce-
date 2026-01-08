"use client";
import Header from "@/components/Header";
import Center from "@/components/Center";
import Footer from "@/components/Footer";
import styled from "styled-components";
import { useState, useContext, useEffect, useRef } from "react";
import { CartContext } from "@/components/CartContext";
import { AnimationContext } from "@/components/AnimationContext";
import { motion } from "framer-motion";
import ProductBox from "@/components/ProductBox";

const accent = "#5542F6";

/* ================= STYLES RESPONSIVES ================= */

const Page = styled.div`
  background: #f9fafb;
  min-height: 100vh;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr; /* 1 colonne sur mobile */
  gap: 20px;
  margin-top: 20px;
  width: 100%;

  @media (min-width: 900px) {
    grid-template-columns: 1.1fr 1fr; /* 2 colonnes sur PC */
    gap: 50px;
    margin-top: 50px;
  }
`;

const Box = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 15px; /* Plus petit sur mobile */
  box-shadow: 0 12px 30px rgba(0,0,0,.08);
  position: relative;
  width: 100%;
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 25px;
  }
`;

const ImgWrapper = styled.div`
  overflow: hidden;
  border-radius: 18px;
  display: flex;
  justify-content: center;
`;

const MainImg = styled(motion.img)`
  width: 100%;
  max-height: 300px; /* Limité sur mobile */
  object-fit: contain;

  @media (min-width: 768px) {
    max-height: 420px;
  }
`;

const Thumbs = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  overflow-x: auto; /* Scroll horizontal si trop d'images sur mobile */
  padding-bottom: 5px;
  
  img {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    border-radius: 10px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s;
    &.active { border-color: ${accent}; }
  }
`;

const AddBtn = styled(motion.button)`
  width: 100%;
  padding: 16px; /* Plus grand pour le pouce sur mobile */
  border-radius: 16px;
  border: none;
  background: ${accent};
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 15px;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ColorWrapper = styled.div`
  display: flex;
  flex-wrap: wrap; /* Revient à la ligne si trop de couleurs */
  gap: 12px;
  margin: 15px 0;
`;

// ... (Gardez vos autres styles ColorCircle, Price, Title ici)

/* ================= COMPONENT ================= */

export default function ProductPage({ product, recommended }) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const imgRef = useRef(null);

  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImage, setCurrentImage] = useState(product?.images?.[0]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setCurrentImage(product?.images?.[0]);
  }, [product]);

  const colorVariants = product?.properties?.colorVariants || [];
  const currentVariant = selectedColor 
    ? colorVariants.find(v => v.color === selectedColor) 
    : null;

  const isRupture = product?.stock === 0 || (selectedColor && currentVariant?.outOfStock);
  const canAddToCart = product?.stock > 0 && (!selectedColor || !currentVariant?.outOfStock);

  function handleAddToCart() {
    if (!canAddToCart) return;

    // Animation
    if (imgRef.current && triggerFlyAnimation) {
      triggerFlyAnimation(imgRef.current, imgRef.current.getBoundingClientRect());
    }

    // Ajout au panier
    for (let i = 0; i < qty; i++) {
      addProduct({
        _id: product._id,
        title: product.title,
        price: product.price,
        image: currentImage,
        color: selectedColor,
        colorId: currentVariant?._id || null,
      });
    }
  }

  if (!product) return null;

  return (
    <Page>
      <Header />
      <Center>
        <Grid>
          {/* Section Image */}
          <Box initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {isRupture && <div style={{position:'absolute', top:'10px', right:'10px', background:'red', color:'white', padding:'5px 10px', borderRadius:'5px', zIndex:10}}>RUPTURE</div>}
            <ImgWrapper ref={imgRef}>
              <MainImg src={currentImage} />
            </ImgWrapper>
            <Thumbs>
              {product.images.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  className={currentImage === img ? 'active' : ''}
                  onClick={() => setCurrentImage(img)} 
                />
              ))}
            </Thumbs>
          </Box>

          {/* Section Infos */}
          <Box initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 style={{fontSize:'1.5rem', margin:'0 0 10px 0'}}>{product.title}</h1>
            <p style={{color:'#666', fontSize:'0.9rem', lineHeight:'1.5'}}>{product.description}</p>
            
            <div style={{fontSize:'1.4rem', fontWeight:'bold', color:accent, margin:'15px 0'}}>
              {product.price.toFixed(2)} DT
            </div>

            {colorVariants.length > 0 && (
              <div>
                <p style={{fontWeight:'600', marginBottom:'10px'}}>Couleurs disponibles :</p>
                <ColorWrapper>
                  {colorVariants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (!v.outOfStock) {
                          setSelectedColor(v.color);
                          if (v.imageUrl) setCurrentImage(v.imageUrl);
                        }
                      }}
                      style={{
                        width:'30px', height:'30px', borderRadius:'50%', 
                        background: v.color, border: selectedColor === v.color ? '3px solid black' : '1px solid #ddd',
                        cursor: v.outOfStock ? 'not-allowed' : 'pointer',
                        opacity: v.outOfStock ? 0.3 : 1
                      }}
                    />
                  ))}
                </ColorWrapper>
              </div>
            )}

            <div style={{display:'flex', alignItems:'center', gap:'20px', margin:'20px 0'}}>
               <div style={{display:'flex', alignItems:'center', border:'1px solid #ddd', borderRadius:'10px'}}>
                  <button style={{padding:'10px 15px', border:'none', background:'none'}} onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
                  <span style={{padding:'0 10px', fontWeight:'bold'}}>{qty}</span>
                  <button style={{padding:'10px 15px', border:'none', background:'none'}} onClick={() => setQty(q => q + 1)}>+</button>
               </div>
            </div>

            <AddBtn
              disabled={!canAddToCart}
              whileTap={canAddToCart ? { scale: 0.95 } : {}}
              onClick={handleAddToCart}
            >
              {isRupture ? "Épuisé" : "Ajouter au panier"}
            </AddBtn>
          </Box>
        </Grid>

        {/* Recommandations */}
        <div style={{marginTop:'50px', padding:'0 10px'}}>
          <h2 style={{fontSize:'1.3rem', marginBottom:'20px'}}>Produits recommandés</h2>
          <div style={{
            display:'grid', 
            gridTemplateColumns:'repeat(2, 1fr)', /* 2 colonnes sur mobile */
            gap:'15px'
          }}>
            {/* Si vous avez un min-width sur PC, utilisez des media queries ici */}
            {recommended?.map(p => (
              <ProductBox key={p._id} {...p} />
            ))}
          </div>
        </div>
      </Center>
      <Footer />
    </Page>
  );
}