import Header from "@/components/Header";
import Center from "@/components/Center";
import Footer from "@/components/Footer";
import styled from "styled-components";
import Link from "next/link";
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { useState, useContext, useRef, useEffect } from "react";
import { CartContext } from "@/components/CartContext";
import { AnimationContext } from "@/components/AnimationContext";
import { motion } from "framer-motion";

const accent = "#5542F6";

/* ================= STYLES ================= */

const Page = styled.div`background: #f9fafb; min-height: 100vh;`;
const Grid = styled.div`
  display: grid;
  gap: 50px;
  margin-top: 50px;
  @media (min-width: 900px) { grid-template-columns: 1.1fr 1fr; }
`;
const Box = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 12px 30px rgba(0,0,0,.08);
  position: relative;
`;
const ImgWrapper = styled.div`overflow: hidden; border-radius: 18px;`;
const MainImg = styled(motion.img)`width: 100%; height: 420px; object-fit: contain;`;
const Thumbs = styled.div`
  display: flex; gap: 10px; margin-top: 15px;
  img {
    width: 70px; height: 70px; border-radius: 10px; cursor: pointer;
    border: 2px solid transparent;
    &:hover { border-color: ${accent}; }
  }
`;
const Desc = styled.p`color: #555; margin: 15px 0;`;
const Qty = styled.div`display: flex; align-items: center; gap: 15px; margin: 20px 0;`;
const QtyBtn = styled.button`
  width: 40px; height: 40px; border-radius: 10px; border: 1px solid #ddd;
  font-size: 20px; background: white; cursor: pointer;
`;
const AddBtn = styled(motion.button)`
  width: 100%; padding: 12px; border-radius: 16px; border: none;
  background: ${accent}; color: white; font-size: 1rem; margin-top: 10px;
`;
const Ribbon = styled.div`
  position: absolute; top: 15px; left: -40px; background: red;
  color: white; padding: 6px 50px; transform: rotate(-45deg); font-size: .8rem;
`;
const RecoGrid = styled.div`margin-top: 70px;`;
const RecoCards = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill,minmax(220px,1fr));
  gap: 25px; margin-top: 25px;
`;
const RecoCard = styled(motion.div)`
  background: white; border-radius: 18px; padding: 15px; text-align: center;
  position: relative; box-shadow: 0 8px 25px rgba(0,0,0,.08);
  img { width: 100%; height: 170px; object-fit: contain; border-radius: 12px; }
`;
const Price = styled.div`font-size: 1rem; font-weight: 600; color: blue; margin-top: 8px;
  span { font-size: .8rem; color: #dc3545; margin-left: 4px; }
`;
const Title = styled.h3`font-size: .95rem; font-weight: 500; color: #111; margin: 8px 0;`;

/* ================= COMPONENT ================= */

export default function ProductPage({ product, recommended }) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);
  const imgRef = useRef(null);
  const recoImgRefs = useRef({});

  const [mainImage, setMainImage] = useState(product.images?.[0]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setMainImage(product.images?.[0]);
    setQty(1);
  }, [product._id]);

  const outOfStock = product.stock === 0;
  const colorVariants = product?.properties?.colorVariants || [];
  const hasColors = colorVariants.length > 0;

  const defaultVariant = hasColors ? colorVariants.find(v => !v.outOfStock) : null;
  const currentVariant = defaultVariant;

  const isRupture = outOfStock || (hasColors && currentVariant?.outOfStock);
  const canAddToCart = !outOfStock && (!hasColors || currentVariant);

  /* ===== ADD TO CART ===== */
  const addToCart = (prod, imgEl) => {
    if (!canAddToCart) return;

    let imageToAdd = prod.images?.[0]; // default image
    let colorToAdd = null;

    const prodColorVariants = prod?.properties?.colorVariants || [];
    const hasColors = prodColorVariants.length > 0;

    if (hasColors) {
      if (currentVariant) {
        // if color selected or default available
        imageToAdd = currentVariant.imageUrl || prod.images[0];
        colorToAdd = currentVariant.color;
      } else {
        // if no color selected, take variant without color
        const variantWithoutColor = prodColorVariants.find(v => !v.color);
        if (variantWithoutColor) {
          imageToAdd = variantWithoutColor.imageUrl;
        } else {
          imageToAdd = prod.images[0];
        }
      }
    }

    if (imgEl) triggerFlyAnimation(imgEl, imgEl.getBoundingClientRect());

    addProduct({
      _id: prod._id,
      color: colorToAdd,
      image: imageToAdd,
      qty,
    });
  };

  return (
    <Page>
      <Header />
      <Center>
        <Grid>

          <Box initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            {isRupture && <Ribbon>RUPTURE</Ribbon>}

            <ImgWrapper ref={imgRef}>
              <MainImg src={mainImage} />
            </ImgWrapper>

            <Thumbs>
              {product.images.map((img, i) => (
                <img key={i} src={img} onClick={() => setMainImage(img)} />
              ))}
            </Thumbs>
          </Box>

          <Box initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}>
            <Title>{product.title}</Title>
            <Desc>{product.description}</Desc>
            <Price>{product.price.toFixed(2)} DT <span>(HT)</span></Price>

            <Qty>
              <QtyBtn onClick={() => setQty(q => Math.max(1, q - 1))}>-</QtyBtn>
              <strong>{qty}</strong>
              <QtyBtn onClick={() => setQty(q => q + 1)}>+</QtyBtn>
            </Qty>

            <AddBtn
              disabled={!canAddToCart}
              style={{ opacity: canAddToCart ? 1 : .5, cursor: canAddToCart ? "pointer" : "not-allowed" }}
              onClick={() => addToCart(product, imgRef.current)}
            >
              {isRupture ? "Produit épuisé" : "Ajouter au panier"}
            </AddBtn>
          </Box>

        </Grid>

        {/* ========== RECOMMENDED ========== */}

        <RecoGrid>
          <h2>Produits recommandés</h2>
          <RecoCards>
            {recommended.map(p => {
              const recoOut = p.stock === 0;
              const recoVariants = p?.properties?.colorVariants || [];
              const recoHasColors = recoVariants.length > 0;
              const recoVariant = recoHasColors ? recoVariants.find(v => !v.outOfStock) : null;
              const recoCanAdd = !recoOut && (!recoHasColors || recoVariant);

              return (
                <RecoCard key={p._id} whileHover={{ y: -10 }}>
                  <Link href={`/product/${p._id}`}>
                    <img ref={(el) => (recoImgRefs.current[p._id] = el)} src={p.images?.[0]} />
                  </Link>
                  <Title>{p.title}</Title>
                  <Price>{p.price.toFixed(2)} DT <span>(HT)</span></Price>
                  <AddBtn
                    disabled={!recoCanAdd}
                    style={{ opacity: recoCanAdd ? 1 : .5, cursor: recoCanAdd ? "pointer" : "not-allowed" }}
                    onClick={() => recoCanAdd && addToCart(p, recoImgRefs.current[p._id])}
                  >
                    Ajouter au panier
                  </AddBtn>
                </RecoCard>
              );
            })}
          </RecoCards>
        </RecoGrid>

      </Center>
      <Footer />
    </Page>
  );
}

/* ================= SERVER ================= */

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
