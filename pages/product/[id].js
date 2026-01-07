import Header from "@/components/Header";
import Center from "@/components/Center";
import Footer from "@/components/Footer";
import styled from "styled-components";
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { useContext, useEffect, useRef, useState } from "react";
import { CartContext } from "@/components/CartContext";
import { AnimationContext } from "@/components/AnimationContext";
import { motion, AnimatePresence } from "framer-motion";

/* ================= STYLES ================= */

const Page = styled.div`background:#f9fafb; min-height:100vh;`;
const Grid = styled.div`
  display:grid; gap:40px; margin-top:40px;
  @media(min-width:900px){ grid-template-columns:1.1fr 1fr; }
`;
const Box = styled.div`
  background:#fff; border-radius:20px; padding:25px;
  box-shadow:0 12px 30px rgba(0,0,0,.08);
  position:relative;
`;
const Ribbon = styled.div`
  position:absolute; top:15px; left:-40px;
  background:#ff2d2d; color:#fff;
  padding:6px 50px; transform:rotate(-45deg);
  font-size:.8rem;
`;

const MainImg = styled(motion.img)`
  width:100%; height:420px; object-fit:contain;
`;

const Thumbs = styled.div`
  display:flex; gap:10px; margin-top:15px;
  img{
    width:70px;height:70px;border-radius:10px;
    cursor:pointer;border:2px solid transparent;
  }
  img:hover{border-color:#5542F6;}
`;

const Colors = styled.div`
  display:flex; gap:10px; margin:20px 0;
`;

const ColorCircle = styled.button`
  width:26px;height:26px;border-radius:50%;
  border:2px solid ${({active})=>active?"#000":"#eee"};
  background:${({color})=>color};
  cursor:pointer; position:relative;
  ${({out})=>out && `
    opacity:.4; cursor:not-allowed;
    &::after{
      content:""; position:absolute; top:50%; left:-20%;
      width:140%; height:2px; background:red;
      transform:rotate(-45deg);
    }
  `}
`;

const Qty = styled.div`
  display:flex; align-items:center; gap:15px; margin:20px 0;
`;
const QtyBtn = styled.button`
  width:40px;height:40px;border-radius:10px;
  border:1px solid #ddd; background:#fff;
`;

const AddBtn = styled.button`
  width:100%; padding:14px;
  border-radius:16px; border:none;
  background:#5542F6; color:#fff;
  font-size:1rem;
`;

/* ================= COMPONENT ================= */

export default function ProductPage({ product }) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const imgRef = useRef(null);

  const colorVariants = product?.properties?.colorVariants || [];
  const hasColors = colorVariants.length > 0;

  const defaultVariant = hasColors
    ? colorVariants.find(v => !v.outOfStock)
    : null;

  const [selectedColor, setSelectedColor] = useState(defaultVariant?.color || null);
  const [mainImage, setMainImage] = useState(
    defaultVariant?.imageUrl || product.images[0]
  );
  const [qty, setQty] = useState(1);

  const currentVariant = colorVariants.find(v => v.color === selectedColor);

  const isRupture =
    product.stock === 0 ||
    (hasColors && selectedColor && currentVariant?.outOfStock);

  const canAddToCart =
    product.stock > 0 &&
    (!hasColors || (selectedColor && !currentVariant?.outOfStock));

  function selectColor(variant) {
    if (variant.outOfStock) return;
    setSelectedColor(variant.color);
    if (variant.imageUrl) setMainImage(variant.imageUrl);
  }

  function handleAddToCart() {
    if (!canAddToCart) return;

    const imageToAdd =
      currentVariant?.imageUrl || product.images[0];

    addProduct({
      _id: product._id,
      color: selectedColor,
      image: imageToAdd,
      qty,
    });

    if (imgRef.current) {
      triggerFlyAnimation(imgRef.current, imgRef.current.getBoundingClientRect());
    }
  }

  return (
    <Page>
      <Header />
      <Center>

        <Grid>
          {/* IMAGE */}
          <Box>
            {isRupture && <Ribbon>RUPTURE</Ribbon>}
            <AnimatePresence mode="wait">
              <MainImg
                key={mainImage}
                ref={imgRef}
                src={mainImage}
                initial={{opacity:0,scale:.95}}
                animate={{opacity:1,scale:1}}
                exit={{opacity:0}}
              />
            </AnimatePresence>

            <Thumbs>
              {product.images.map((img,i)=>(
                <img key={i} src={img} onClick={()=>setMainImage(img)} />
              ))}
            </Thumbs>
          </Box>

          {/* DETAILS */}
          <Box>
            <h2>{product.title}</h2>
            <p>{product.description}</p>
            <strong>{product.price} DT (HT)</strong>

            {hasColors && (
              <Colors>
                {colorVariants.map((v,i)=>(
                  <ColorCircle
                    key={i}
                    color={v.color}
                    active={selectedColor===v.color}
                    out={v.outOfStock}
                    onClick={()=>selectColor(v)}
                  />
                ))}
              </Colors>
            )}

            <Qty>
              <QtyBtn onClick={()=>setQty(q=>Math.max(1,q-1))}>-</QtyBtn>
              <b>{qty}</b>
              <QtyBtn onClick={()=>setQty(q=>q+1)}>+</QtyBtn>
            </Qty>

            <AddBtn
              disabled={!canAddToCart}
              style={{opacity:canAddToCart?1:.5}}
              onClick={handleAddToCart}
            >
              {isRupture ? "Produit épuisé" : "Ajouter au panier"}
            </AddBtn>
          </Box>
        </Grid>

      </Center>
      <Footer />
    </Page>
  );
}

/* ================= SERVER ================= */

export async function getServerSideProps({ query }) {
  await mongooseConnect();
  const product = await Product.findById(query.id).lean();

  return {
    props: {
      product: JSON.parse(JSON.stringify(product)),
    },
  };
}
