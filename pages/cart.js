'use client';

import React, { useState, useEffect, useContext } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Center from "@/components/Center";
import styled, { keyframes } from "styled-components";
import Table from "@/components/Table";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { CartContext } from "@/components/CartContext";
import axios from "axios";

// Palette de couleurs modernisée
const ACCENT_COLOR = "#2563eb"; // Un bleu plus vibrant et pro
const BG_SOFT = "#f8fafc";
const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";

// --- Styled Components ---

const ColumnsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  margin: 40px 0;
  margin-top: 60px;
  @media(min-width: 768px){
    grid-template-columns: 1.5fr 0.8fr;
  }
`;

const Box = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 30px;
  color: ${TEXT_DARK};
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.02em;
`;

const StyledTable = styled(Table)`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  th {
    text-align: left;
    text-transform: uppercase;
    font-weight: 700;
    font-size: 0.75rem;
    color: ${TEXT_MUTED};
    padding: 0 0 15px 0;
    letter-spacing: 0.05em;
  }
  td {
    padding: 20px 0;
    border-top: 1px solid #f1f5f9;
  }
`;

const ProductInfoCell = styled.td`
  display: flex;
  align-items: center;
  gap: 20px;
  font-weight: 600;
  color: ${TEXT_DARK};
`;

const ColorIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  color: ${TEXT_MUTED};
  margin-top: 6px;
  div {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    border: 1px solid rgba(0,0,0,0.1);
    background-color: ${props => props.color};
  }
`;

const ProductImageBox = styled.div`
  width: 90px;
  height: 90px;
  padding: 8px;
  border: 1px solid #f1f5f9;
  border-radius: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.05);
  }
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  width: fit-content;
`;

const QuantityButton = styled.button`
  background-color: #fff;
  color: ${TEXT_DARK};
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  &:hover { 
    background-color: ${ACCENT_COLOR}; 
    color: white;
  }
`;

const QuantityLabel = styled.span`
  padding: 0 15px;
  font-weight: 700;
  min-width: 35px;
  text-align: center;
  color: ${TEXT_DARK};
`;

const StyledInput = styled(Input)`
  margin-bottom: 15px;
  padding: 14px 18px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  &:focus { 
    border-color: ${ACCENT_COLOR};
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    outline: none;
  }
`;

const TotalSummary = styled.div`
  border-top: 2px dashed #f1f5f9;
  margin-top: 30px;
  padding-top: 25px;
  .grand-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.4rem;
    font-weight: 800;
    color: ${TEXT_DARK};
    span:last-child {
        color: ${ACCENT_COLOR};
    }
  }
`;

const PaymentButton = styled(Button)`
  background-color: ${ACCENT_COLOR};
  color: white;
  width: 100%;
  padding: 18px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 14px;
  margin-top: 25px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
  &:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 15px 20px -3px rgba(37, 99, 235, 0.4);
  }
  &:disabled {
    background-color: #cbd5e1;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const fadeInOut = keyframes`
  0% { opacity: 0; transform: translateY(20px) scale(0.95); }
  10% { opacity: 1; transform: translateY(0) scale(1); }
  90% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(20px) scale(0.95); }
`;

const ToastBox = styled.div`
  position: fixed;
  bottom: 30px; /* Changé vers le bas pour une UX plus mobile-friendly */
  right: 30px;
  min-width: 300px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  font-weight: 600;
  color: ${TEXT_DARK};
  animation: ${fadeInOut} 4s forwards;
  z-index: 9999;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-left: 5px solid ${({ type }) => type === "success" ? "#10b981" : "#ef4444"};
