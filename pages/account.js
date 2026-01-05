"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useSession, signIn, signOut } from "next-auth/react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

// (Définition des styled components comme ton code initial)

// ===== Component =====
export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if(status === "authenticated") {
      // Fetch commandes
      fetch('/api/orders')
        .then(res => res.json())
        .then(data => Array.isArray(data) && setOrders(data))
        .catch(err => console.error(err));

      // Fetch wishlist
      fetch('/api/wishlist')
        .then(res => res.json())
        .then(data => Array.isArray(data) && setWishlist(data))
        .catch(err => console.error(err));
    }
  }, [session, status]);

  const handleCancelOrder = async (orderId) => {
    if(!window.confirm("Voulez-vous vraiment annuler cette commande ?")) return;
    try{
      const res = await fetch("/api/orders", {
        method:"DELETE",
        headers:{ "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if(res.ok){
        toast.success(data.message);
        setOrders(orders.map(o => o._id === orderId ? {...o, status:"Annulée"} : o));
      }else toast.error(data.error);
    }catch(err){ toast.error("Erreur serveur !"); console.error(err);}
  };

  if(status === "loading") return (
    <>
      <Header/>
      <Container><p>Chargement...</p></Container>
    </>
  );

  if(!session) return (
    <>
      <Header/>
      <Container>
        <Card>
          <h2>Connexion à votre compte</h2>
          <GoogleButton onClick={()=>signIn("google",{ callbackUrl:"/account" })}>
            <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" style={{width:20}}/>
            <span>Se connecter avec Google</span>
          </GoogleButton>
        </Card>
      </Container>
    </>
  );

  return (
    <>
      <Header/>
      <Container>
        {/* Avatar + Dropdown */}
        <Card>
          <div style={{display:"flex", alignItems:"center", gap:"15px", marginBottom:"20px"}}>
            <AvatarWrapper onClick={()=>setIsDropdownOpen(!isDropdownOpen)}>
              <AvatarImage src={session.user?.image || "/default-avatar.png"} alt="Avatar" active={isDropdownOpen}/>
              {isDropdownOpen && (
                <DropdownMenu>
                  <p>Connecté en tant que <b>{session.user?.email}</b></p>
                  <LogoutButton onClick={()=>signOut({callbackUrl:"/account"})}>Se déconnecter</LogoutButton>
                </DropdownMenu>
              )}
            </AvatarWrapper>
            <div>
              <h2 style={{margin:0}}>Bienvenue, {session.user?.name}</h2>
              <p style={{fontSize:"14px", color:"#6b7280", margin:0}}>Gérez votre profil et vos commandes</p>
            </div>
          </div>
        </Card>

        {/* Wishlist */}
        <Card>
          {(!wishlist || wishlist.length===0) ? <p>Vous n&apos;avez pas encore de favoris.</p> :
            <WishlistGrid>
              {wishlist.map(w => w.product && (
                <Link href={`/product/${w.product._id}`} key={w._id} style={{textDecoration:'none', color:'inherit'}}>
                  <WishItem>
                    <img src={w.product.images?.[0]} alt={w.product.title}/>
                    <p>{w.product.title}</p>
                  </WishItem>
                </Link>
              ))}
            </WishlistGrid>
          }
        </Card>

        {/* Orders */}
        <Card>
          <h3>📦 Historique des Commandes</h3>
          {orders.length===0 ? <p>Vous n&apos;avez aucune commande.</p> :
            <OrdersTable>
              <TableHead>
                <TableRow>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Produits & Total</TableHeader>
                </TableRow>
              </TableHead>
              <tbody>
                {orders.map(order => (
                  <TableRow key={order._id}>
                    <TableCell><StatusBadge status={order.status}>{order.status}</StatusBadge></TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <ProductList>
                        {order.line_items.map((item,idx)=>(
                          <ProductItem key={idx}>
                            <ProductImage src={item.image} alt={item.name}/>
                            <ProductText>
                              <p><b>{item.name}</b></p>
                              <p>Qté: {item.quantity} | Total: {(item.price*item.quantity).toFixed(2)} DT</p>
                            </ProductText>
                          </ProductItem>
                        ))}
                      </ProductList>
                      {order.status==="En attente" && (
                        <CancelButton onClick={()=>handleCancelOrder(order._id)}>Annuler la commande</CancelButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </OrdersTable>
          }
        </Card>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false}/>
      </Container>
    </>
  );
}
