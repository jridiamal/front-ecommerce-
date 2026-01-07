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

/* ================= UTILS ================= */

function resolveVariant(product, selectedColor = null) {
  const variants = product?.properties?.colorVariants || [];
  const hasColors = variants.length > 0;

  if (!hasColors) {
    return {
      variant: null,
      image: product.images?.[0],
      canAdd: product.stock > 0,
      isRupture: product.stock === 0,
    };
  }

  let variant = selectedColor
    ? variants.find(v => v.color === selectedColor)
    : variants.find(v => !v.outOfStock);

  if (!variant || variant.outOfStock) {
    return {
      variant: null,
      image: product.images?.[0],
      canAdd: false,
      isRupture: true,
    };
  }

  return {
    variant,
    image: variant.imageUrl || product.images?.[0],
    canAdd: true,
    isRupture: false,
  };
}

/* ================= STYLES ================= */

const Page = styled.div`background:#f9fafb;min-height:100vh;`;
const Grid = styled.div`
  display:grid;gap:50px;margin-top:50px;
  @media(min-width:900px){grid-template-columns:1.1fr 1fr;}
`;
const Box = styled(motion.div)`
  background:white;border-radius:20px;padding:25px;
  box-shadow:0 12px 30px rgba(0,0,0,.08);position:relative;
`;
const ImgWrapper = styled.div`overflow:hidden;border-radius:18px;`;
const MainImg = styled.img`width:100%;height:420px;object-fit:contain;`;
const Thumbs = styled.div`
  display:flex;gap:10px;margin-top:15px;
  img{width:70px;height:70px;border-radius:10px;cursor:pointer;}
`;
const AddBtn = styled.button`
  width:100%;padding:12px;border-radius:16px;border:none;
  background:#5542F6;color:white;font-size:1rem;margin-top:10px;
`;
const Ribbon = styled.div`
  position:absolute;top:15px;left:-40px;background:red;color:white;
  padding:6px 50px;transform:rotate(-45deg);font-size:.8rem;
`;

/* ================= COMPONENT ================= */

export default function ProductPage({ product, recommended }) {
  const { addProduct } = useContext(CartContext);
  const { triggerFlyAnimation } = useContext(AnimationContext);

  const imgRef = useRef(null);
  const recoImgRefs = useRef({});

  const [selectedColor, setSelectedColor] = useState(null);
  const [mainImage, setMainImage] = useState(product.images?.[0]);
  const [qty, setQty] = useState(1);

  const { variant, image, canAdd, isRupture } =
    resolveVariant(product, selectedColor);

  useEffect(() => {
    setMainImage(image);
  }, [image]);

  function addToCart(prod, imgEl, variant, qty = 1) {
    if (!variant && prod.properties?.colorVariants?.length) return;

    if (imgEl) {
      triggerFlyAnimation(imgEl, imgEl.getBoundingClientRect());
    }

    addProduct({
      _id: prod._id,
      title: prod.title,
      price: prod.price,
      image: variant?.imageUrl || prod.images[0],
      color: variant?.color || null,
      colorId: variant?._id || null,
      qty,
    });
  }

  return (
    <Page>
      <Header />
      <Center>

        <Grid>
          <Box>
            {isRupture && <Ribbon>RUPTURE</Ribbon>}
            <ImgWrapper ref={imgRef}>
              <MainImg src={mainImage} />
            </ImgWrapper>

            <Thumbs>
              {product.images.map((img,i)=>(
                <img key={i} src={img} onClick={()=>setMainImage(img)} />
              ))}
            </Thumbs>
          </Box>

          <Box>
            <h2>{product.title}</h2>
            <p>{product.description}</p>
            <strong>{product.price} DT</strong>

            {product.properties?.colorVariants?.length > 0 && (
              <div style={{display:"flex",gap:10,marginTop:15}}>
                {product.properties.colorVariants.map(v=>(
                  <button
                    key={v._id}
                    disabled={v.outOfStock}
                    onClick={()=>setSelectedColor(v.color)}
                    style={{
                      width:20,height:20,borderRadius:"50%",
                      background:v.color,
                      opacity:v.outOfStock?.5:1
                    }}
                  />
                ))}
              </div>
            )}

            <AddBtn
              disabled={!canAdd}
              onClick={() =>
                addToCart(product, imgRef.current, variant, qty)
              }
            >
              {isRupture ? "Produit épuisé" : "Ajouter au panier"}
            </AddBtn>
          </Box>
        </Grid>

        {/* ========== RECOMMENDED ========== */}

        <h2 style={{marginTop:60}}>Produits recommandés</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:25}}>
          {recommended.map(p=>{
            const r = resolveVariant(p);

            return (
              <div key={p._id}>
                {r.isRupture && <Ribbon>RUPTURE</Ribbon>}
                <Link href={`/product/${p._id}`}>
                  <img
                    ref={el=>recoImgRefs.current[p._id]=el}
                    src={r.image}
                    style={{width:"100%",height:180,objectFit:"contain"}}
                  />
                </Link>
                <h4>{p.title}</h4>
                <p>{p.price} DT</p>
                <AddBtn
                  disabled={!r.canAdd}
                  onClick={()=>addToCart(p,recoImgRefs.current[p._id],r.variant,1)}
                >
                  Ajouter
                </AddBtn>
              </div>
            );
          })}
        </div>

      </Center>
      <Footer />
    </Page>
  );
}

/* ================= SERVER ================= */

export async function getServerSideProps({ query }) {
  await mongooseConnect();
  const product = await Product.findById(query.id).lean();
  const recommended = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
  }).limit(6);

  return {
    props: {
      product: JSON.parse(JSON.stringify(product)),
      recommended: JSON.parse(JSON.stringify(recommended)),
    },
  };
}
