"use client";
import Header from "@/components/Header";
import Center from "@/components/Center";
import Footer from "@/components/Footer";
import styled from "styled-components";
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { useState, useContext, useEffect, useRef } from "react";
import { CartContext } from "@/components/CartContext";
import { AnimationContext } from "@/components/AnimationContext";
import { motion } from "framer-motion";
import ProductBox from "@/components/ProductBox";

const accent = "#5542F6";

/* ================= STYLES ================= */

const Page = styled.div`
  background: #f9fafb;
  min-height: 100vh;
`;

const Grid = styled.div`
  display: grid;
  gap: 50px;
  margin-top: 50px;
  @media (min-width: 900px) {
    grid-template-columns: 1.1fr 1fr;
  }
`;

const Box = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 12px 30px rgba(0,0,0,.08);
  position: relative;
`;

const ImgWrapper = styled.div`
  overflow: hidden;
  border-radius: 18px;
`;

const MainImg = styled(motion.img)`
  width: 100%;
  height: 420px;
  object-fit: contain;
`;

const Thumbs = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  img {
    width: 70px;
    height: 70px;
    border-radius: 10px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s;
    &:hover {
      border-color: ${accent};
    }
  }
`;

const Desc = styled.p`
  color: #555;
  margin: 15px 0;
`;

const Qty = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
`;

const QtyBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 20px;
  background: white;
  cursor: pointer;
`;

const AddBtn = styled(motion.button)`
  width: 100%;
  padding: 12px;
  border-radius: 16px;
  border: none;
  background: ${accent};
  color: white;
  font-size: 1rem;
  margin-top: 10px;
`;

const Ribbon = styled.div`
  position: absolute;
  top: 15px;
  left: -40px;
  background: red;
  color: white;
  padding: 6px 50px;
  transform: rotate(-45deg);
  font-size: .8rem;
  z-index: 10;
`;

const ColorWrapper = styled.div`
  display: flex;
  gap: 12px;
  margin: 15px 0;
`;

const ColorCircle = styled.button`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid ${({ active }) => (active ? "#000" : "#eee")};
  background-color: ${({ color }) => color};
  cursor: pointer;
  position: relative;

  ${({ isOutOfStock }) => isOutOfStock && `
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: -20%;
      width: 140%;
      height: 2px;
      background: red;
      transform: rotate(-45deg);
    }
    opacity: .5;
    cursor: not-allowed;
  `}
`;

const Title = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
`;

const Price = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: blue;
  span {
    font-size: .8rem;
    color: red;
    margin-left: 5px;
  }
`;

const RecoGrid = styled.div`
  margin-top: 70px;
  padding-bottom: 50px;
`;

const RecoCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(220px,1fr));
  gap: 25px;
  margin-top: 25px;
`;

/* ================= COMPONENT ================= */

export default function ProductPage({ product, recommended }) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const imgRef = useRef(null);

  const colorVariants = product?.properties?.colorVariants || [];
  const hasColors = colorVariants.length > 0;

  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImage, setCurrentImage] = useState(product.images?.[0]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setSelectedColor(null);
    setCurrentImage(product.images?.[0]);
    setQty(1);
  }, [product._id]);

  const currentVariant = selectedColor 
    ? colorVariants.find(v => v.color === selectedColor) 
    : null;

  // Global out of stock logic
  const isRupture = product.stock === 0 || (selectedColor && currentVariant?.outOfStock);

  // Selection logic: Can add if product has stock AND (no color selected or selected color is in stock)
  const canAddToCart = product.stock > 0 && (!selectedColor || !currentVariant?.outOfStock);

  function handleAddToCart() {
    if (!canAddToCart) return;

    if (imgRef.current) {
      triggerFlyAnimation(imgRef.current, imgRef.current.getBoundingClientRect());
    }

    // Loop to handle the quantity state
    for (let i = 0; i < qty; i++) {
      addProduct({
        _id: product._id,
        image: currentImage, // Uses whatever image is currently displayed
        color: currentVariant?.color || null,
        colorId: currentVariant?._id || null,
      });
    }
  }

  return (
    <Page>
      <Header />
      <Center>
        <Grid>
          <Box initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            {isRupture && <Ribbon>RUPTURE</Ribbon>}
            <ImgWrapper ref={imgRef}>
              <MainImg src={currentImage} />
            </ImgWrapper>
            <Thumbs>
              {product.images.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  onClick={() => {
                    setCurrentImage(img);
                    // If user clicks a thumb that doesn't match selected color, deselect color
                    if (currentVariant && currentVariant.imageUrl !== img) {
                      setSelectedColor(null);
                    }
                  }} 
                />
              ))}
            </Thumbs>
          </Box>

          <Box initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            <Title>{product.title}</Title>
            <Desc>{product.description}</Desc>
            <Price>{product.price.toFixed(2)} DT <span>(HT)</span></Price>

            {hasColors && (
              <ColorWrapper>
                {colorVariants.map((v, i) => (
                  <ColorCircle
                    key={i}
                    color={v.color}
                    active={selectedColor === v.color}
                    isOutOfStock={v.outOfStock}
                    onClick={() => {
                      if (v.outOfStock) return;
                      setSelectedColor(v.color);
                      if (v.imageUrl) setCurrentImage(v.imageUrl);
                    }}
                  />
                ))}
              </ColorWrapper>
            )}

            <Qty>
              <QtyBtn onClick={() => setQty(q => Math.max(1, q - 1))}>-</QtyBtn>
              <strong>{qty}</strong>
              <QtyBtn onClick={() => setQty(q => q + 1)}>+</QtyBtn>
            </Qty>

            <AddBtn
              disabled={!canAddToCart}
              style={{
                opacity: canAddToCart ? 1 : .5,
                cursor: canAddToCart ? "pointer" : "not-allowed",
              }}
              onClick={handleAddToCart}
            >
              {isRupture ? "Produit épuisé" : "Ajouter au panier"}
            </AddBtn>
          </Box>
        </Grid>

        <RecoGrid>
          <h2 className="text-2xl font-bold">Produits recommandés</h2>
          <RecoCards>
            {recommended.map(p => (
              <ProductBox key={p._id} {...p} />
            ))}
          </RecoCards>
        </RecoGrid>
      </Center>
      <Footer />
    </Page>
  );
}

export async function getServerSideProps({ query }) {
  await mongooseConnect();
  const product = await Product.findById(query.id).lean();
  const recommended = await Product.aggregate([
    { $match: { _id: { $ne: product._id }, category: product.category } },
    { $sample: { size: 6 } }
  ]);
  return {
    props: {
      product: JSON.parse(JSON.stringify(product)),
      recommended: JSON.parse(JSON.stringify(recommended)),
    },
  };
}