'use client';

import React, { useState, useEffect, useContext } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Center from "@/components/Center";
import styled from "styled-components";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { CartContext } from "@/components/CartContext";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ColumnsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  margin-top: 40px;
  
  @media (min-width: 768px) {
    grid-template-columns: 1.2fr 0.8fr;
  }
`;

const Box = styled.div`
  background-color: #fff;
  border-radius: 10px;
  padding: 30px;
`;

const ProductInfoCell = styled.td`
  padding: 10px 0;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ProductImageBox = styled.div`
  width: 100px;
  height: 100px;
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  
  img {
    max-width: 80px;
    max-height: 80px;
  }
`;

const QuantityLabel = styled.span`
  padding: 0 15px;
  display: block;
`;

const CityHolder = styled.div`
  display: flex;
  gap: 5px;
`;

const StyledTable = styled.table`
  width: 100%;
  
  th {
    text-align: left;
    text-transform: uppercase;
    color: #aaa;
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  td {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
`;

export default function CartPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { cartProducts, addProduct, removeProduct, clearCart } = useContext(CartContext);
  
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/account");
    }
  }, [status, router]);
  
  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session]);
  
  useEffect(() => {
    if (cartProducts.length > 0) {
      axios.post('/api/cart', { ids: cartProducts })
        .then(response => {
          setProducts(response.data);
        });
    } else {
      setProducts([]);
    }
  }, [cartProducts]);
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (window?.location.href.includes('success')) {
      setIsSuccess(true);
      clearCart();
    }
  }, [clearCart]);
  
  function moreOfThisProduct(id) {
    addProduct(id);
  }
  
  function lessOfThisProduct(id) {
    removeProduct(id);
  }
  
  async function goToPayment() {
    // Validation simple
    if (!name || !email || !phone || !streetAddress) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    if (cartProducts.length === 0) {
      toast.error("Votre panier est vide");
      return;
    }
    
    try {
      // Préparer les données de la commande
      const checkoutCart = cartProducts.map(item => ({
        _id: typeof item === 'string' ? item : item._id,
        colorId: item.colorId,
        color: item.color,
        quantity: 1
      }));
      
      // Appeler l'API checkout
      const response = await axios.post('/api/checkout', {
        name,
        email,
        phone,
        streetAddress,
        country: country || 'Tunisie',
        cartProducts: checkoutCart,
        paymentMethod: 'Paiement à la livraison'
      });
      
      if (response.data.success) {
        // Succès - vider le panier et afficher message
        toast.success("✅ Commande confirmée avec succès !");
        clearCart();
        
        // Réinitialiser le formulaire
        setName('');
        setPhone('');
        setStreetAddress('');
        setCity('');
        setPostalCode('');
        setCountry('');
        
        // Rediriger vers la page de compte après 2 secondes
        setTimeout(() => {
          router.push('/account');
        }, 2000);
      } else {
        throw new Error(response.data.error || 'Erreur lors de la commande');
      }
      
    } catch (error) {
      console.error('Erreur checkout:', error);
      toast.error(error.response?.data?.error || 'Erreur lors de la commande. Veuillez réessayer.');
    }
  }
  
  let total = 0;
  for (const productId of cartProducts) {
    const price = products.find(p => p._id === productId)?.price || 0;
    total += price;
  }
  
  if (isSuccess) {
    return (
      <>
        <Header />
        <Center>
          <ColumnsWrapper>
            <Box>
              <h1>Merci pour votre commande !</h1>
              <p>Nous vous contacterons dans les plus brefs délais.</p>
            </Box>
          </ColumnsWrapper>
        </Center>
      </>
    );
  }
  
  return (
    <>
      <Header />
      <Center>
        <ColumnsWrapper>
          <Box>
            <h2>Panier</h2>
            {!cartProducts?.length && (
              <div>Votre panier est vide</div>
            )}
            {products?.length > 0 && (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Quantité</th>
                    <th>Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const amount = cartProducts.filter(id => id === product._id).length;
                    return (
                      <tr key={product._id}>
                        <ProductInfoCell>
                          <ProductImageBox>
                            <img src={product.images?.[0]} alt={product.title} />
                          </ProductImageBox>
                          <div>
                            {product.title}
                          </div>
                        </ProductInfoCell>
                        <td>
                          <button
                            onClick={() => lessOfThisProduct(product._id)}
                            style={{ padding: '0 10px' }}
                          >
                            -
                          </button>
                          <QuantityLabel>{amount}</QuantityLabel>
                          <button
                            onClick={() => moreOfThisProduct(product._id)}
                            style={{ padding: '0 10px' }}
                          >
                            +
                          </button>
                        </td>
                        <td>
                          {amount * product.price} DT
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td></td>
                    <td></td>
                    <td>
                      <strong>Total: {total} DT</strong>
                    </td>
                  </tr>
                </tbody>
              </StyledTable>
            )}
          </Box>
          
          {!!cartProducts?.length && (
            <Box>
              <h2>Informations de commande</h2>
              <Input
                type="text"
                placeholder="Nom complet"
                value={name}
                name="name"
                onChange={ev => setName(ev.target.value)}
              />
              <Input
                type="text"
                placeholder="Email"
                value={email}
                name="email"
                onChange={ev => setEmail(ev.target.value)}
              />
              <Input
                type="tel"
                placeholder="Téléphone"
                value={phone}
                name="phone"
                onChange={ev => setPhone(ev.target.value)}
              />
              <Input
                type="text"
                placeholder="Adresse"
                value={streetAddress}
                name="streetAddress"
                onChange={ev => setStreetAddress(ev.target.value)}
              />
              <CityHolder>
                <Input
                  type="text"
                  placeholder="Code postal"
                  value={postalCode}
                  name="postalCode"
                  onChange={ev => setPostalCode(ev.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Ville"
                  value={city}
                  name="city"
                  onChange={ev => setCity(ev.target.value)}
                />
              </CityHolder>
              <Input
                type="text"
                placeholder="Pays"
                value={country}
                name="country"
                onChange={ev => setCountry(ev.target.value)}
              />
              <Button black block onClick={goToPayment}>
                Passer la commande
              </Button>
            </Box>
          )}
        </ColumnsWrapper>
        <ToastContainer position="bottom-right" />
      </Center>
    </>
  );
}