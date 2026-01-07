"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/components/CartContext";

export default function ProductPage({ params }) {
  const { addProduct } = useCart();
  const imgRef = useRef(null);
  const recoImgRefs = useRef({});

  const [product, setProduct] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [qty, setQty] = useState(1);

  /* ================= FETCH PRODUCT ================= */
  useEffect(() => {
    axios.get(`/api/products?id=${params.id}`).then(res => {
      const p = res.data;
      setProduct(p);

      const variants = p?.properties?.colorVariants || [];
      const firstAvailable = variants.find(v => !v.outOfStock);

      if (firstAvailable) {
        setSelectedColor(firstAvailable.color);
        setMainImage(firstAvailable.imageUrl);
      } else {
        setMainImage(p.images?.[0]);
      }
    });

    axios.get(`/api/products?recommended=true`).then(res => {
      setRecommended(res.data);
    });
  }, [params.id]);

  if (!product) return null;

  /* ================= LOGIC ================= */
  const colorVariants = product?.properties?.colorVariants || [];
  const hasColors = colorVariants.length > 0;

  const currentVariant = hasColors
    ? colorVariants.find(v => v.color === selectedColor)
    : null;

  const isRupture =
    product.stock === 0 ||
    (hasColors && selectedColor && currentVariant?.outOfStock);

  const canAddToCart =
    product.stock > 0 &&
    (!hasColors || (selectedColor && !currentVariant?.outOfStock));

  /* ================= ADD TO CART ================= */
  const addToCart = (prod, imgEl, variant = null) => {
    let image = prod.images?.[0];
    let color = null;

    if (variant) {
      image = variant.imageUrl || image;
      color = variant.color;
    }

    addProduct({
      _id: prod._id,
      title: prod.title,
      price: prod.price,
      image,
      color,
      qty,
    });
  };

  /* ================= UI ================= */
  return (
    <div className="product-page">
      <div className="grid">
        {/* IMAGE */}
        <img
          ref={imgRef}
          src={mainImage}
          className="main-img"
        />

        {/* INFO */}
        <div>
          <h1>{product.title}</h1>
          <p>{product.description}</p>
          <h3>{product.price} DT</h3>

          {/* COLORS */}
          {hasColors && (
            <div className="colors">
              {colorVariants.map(v => (
                <button
                  key={v._id}
                  onClick={() => {
                    if (v.outOfStock) return;
                    setSelectedColor(v.color);
                    if (v.imageUrl) setMainImage(v.imageUrl);
                  }}
                  className={`color ${
                    selectedColor === v.color ? "active" : ""
                  }`}
                  style={{
                    background: v.color,
                    opacity: v.outOfStock ? 0.4 : 1,
                  }}
                >
                  {v.outOfStock && <span className="bar" />}
                </button>
              ))}
            </div>
          )}

          {/* QTY */}
          <input
            type="number"
            min={1}
            value={qty}
            onChange={e => setQty(Number(e.target.value))}
          />

          {/* ADD */}
          <button
            disabled={!canAddToCart}
            onClick={() =>
              addToCart(product, imgRef.current, currentVariant)
            }
          >
            {isRupture ? "Rupture" : "Ajouter au panier"}
          </button>
        </div>
      </div>

      {/* ================= RECOMMENDED ================= */}
      <h2>Produits recommandés</h2>

      <div className="reco-grid">
        {recommended.map(p => {
          const variants = p?.properties?.colorVariants || [];
          const hasColors = variants.length > 0;

          const defaultVariant = hasColors
            ? variants.find(v => !v.outOfStock)
            : null;

          const isRupture =
            p.stock === 0 || (hasColors && !defaultVariant);

          const canAdd =
            p.stock > 0 && (!hasColors || defaultVariant);

          const image =
            defaultVariant?.imageUrl || p.images?.[0];

          return (
            <motion.div key={p._id} whileHover={{ y: -5 }}>
              {isRupture && <span className="ribbon">RUPTURE</span>}

              <Link href={`/product/${p._id}`}>
                <img
                  ref={el => (recoImgRefs.current[p._id] = el)}
                  src={image}
                />
              </Link>

              <h4>{p.title}</h4>
              <p>{p.price} DT</p>

              <button
                disabled={!canAdd}
                onClick={() =>
                  canAdd &&
                  addToCart(
                    p,
                    recoImgRefs.current[p._id],
                    defaultVariant
                  )
                }
              >
                Ajouter au panier
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
