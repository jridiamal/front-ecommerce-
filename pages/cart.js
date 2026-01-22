'use client';

import React, { useState, useEffect, useContext } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Center from "@/components/Center";
import styled, { keyframes } from "styled-components";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { CartContext } from "@/components/CartContext";
import axios from "axios";

const ACCENT_COLOR = "#2563eb"; 
const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";

const ColumnsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-top: 40px;
  background-color: #f5f5f7;
  @media(min-width: 768px){
    grid-template-columns: 1.5fr 0.8fr;
    gap: 30px;
    margin-top: 60px;
  }
`;

const Box = styled.div`
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  @media(min-width: 768px){ padding: 40px; }
`;

const Title = styled.h2`
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 20px;
  color: ${TEXT_DARK};
  display: flex;
  align-items: center;
  gap: 12px;
  @media(min-width: 768px){ font-size: 1.5rem; margin-bottom: 30px; }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  thead { display: none; }
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
      vertical-align: middle;
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
  .color-box {
    width: 14px; 
    height: 14px; 
    border-radius: 4px;
    border: 1px solid rgba(0,0,0,0.1);
    background-color: ${props => props.color || '#ccc'};
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
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      background-color: #fff;
      color: ${TEXT_DARK};
    }
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
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  &:read-only {
    background-color: #f8fafc;
    color: #64748b;
    cursor: not-allowed;
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
    span:last-child { 
      color: ${ACCENT_COLOR}; 
      font-size: 1.4rem;
    } 
  }
  .subtotal {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    color: ${TEXT_MUTED};
    font-size: 0.95rem;
  }
`;

const PaymentButton = styled.button`
  background-color: ${ACCENT_COLOR}; 
  color: white; 
  width: 100%; 
  padding: 16px 24px;
  font-size: 1rem; 
  font-weight: 700; 
  border-radius: 14px; 
  margin-top: 20px; 
  border: none; 
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  &:hover:not(:disabled) { 
    background-color: #1d4ed8; 
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
`;

const ToastBox = styled.div`
  position: fixed; 
  bottom: 20px; 
  left: 20px; 
  right: 20px; 
  padding: 16px 20px;
  background: #fff; 
  border-radius: 12px; 
  font-weight: 600; 
  z-index: 9999;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border-left: 5px solid ${({ type }) => type === "success" ? "#10b981" : "#ef4444"};
  display: flex;
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 0.3s ease-out;
  
  &.closing {
    animation: ${fadeOut} 0.3s ease-out forwards;
  }
  
  .toast-icon {
    font-size: 20px;
  }
  
  @media(min-width: 768px){ 
    width: fit-content; 
    left: auto; 
    right: 30px; 
    min-width: 300px; 
    max-width: 400px;
  }
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${TEXT_MUTED};
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 1.1rem;
    margin-bottom: 20px;
  }
  
  .empty-button {
    display: inline-block;
    background: ${ACCENT_COLOR};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    margin-top: 10px;
    transition: background 0.2s;
    
    &:hover {
      background: #1d4ed8;
    }
  }