`;

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cartProducts, addProduct, removeProduct, clearCart } = useContext(CartContext);

  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [country] = useState("Tunisie");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if(status === "unauthenticated" && router.isReady) router.replace("/account");
  }, [status, router]);

  useEffect(() => {
    if(session?.user?.email) setEmail(session.user.email);
  }, [session]);

  useEffect(() => {
    if(cartProducts.length > 0){
      const ids = cartProducts.map(p => typeof p === 'string' ? p : p._id);
      axios.post("/api/cart", { ids: [...new Set(ids)] })
        .then(res => setProducts(res.data));
    } else setProducts([]);
  }, [cartProducts]);

  function showToast(message, type="success"){
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const groupedCart = cartProducts.reduce((acc, cartItem) => {
    const id = typeof cartItem === 'string' ? cartItem : cartItem._id;
    const color = cartItem.color || 'default';
    const key = `${id}-${color}`;
    if (!acc[key]) {
      acc[key] = { ...cartItem, _id: id, quantity: 0 };
    }
    acc[key].quantity += 1;
    return acc;
  }, {});

  const groupedItems = Object.values(groupedCart);

  function moreOfThisProduct(cartItem) {
    addProduct(cartItem);
  }

  function lessOfThisProduct(cartItem) {
    removeProduct(cartItem);
  }

  let total = 0;
  for (const cartItem of cartProducts) {
    const id = typeof cartItem === 'string' ? cartItem : cartItem._id;
    const price = products.find(p => p._id === id)?.price || 0;
    total += price;
  }

  async function goToPayment() {
    if(!name || name.length < 3) return showToast("Nom invalide.", "error");
    if(!/^(2|4|5|9)\d{7}$/.test(phone)) return showToast("Numéro de téléphone invalide (8 chiffres).", "error");

    try {
      setIsLoading(true);
      await axios.post("/api/checkout", {
        name, email, phone, streetAddress, country,
        cartProducts,
        paymentMethod: "Paiement à la livraison"
      });
      showToast("Commande confirmée avec succès !", "success");
      clearCart();
    } catch (err) {
      showToast("Erreur lors de la commande.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  if(status === "loading") return (
    <Center>
        <div style={{display:'flex', justifyContent:'center', padding:'100px', fontWeight:'600', color:TEXT_MUTED}}>
            Chargement de votre panier...
        </div>
    </Center>
  );

  return (
    <>
      <Header />
      <Center>
        <ColumnsWrapper>
          <Box>
            <Title>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
               Votre Panier
            </Title>
            {!cartProducts.length ? (
              <div style={{color: TEXT_MUTED, textAlign: 'center', padding: '40px 0'}}>
                <p style={{fontSize:'1.1rem'}}>Votre panier est actuellement vide.</p>
              </div>
            ) : (
              <StyledTable>
                <thead><tr><th>Produit</th><th>Quantité</th><th>Total</th></tr></thead>
                <tbody>
                  {groupedItems.map((item, idx) => {
                    const product = products.find(p => p._id === item._id);
                    const colorVariant = product?.properties?.colorVariants?.find(v => v.color === item.color);
                    const displayImage = colorVariant ? colorVariant.imageUrl : product?.images?.[0];
                    
                    return (
                      <tr key={idx}>
                        <ProductInfoCell>
                          <ProductImageBox><img src={displayImage} alt=""/></ProductImageBox>
                          <div>
                            <div style={{marginBottom: '2px'}}>{product?.title}</div>
                            {item.color && item.color !== 'default' && (
                              <ColorIndicator color={item.color}><div />{item.color}</ColorIndicator>
                            )}
                          </div>
                        </ProductInfoCell>
                        <td>
                          <QuantityControls>
                            <QuantityButton onClick={() => lessOfThisProduct(item)}>-</QuantityButton>
                            <QuantityLabel>{item.quantity}</QuantityLabel>
                            <QuantityButton onClick={() => moreOfThisProduct(item)}>+</QuantityButton>
                          </QuantityControls>
                        </td>
                        <td style={{fontWeight: 700, color: TEXT_DARK, fontSize: '1.05rem'}}>
                          {((product?.price || 0) * item.quantity).toLocaleString()} TND
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </StyledTable>
            )}
            {cartProducts.length > 0 && (
              <TotalSummary>
                <div className="grand-total">
                  <span>Total à payer</span>
                  <span>{total.toLocaleString()} TND</span>
                </div>
              </TotalSummary>
            )}
          </Box>

          {cartProducts.length > 0 && (
            <Box>
              <Title>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polyline points="16 8 20 8 23 11 23 16 16 16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Livraison
              </Title>
              <StyledInput placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} />
              <StyledInput value={email} readOnly style={{background:'#f1f5f9', color: TEXT_MUTED, cursor: 'not-allowed'}}/>
              <StyledInput placeholder="Téléphone (ex: 20123456)" value={phone} onChange={e => setPhone(e.target.value)} />
              <StyledInput placeholder="Adresse de livraison exacte" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} />
              <PaymentButton disabled={isLoading} onClick={goToPayment}>
                {isLoading ? "Traitement en cours..." : "Confirmer ma commande"}
              </PaymentButton>
            
            </Box>
          )}
        </ColumnsWrapper>
      </Center>
      {toast && <ToastBox type={toast.type}>{toast.message}</ToastBox>}
    </>
  );
}