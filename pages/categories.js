"use client";

import Header from "@/components/Header";
import Center from "@/components/Center";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { useState, useContext } from "react";
import { CartContext } from "@/components/CartContext";
import { motion, AnimatePresence } from "framer-motion";

// --- STYLES ---
const PageWrapper = styled.div`
  background-color: #f5f5f7;
  min-height: 100vh;
  padding-bottom: 60px;
`;

const CategorySection = styled.section`
  padding-top: 50px;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
`;

const PrimaryBlue = "#007bff";

const BackArrow = styled(Link)`
  text-decoration: none;
  font-size: 1.8rem;
  color: ${PrimaryBlue};
  font-weight: 700;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  &:hover { transform: translateX(-5px); }
`;

const SectionTitle = styled.h2`
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
  color: #1d1d1f;
  flex-grow: 1;
  margin-left: 15px;
`;

const ShowAllLink = styled(Link)`
  color: ${PrimaryBlue};
  text-decoration: none;
  font-weight: 600;
  &:hover { text-decoration: underline; }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  &:hover {
    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
    transform: translateY(-5px);
  }
`;

const ImageBox = styled.div`
  position: relative;
  height: 220px;
  background: #fbfbfd;
  overflow: hidden;
`;

const AnimatedProductImg = styled(motion.img)`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 15px;
`;

const FloatingIcons = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
  ${Card}:hover & {
    opacity: 1;
    transform: translateX(0);
  }
`;

const IconButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  color: #444;
  transition: all 0.2s;
  &:hover {
    background: #000;
    color: #fff;
    transform: scale(1.1);
  }
  svg { width: 20px; height: 20px; fill: currentColor; }
`;

const Info = styled.div`
  padding: 15px;
  text-align: center;
`;

const ColorWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const ColorCircle = styled.button`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid ${props => props.active ? "#000" : "#eee"};
  background-color: ${props => props.color};
  cursor: pointer;
  position: relative;
  padding: 0;
  transition: all 0.2s ease;
  overflow: hidden;
  &:hover { transform: scale(1.1); }

  /* Le cercle barré pour la rupture */
  ${props => props.isOutOfStock && `
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: -10%;
      width: 120%;
      height: 2px;
      background-color: #ff3b3b;
      transform: translateY(-50%) rotate(-45deg);
    }
    cursor: not-allowed;
    opacity: 0.6;
  `}
`;

