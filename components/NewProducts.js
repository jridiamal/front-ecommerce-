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
import { toast } from "react-toastify";

const accent = "#5542F6";

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
  height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  position: relative;
  cursor: zoom-in;
`;

const MainImg = styled(motion.img)`
  width: 100%;
  height: 100%;
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
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    opacity: 0.5;
  }
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
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 25px;
  margin-top: 25px;
`;

export default function ProductPage({ product, recommended }) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const imgRef = useRef(null);

  const colorVariants = product?.properties?.colorVariants || [];
  const hasColors = colorVariants.length > 0;

  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImage, setCurrentImage] = useState(product.images?.[0]);
  const [qty, setQty] = useState(1);

  // ÉTATS POUR LE ZOOM
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setSelectedColor(null);
    setCurrentImage(product.images?.[0]);
    setQty(1);
  }, [product._id]);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const currentVariant = selectedColor 
    ? colorVariants.find(v => v.color === selectedColor) 
    : colorVariants.find(v => v.imageUrl === currentImage);

  const isProductOutOfStock = product.stock === 0 || product.outOfStock;
  const isCurrentVariantOutOfStock = currentVariant?.outOfStock;
  const isRupture = isProductOutOfStock || 
    (selectedColor && isCurrentVariantOutOfStock) ||
    (!selectedColor && hasColors && isCurrentVariantOutOfStock);
  
  const canAddToCart = !isProductOutOfStock && 
    (!selectedColor || !isCurrentVariantOutOfStock) &&
    (!currentVariant || !currentVariant.outOfStock);

  function handleAddToCart() {
    if (!canAddToCart) return;

    const imageToUse = currentVariant?.imageUrl || currentImage;

    if (imgRef.current) {
      triggerFlyAnimation(imgRef.current, imgRef.current.getBoundingClientRect());
    }

    for (let i = 0; i < qty; i++) {
      addProduct({
        _id: product._id,
        title: product.title,
        price: product.price,
        image: imageToUse,
        color: currentVariant?.color || null,
        colorId: currentVariant?._id || null,
      });
    }
    
    toast.success(qty > 1 ? `${qty} produits ajoutés` : "Produit ajouté");
  }

  const handleThumbClick = (img) => {
    const variantForImage = colorVariants.find(v => v.imageUrl === img);
    if (variantForImage?.outOfStock) {
      toast.error(`Couleur ${variantForImage.color} épuisée`);
      return;
    }
    setSelectedColor(variantForImage?.color || null);
    setCurrentImage(img);
  };

  return (
    <Page>
      <Header />
      <Center>
        <Grid>
          <Box initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            {isRupture && <Ribbon>RUPTURE</Ribbon>}
            <ImgWrapper 
              ref={imgRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              <MainImg 
                src={currentImage} 
                alt={product.title}
                animate={{
                  scale: isZoomed ? 2 : 1,
                  originX: `${zoomPos.x}%`,
                  originY: `${zoomPos.y}%`
                }}
                transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
              />
            </ImgWrapper>
            <Thumbs>
              {product.images.map((img, i) => (
                <img 
                  key={i} 
                  src={img} 
                  onClick={() => handleThumbClick(img)}
                  alt="thumbnail"
                  style={{
                    border: currentImage === img ? `2px solid ${accent}` : '2px solid transparent',
                    opacity: colorVariants.find(v => v.imageUrl === img)?.outOfStock ? 0.5 : 1
                  }}
                />
              ))}
            </Thumbs>
          </Box>

          <Box initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                      if (!v.outOfStock) {
                        setSelectedColor(v.color);
                        if (v.imageUrl) setCurrentImage(v.imageUrl);
                      }
                    }}
                  />
                ))}
              </ColorWrapper>
            )}

            <Qty>
              <QtyBtn onClick={() => setQty(q => Math.max(1, q - 1))} disabled={!canAddToCart}>-</QtyBtn>
              <strong>{qty}</strong>
              <QtyBtn onClick={() => setQty(q => q + 1)} disabled={!canAddToCart}>+</QtyBtn>
            </Qty>

            <AddBtn
              disabled={!canAddToCart}
              onClick={handleAddToCart}
              whileHover={canAddToCart ? { scale: 1.02 } : {}}
              whileTap={canAddToCart ? { scale: 0.98 } : {}}
            >
              {isRupture ? "Épuisé" : `Ajouter au panier (${qty})`}
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
    { $sample: { size: 8 } } 
  ]);

  return {
    props: {
      product: JSON.parse(JSON.stringify(product)),
      recommended: JSON.parse(JSON.stringify(recommended)),
    },
  };
}