`;

const ValidationError = styled.div`
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 4px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const LoadingSpinner = styled.div`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 20px;
  margin-top: 20px;
  
  .success-icon {
    font-size: 64px;
    color: #10b981;
    margin-bottom: 20px;
  }
  
  .success-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${TEXT_DARK};
    margin-bottom: 10px;
  }
  
  .success-text {
    color: ${TEXT_MUTED};
    margin-bottom: 20px;
    line-height: 1.6;
  }
  
  .success-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .action-button {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
    
    &.primary {
      background: ${ACCENT_COLOR};
      color: white;
      border: none;
      
      &:hover {
        background: #1d4ed8;
        transform: translateY(-2px);
      }
    }
    
    &.secondary {
      background: white;
      color: ${TEXT_DARK};
      border: 2px solid #e2e8f0;
      
      &:hover {
        border-color: ${ACCENT_COLOR};
        background: #f8fafc;
      }
    }
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
  const [validationErrors, setValidationErrors] = useState({});
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated" && router.isReady) {
      router.push("/account");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session]);

  useEffect(() => {
    if (cartProducts.length > 0) {
      const ids = cartProducts.map(p => typeof p === 'string' ? p : p._id);
      const uniqueIds = [...new Set(ids)];
      
      axios.post("/api/cart", { ids: uniqueIds })
        .then(res => {
          setProducts(res.data);
        })
        .catch(err => {
          console.error("Erreur chargement produits:", err);
          showToast("Erreur lors du chargement des produits", "error");
        });
    } else {
      setProducts([]);
    }
  }, [cartProducts]);

  const showToast = (message, type = "success", duration = 4000) => {
    setToast({ message, type });
    
    setTimeout(() => {
      setToast(prev => {
        if (prev && prev.message === message) {
          return { ...prev, closing: true };
        }
        return prev;
      });
      
      setTimeout(() => {
        setToast(null);
      }, 300);
    }, duration);
  };

  // Grouper les produits du panier
  const groupedCart = cartProducts.reduce((acc, cartItem) => {
    const id = cartItem._id || cartItem;
    const color = cartItem.color || "default";
    const colorId = cartItem.colorId;
    const key = `${id}-${colorId || "default"}`;
    
    if (!acc[key]) {
      acc[key] = { 
        _id: id, 
        color, 
        colorId, 
        quantity: 0,
        itemData: cartItem
      };
    }
    acc[key].quantity += 1;
    return acc;
  }, {});
  
  const groupedItems = Object.values(groupedCart);

  // Calculer le total
  let total = 0;
  let subtotal = 0;
  
  for (const cartItem of cartProducts) {
    const id = typeof cartItem === 'string' ? cartItem : cartItem._id;
    const product = products.find(p => p._id === id);
    const price = product?.price || 0;
    subtotal += price;
  }
  
  total = subtotal;

  const validateForm = () => {
    const errors = {};
    
    if (!name || name.length < 3) {
      errors.name = "Nom invalide (minimum 3 caractères)";
    }
    
    if (!email || !email.includes('@')) {
      errors.email = "Email invalide";
    }
    
    if (!phone || !/^(2|4|5|9)\d{7}$/.test(phone)) {
      errors.phone = "Numéro invalide. Format: 8 chiffres (2,4,5,9)";
    }
    
    if (!streetAddress || streetAddress.length < 5) {
      errors.streetAddress = "Adresse invalide (minimum 5 caractères)";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function goToPayment() {
    // Validation
    if (!validateForm()) {
      showToast("Veuillez corriger les erreurs dans le formulaire", "error");
      return;
    }

    if (cartProducts.length === 0) {
      showToast("Votre panier est vide", "error");
      return;
    }

    try {
      setIsLoading(true);
      
      // Préparer les produits pour le checkout
      const checkoutCart = groupedItems.map(item => ({
        _id: item._id,
        colorId: item.colorId,
        color: item.color,
        quantity: item.quantity
      }));

      console.log("📦 Envoi de la commande:", {
        name,
        email,
        phone,
        streetAddress,
        cartProducts: checkoutCart,
        total
      });

      // Appeler l'API checkout
      const response = await axios.post("/api/checkout", {
        name, 
        email, 
        phone, 
        streetAddress,
        country: "Tunisie",
        cartProducts: checkoutCart,
        paymentMethod: "Paiement à la livraison"
      });

      console.log("✅ Réponse API:", response.data);

      if (response.data.success) {
        // Sauvegarder l'ID de la commande
        setOrderId(response.data.orderId);
        
        // Afficher le message de succès
        setOrderSuccess(true);
        
        // Afficher le toast de succès
        showToast("✅ Commande confirmée avec succès ! Vous recevrez un email de confirmation.", "success", 5000);
        
        // Vider le panier
        clearCart();
        
        // Réinitialiser le formulaire
        setName("");
        setPhone("");
        setStreetAddress("");
        
      } else {
        throw new Error(response.data.error || "Erreur inconnue lors de la commande");
      }

    } catch (err) {
      console.error("❌ ERREUR CHECKOUT:", err.response?.data || err.message);
      
      let message = "Erreur lors de la commande. Veuillez réessayer.";
      
      if (err.response?.data?.error) {
        message = err.response.data.error;
      } else if (err.response?.data?.details) {
        message = `Erreur technique: ${err.response.data.details}`;
      } else if (err.message) {
        message = err.message;
      }
      
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const handleContinueShopping = () => {
    router.push("/products");
  };

  const handleViewOrders = () => {
    router.push("/account");
  };

  if (status === "loading") {
    return (
      <>
        <Header />
        <Center>
          <Box style={{ textAlign: 'center', padding: '100px 20px' }}>
            <div style={{ fontSize: '18px', color: TEXT_MUTED }}>Chargement...</div>
          </Box>
        </Center>
      </>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Header />
      <Center>
        {orderSuccess ? (
          <Box>
            <SuccessMessage>
              <div className="success-icon">🎉</div>
              <div className="success-title">Commande confirmée !</div>
              <div className="success-text">
                Votre commande a été enregistrée avec succès. 
                <br />
                Un email de confirmation vous a été envoyé à <strong>{email}</strong>
                <br />
                {orderId && (
                  <span style={{ display: 'block', marginTop: '10px' }}>
                    <strong>Numéro de commande:</strong> {orderId}
                  </span>
                )}
              </div>
              <div className="success-actions">
                <button 
                  className="action-button primary" 
                  onClick={handleContinueShopping}
                >
                  Continuer mes achats
                </button>
                <button 
                  className="action-button secondary" 
                  onClick={handleViewOrders}
                >
                  Voir mes commandes
                </button>
              </div>
            </SuccessMessage>
          </Box>
        ) : (
          <ColumnsWrapper>
            <Box>
              <Title>
                <span style={{ fontSize: '24px' }}>🛒</span> Votre Panier
              </Title>
              
              {cartProducts.length === 0 ? (
                <EmptyCart>
                  <div className="empty-icon">🛒</div>
                  <div className="empty-text">Votre panier est vide</div>
                  <button 
                    className="empty-button" 
                    onClick={handleContinueShopping}
                  >
                    Découvrir nos produits
                  </button>
                </EmptyCart>
              ) : (
                <>
                  <StyledTable>
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Quantité</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedItems.map((item, idx) => {
                        const product = products.find(p => p._id === item._id);
                        const colorVariant = product?.properties?.colorVariants?.find(v => 
                          v.color === item.color || v._id.toString() === item.colorId
                        );
                        const displayImage = colorVariant?.imageUrl || product?.images?.[0] || "/default-product.jpg";
                        
                        return (
                          <tr key={`${item._id}-${idx}`}>
                            <ProductInfoCell>
                              <ProductImageBox>
                                <img src={displayImage} alt={product?.title || "Produit"} />
                              </ProductImageBox>
                              <div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                                  {product?.title || "Produit"}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: TEXT_MUTED, marginTop: '2px' }}>
                                  Réf: {product?.reference || "N/A"}
                                </div>
                                {item.color && item.color !== 'default' && (
                                  <ColorIndicator color={item.color}>
                                    <div className="color-box" />
                                    <span>{item.color}</span>
                                  </ColorIndicator>
                                )}
                              </div>
                            </ProductInfoCell>
                            <td>
                              <MobileFlexRow>
                                <QuantityControls>
                                  <QuantityButton 
                                    onClick={() => removeProduct(item.itemData || item._id)}
                                    disabled={isLoading}
                                  >
                                    -
                                  </QuantityButton>
                                  <QuantityLabel>{item.quantity}</QuantityLabel>
                                  <QuantityButton 
                                    onClick={() => addProduct(item.itemData || item._id)}
                                    disabled={isLoading}
                                  >
                                    +
                                  </QuantityButton>
                                </QuantityControls>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                  {((product?.price || 0) * item.quantity).toLocaleString()} TND
                                </div>
                              </MobileFlexRow>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </StyledTable>
                  
                  <TotalSummary>
                    <div className="subtotal">
                      <span>Sous-total</span>
                      <span>{subtotal.toLocaleString()} TND</span>
                    </div>
                    <div className="grand-total">
                      <span>Total à payer</span>
                      <span>{total.toLocaleString()} TND</span>
                    </div>
                  </TotalSummary>
                </>
              )}
            </Box>
            
            {cartProducts.length > 0 && (
              <Box>
                <Title>
                  <span style={{ fontSize: '24px' }}>📦</span> Informations de livraison
                </Title>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: TEXT_DARK }}>
                    Nom complet *
                  </label>
                  <StyledInput 
                    placeholder="Votre nom complet" 
                    value={name} 
                    onChange={e => {
                      setName(e.target.value);
                      if (validationErrors.name) {
                        setValidationErrors(prev => ({ ...prev, name: undefined }));
                      }
                    }}
                  />
                  {validationErrors.name && (
                    <ValidationError>
                      ⚠️ {validationErrors.name}
                    </ValidationError>
                  )}
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: TEXT_DARK }}>
                    Email *
                  </label>
                  <StyledInput 
                    value={email} 
                    onChange={e => {
                      setEmail(e.target.value);
                      if (validationErrors.email) {
                        setValidationErrors(prev => ({ ...prev, email: undefined }));
                      }
                    }}
                  />
                  {validationErrors.email && (
                    <ValidationError>
                      ⚠️ {validationErrors.email}
                    </ValidationError>
                  )}
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: TEXT_DARK }}>
                    Téléphone *
                  </label>
                  <StyledInput 
                    placeholder="Ex: 20000000" 
                    value={phone} 
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      if (validationErrors.phone) {
                        setValidationErrors(prev => ({ ...prev, phone: undefined }));
                      }
                    }}
                    maxLength="8"
                  />
                  {validationErrors.phone && (
                    <ValidationError>
                      ⚠️ {validationErrors.phone}
                    </ValidationError>
                  )}
                  <div style={{ fontSize: '0.8rem', color: TEXT_MUTED, marginTop: '4px' }}>
                    Format: 8 chiffres (commence par 2, 4, 5 ou 9)
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: TEXT_DARK }}>
                    Adresse de livraison *
                  </label>
                  <StyledInput 
                    placeholder="Rue, numéro, étage, ville..." 
                    value={streetAddress} 
                    onChange={e => {
                      setStreetAddress(e.target.value);
                      if (validationErrors.streetAddress) {
                        setValidationErrors(prev => ({ ...prev, streetAddress: undefined }));
                      }
                    }}
                  />
                  {validationErrors.streetAddress && (
                    <ValidationError>
                      ⚠️ {validationErrors.streetAddress}
                    </ValidationError>
                  )}
                </div>
                
                <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '10px', color: TEXT_DARK }}>
                    ⚠️ Important
                  </div>
                  <div style={{ fontSize: '0.85rem', color: TEXT_MUTED, lineHeight: 1.5 }}>
                    <p>• Paiement à la livraison uniquement</p>
                    <p>• Livraison dans toute la Tunisie</p>
                    <p>• Vous serez contacté pour confirmer la commande</p>
                  </div>
                </div>
                
                <PaymentButton 
                  onClick={goToPayment} 
                  disabled={isLoading || cartProducts.length === 0}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '20px' }}>✅</span>
                      Confirmer la commande
                    </>
                  )}
                </PaymentButton>
                
                <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.8rem', color: TEXT_MUTED }}>
                  En cliquant, vous acceptez nos conditions de vente
                </div>
              </Box>
            )}
          </ColumnsWrapper>
        )}
      </Center>
      
      {toast && (
        <ToastBox 
          type={toast.type} 
          className={toast.closing ? 'closing' : ''}
        >
          <span className="toast-icon">
            {toast.type === "success" ? "✅" : "❌"}
          </span>
          <span>{toast.message}</span>
        </ToastBox>
      )}
    </>
  );
}