const ProductName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #1d1d1f;
`;

const PriceText = styled.div`
  font-size: 1.15rem;
  font-weight: 700;
  color: #000;
  span { font-size: 0.8rem; color: #e60c0cff; margin-left: 4px; font-weight: 400; }
`;

const ShowMoreCard = styled(Link)`
  background: #e8e8ed;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #424245;
  font-weight: 700;
  gap: 10px;
  transition: all 0.3s ease;
  &:hover { background: #d2d2d7; color: #000; }
`;

const StockRibbon = styled.div`
  position: absolute;
  top: 10px;
  right: -30px;
  background: #ff3b3b;
  color: white;
  padding: 5px 40px;
  transform: rotate(45deg);
  z-index: 20;
  font-size: 0.7rem;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
`;

// --- SOUS-COMPOSANT ProductItem ---
function ProductItem({ product }) {
  const { addProduct } = useContext(CartContext);
  const colorVariants = product.properties?.colorVariants || [];
  const hasColors = colorVariants.length > 0;

  const [selectedVariant, setSelectedVariant] = useState(colorVariants[0] || null);
  const [currentImage, setCurrentImage] = useState(colorVariants[0]?.imageUrl || product.images?.[0]);

  // Bloquer l'ajout si le produit entier ou la couleur choisie est en rupture
  const cannotAdd = product.outOfStock || selectedVariant?.outOfStock;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cannotAdd) return;

    addProduct({
      _id: product._id,
      color: selectedVariant?.color,
      image: currentImage
    });
  };

  return (
    <Card 
      onMouseEnter={() => !hasColors && product.images?.length > 1 && setCurrentImage(product.images[1])} 
      onMouseLeave={() => !hasColors && setCurrentImage(product.images[0])}
      style={{ opacity: product.outOfStock ? 0.7 : 1 }}
    >
      {cannotAdd && <StockRibbon>RUPTURE</StockRibbon>}

      <Link href={`/product/${product._id}`} style={{textDecoration:'none'}}>
        <ImageBox>
          <AnimatePresence mode="wait">
            <AnimatedProductImg 
              key={currentImage}
              src={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              alt=""
            />
          </AnimatePresence>
          
          <FloatingIcons>
            <IconButton onClick={(e) => e.preventDefault()}>
              <svg viewBox="0 0 24 24"><path d="M12.1,18.55L12,18.65L11.89,18.55C7.14,14.24 4,11.39 4,8.5C4,6.5 5.5,5 7.5,5C8.64,5 9.74,5.54 10.45,6.38L12,8.21L13.55,6.38C14.26,5.54 15.36,5 16.5,5C18.5,5 20,6.5 20,8.5C20,11.39 16.86,14.24 12.1,18.55M16.5,3C14.76,3 13.09,3.81 12,5.08C10.91,3.81 9.24,3 7.5,3C4.42,3 2,5.41 2,8.5C2,12.27 5.4,15.36 10.55,20.03L12,21.35L13.45,20.03C18.6,15.36 22,12.27 22,8.5C22,5.41 19.58,3 16.5,3Z"/></svg>
            </IconButton>
            <IconButton 
              onClick={handleAddToCart}
              style={{ 
                cursor: cannotAdd ? 'not-allowed' : 'pointer',
                backgroundColor: cannotAdd ? '#f0f0f0' : 'white'
              }}
            >
              <svg viewBox="0 0 24 24"><path d="M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z"/></svg>
            </IconButton>
          </FloatingIcons>
        </ImageBox>
        
        <Info>
          {hasColors && (
            <ColorWrapper>
              {colorVariants.map((v, i) => (
                <ColorCircle 
                  key={i}
                  active={selectedVariant?.color === v.color}
                  color={v.color}
                  isOutOfStock={v.outOfStock}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedVariant(v);
                    if (v.imageUrl) setCurrentImage(v.imageUrl);
                  }}
                />
              ))}
            </ColorWrapper>
          )}
          <ProductName>{product.title}</ProductName>
          <PriceText>{product.price} TND <span>(HT)</span></PriceText>
        </Info>
      </Link>
    </Card>
  );
}

// --- PAGE PRINCIPALE ---
export default function CategoriesPage({ categoriesWithProducts = [] }) {
  return (
    <PageWrapper>
      <Header />
      <Center>
        {categoriesWithProducts.map((cat, index) => (
          <CategorySection key={cat._id}>
            <CategoryHeader>
              {index === 0 && <BackArrow href={"/"}>←</BackArrow>}
              <SectionTitle>{cat.name}</SectionTitle>
              <ShowAllLink href={`/category/${cat._id}`}>Voir tout</ShowAllLink>
            </CategoryHeader>

            <ProductsGrid>
              {cat.products.map(product => (
                <ProductItem key={product._id} product={product} />
              ))}

              <ShowMoreCard href={`/category/${cat._id}`}>
                <span>Découvrir plus</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </ShowMoreCard>
            </ProductsGrid>
          </CategorySection>
        ))}
      </Center>
    </PageWrapper>
  );
}

// --- PARTIE SERVEUR (Indispensable pour Mongoose) ---
export async function getServerSideProps() {
    // Import dynamique pour éviter que Webpack ne lise Mongoose côté client
    const { mongooseConnect } = require("@/lib/mongoose");
    const { Category } = require("@/models/Category");
    const { Product } = require("@/models/Product");

    await mongooseConnect();
    const categories = await Category.find();
    const categoriesWithProducts = [];

    for (const cat of categories) {
        const products = await Product.find({ category: cat._id }, null, { 
            limit: 3, 
            sort: { '_id': -1 } 
        });
        if (products.length > 0) {
            categoriesWithProducts.push({
                _id: cat._id.toString(),
                name: cat.name,
                products: JSON.parse(JSON.stringify(products)),
            });
        }
    }
    return { props: { categoriesWithProducts: JSON.parse(JSON.stringify(categoriesWithProducts)) } };
}