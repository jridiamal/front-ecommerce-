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

const ACCENT_COLOR = "#2563eb"; 
const BG_SOFT = "#f8fafc";
const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";

const ColumnsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin: 20px 0;
  margin-top: 40px;
  background-color: #f5f5f7;

  @media(min-width: 768px){
    grid-template-columns: 1.5fr 0.8fr;
    gap: 30px;
    margin-top: 60px;
  }
`;

const Box = styled.div`
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  @media(min-width: 768px){
    padding: 40px;
  }
`;

const Title = styled.h2`
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 20px;
  color: ${TEXT_DARK};
  display: flex;
  align-items: center;
  gap: 12px;
  @media(min-width: 768px){
    font-size: 1.5rem;
    margin-bottom: 30px;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  thead {
    display: none;
  }
  tr {
    display: flex;
    flex-direction: column;
    padding: 15px 0;
    border-bottom: 1px solid #f1f5f9;
  }
  td {
    display: block;
    padding: 5px 0;
  }
  @media(min-width: 768px) {
    display: table;
    thead { display: table-header-group; }
    tr { display: table-row; padding: 0; }
    td { 
      display: table-cell; 
      padding: 20px 0; 
      border-top: 1px solid #f1f5f9;
    }
    th {
      display: table-cell;
      text-align: left;
      text-transform: uppercase;
      font-weight: 700;
      font-size: 0.75rem;
      color: ${TEXT_MUTED};
      padding: 0 0 15px 0;
    }
  }
`;

const ProductInfoCell = styled.td`
  display: flex !important;
  align-items: center;
  gap: 15px;
  font-weight: 600;
  color: ${TEXT_DARK};
  @media(min-width: 768px) {
    gap: 20px;
  }
`;

const MobileFlexRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 10px;
  @media(min-width: 768px) {
    display: contents;
  }
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
  width: 70px;
  height: 70px;
  padding: 8px;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  @media(min-width: 768px){
    width: 90px;
    height: 90px;
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
  transition: all 0.2s ease;
  &:hover { 
    background-color: ${ACCENT_COLOR}; 
    color: white;
  }
`;

const QuantityLabel = styled.span`
  padding: 0 12px;
  font-weight: 700;
  min-width: 30px;
  text-align: center;
  color: ${TEXT_DARK};
`;

const StyledInput = styled(Input)`
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  &:focus { 
    border-color: ${ACCENT_COLOR};
    outline: none;
  }
  @media(min-width: 768px){
    font-size: 0.95rem;
  }
`;

const TotalSummary = styled.div`
  border-top: 2px dashed #f1f5f9;
  margin-top: 25px;
  padding-top: 20px;
  .grand-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.2rem;
    font-weight: 800;
    color: ${TEXT_DARK};
    span:last-child { color: ${ACCENT_COLOR}; }
  }
  @media(min-width: 768px){
    font-size: 1.4rem;
  }
`;

const PaymentButton = styled(Button)`
  background-color: ${ACCENT_COLOR};
  color: white;
  width: 100%;
  padding: 16px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 14px;
  margin-top: 20px;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
  &:disabled {
    background-color: #cbd5e1;
    cursor: not-allowed;
  }
`;

const fadeInOut = keyframes`
  0% { opacity: 0; transform: translateY(20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(20px); }
`;

const ToastBox = styled.div`
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  font-weight: 600;
  z-index: 9999;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-left: 5px solid ${({ type }) => type === "success" ? "#10b981" : "#ef4444"};
  animation: ${fadeInOut} 4s forwards;
  @media(min-width: 768px){
    width: fit-content;
    left: auto;
    right: 30px;
    min-width: 300px;
  }
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

 const groupedCart = cartProducts.reduce((acc, cartItem) => {
  const id = cartItem._id;
  const color = cartItem.color || "default";
  const colorId = cartItem.colorId;        // ⭐

  const key = `${id}-${colorId || "default"}`;

  if (!acc[key]) {
    acc[key] = {
      _id: id,
      color,
      colorId,                             // ⭐
      quantity: 0
    };
  }

  acc[key].quantity += 1;
  return acc;
}, {});


  const groupedItems = Object.values(groupedCart);

  let total = 0;
  for (const cartItem of cartProducts) {
    const id = typeof cartItem === 'string' ? cartItem : cartItem._id;
    const price = products.find(p => p._id === id)?.price || 0;
    total += price;
  }

  async function goToPayment() {
    if(!name || name.length < 3) return setToast({message: "Nom invalide.", type: "error"});
    if(!/^(2|4|5|9)\d{7}$/.test(phone)) return setToast({message: "Téléphone invalide.", type: "error"});

    try {
      setIsLoading(true);
     const checkoutCart = groupedItems.map(item => ({
  _id: item._id,
  colorId: item.colorId,
    color: item.color,      
  quantity: item.quantity
}));


      await axios.post("/api/checkout", {
        name, email, phone, streetAddress,
        country: "Tunisie",
        cartProducts: checkoutCart,
        paymentMethod: "Paiement à la livraison"
      });

      setToast({message: "Commande confirmée !", type: "success"});
      clearCart();
    } catch (err) {
      setToast({message: "Erreur lors de la commande.", type: "error"});
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  if(status === "loading") return <Center><div style={{padding:'100px', textAlign:'center'}}>Chargement...</div></Center>;

  return (
    <>
      <Header />
      <Center>
        <ColumnsWrapper>
          <Box>
            <Title>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
               Votre Panier
            </Title>
            {!cartProducts.length ? (
              <div style={{color: TEXT_MUTED, textAlign: 'center', padding: '40px 0'}}>Panier vide</div>
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
                            <div style={{fontSize: '0.9rem'}}>{product?.title}</div>
                            {item.color && item.color !== 'default' && (
                              <ColorIndicator color={item.color}><div />{item.color}</ColorIndicator>
                            )}
                          </div>
                        </ProductInfoCell>
                        <td>
                          <MobileFlexRow>
                            <QuantityControls>
                              <QuantityButton onClick={() => removeProduct(item)}>-</QuantityButton>
                              <QuantityLabel>{item.quantity}</QuantityLabel>
                              <QuantityButton onClick={() => addProduct(item)}>+</QuantityButton>
                            </QuantityControls>
                            <div style={{fontWeight: 700}}>
                              {((product?.price || 0) * item.quantity).toLocaleString()} TND
                            </div>
                          </MobileFlexRow>
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
                  <span>Total</span>
                  <span>{total.toLocaleString()} TND</span>
                </div>
              </TotalSummary>
            )}
          </Box>
          {cartProducts.length > 0 && (
            <Box>
              <Title>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polyline points="16 8 20 8 23 11 23 16 16 16"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Livraison
              </Title>
              <StyledInput placeholder="Nom complet" value={name} onChange={e => setName(e.target.value)} />
              <StyledInput value={email} readOnly style={{background:'#f1f5f9'}}/>
              <StyledInput placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} />
              <StyledInput placeholder="Adresse exacte" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} />
              <PaymentButton disabled={isLoading} onClick={goToPayment}>
                {isLoading ? "En cours..." : "Confirmer"}
              </PaymentButton>
            </Box>
          )}
        </ColumnsWrapper>
      </Center>
      {toast && <ToastBox type={toast.type}>{toast.message}</ToastBox>}
    </>
  );
}