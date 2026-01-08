"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useSession, signIn, signOut } from "next-auth/react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

// ===== Styled Components avec Responsive Design Optimisé =====

const Container = styled.div`
  min-height: calc(100vh - 80px);
  padding: 10px;
  margin-top: 80px;
  background-color: #f8fafc;

  @media (min-width: 768px) {
    padding: 30px;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  max-width: 1000px;
  margin: 0 auto 15px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    padding: 25px;
    margin-bottom: 25px;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 15px;

  @media (min-width: 640px) {
    flex-direction: row;
    text-align: left;
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  z-index: 20;
`;

const AvatarImage = styled.img`
  border-radius: 50%;
  width: 65px;
  height: 65px;
  object-fit: cover;
  border: ${props => (props.active ? "3px solid #2563eb" : "2px solid #e2e8f0")};
  cursor: pointer;
  transition: all 0.2s;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 240px;
  padding: 15px;
  z-index: 100;

  @media (min-width: 640px) {
    left: 0;
    transform: none;
  }
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;

  /* Transformation du tableau pour Mobile */
  @media (max-width: 768px) {
    display: block;
    thead { display: none; }
    tr {
      display: block;
      border: 1px solid #edf2f7;
      border-radius: 10px;
      margin-bottom: 15px;
      padding: 10px;
    }
    td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: none;
      padding: 8px 0;
      font-size: 13px;
      &:not(:last-child) { border-bottom: 1px inset #f7fafc; }
      &:before {
        content: attr(data-label);
        font-weight: 700;
        color: #4a5568;
      }
    }
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
  border-bottom: 2px solid #e2e8f0;
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
`;

const WishlistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 colonnes sur mobile */
  gap: 12px;
  margin-top: 15px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 20px;
  }
`;

const WishItem = styled.div`
  border: 1px solid #f1f5f9;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  background: #fff;
  img { width: 100%; height: 90px; object-fit: contain; }
  p { font-size: 12px; margin: 8px 0 0; font-weight: 600; color: #334155; }
`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: ${props => props.status === "Prête" ? "#dcfce7" : "#f1f5f9"};
  color: ${props => props.status === "Prête" ? "#166534" : "#475569"};
`;

const ProductItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  @media (max-width: 768px) { justify-content: flex-end; }
`;

const GoogleButton = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; max-width: 320px; margin: 20px auto; padding: 12px;
  border: 1px solid #e2e8f0; background: white; border-radius: 8px;
  font-weight: 600; cursor: pointer;
`;

const LogoutButton = styled.button`
  width: 100%; padding: 10px; background: #ef4444; color: white;
  border: none; border-radius: 8px; margin-top: 10px; cursor: pointer;
`;

const CancelButton = styled.button`
  padding: 5px 10px; background: #fff1f2; color: #be123c;
  border: 1px solid #fecdd3; border-radius: 6px; font-size: 11px;
  cursor: pointer; margin-top: 5px;
`;

// ===== Logique du Composant =====

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if(status === "authenticated") {
      fetch('/api/orders').then(res => res.json()).then(data => Array.isArray(data) && setOrders(data));
      fetch('/api/wishlist').then(res => res.json()).then(data => Array.isArray(data) && setWishlist(data));
    }
  }, [status]);

  const handleCancelOrder = async (orderId) => {
    if(!window.confirm("Annuler cette commande ?")) return;
    try {
      const res = await fetch("/api/orders", {
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({orderId})
      });
      if(res.ok) {
        toast.success("Commande annulée");
        setOrders(orders.map(o => o._id === orderId ? {...o, status:"Annulée"} : o));
      }
    } catch(err) { toast.error("Erreur"); }
  };

  if(status === "loading") return <><Header/><Container>Chargement...</Container></>;

  if(!session) return (
    <><Header/><Container><Card style={{textAlign:'center'}}>
      <h2>Mon Compte</h2>
      <GoogleButton onClick={()=>signIn("google")}>
        <img src="https://developers.google.com/identity/images/g-logo.png" width="18" alt=""/>
        Continuer avec Google
      </GoogleButton>
    </Card></Container></>
  );

  return (
    <>
      <Header/>
      <Container>
        {/* Header Profil */}
        <Card>
          <ProfileSection>
            <AvatarWrapper onClick={()=>setIsDropdownOpen(!isDropdownOpen)}>
              <AvatarImage src={session.user?.image || "/avatar.png"} active={isDropdownOpen}/>
              {isDropdownOpen && (
                <DropdownMenu>
                  <p style={{margin:0, fontSize:'12px', color:'#64748b'}}>Connecté en tant que</p>
                  <p style={{margin:'4px 0 12px 0', fontWeight:700}}>{session.user?.email}</p>
                  <LogoutButton onClick={()=>signOut()}>Se déconnecter</LogoutButton>
                </DropdownMenu>
              )}
            </AvatarWrapper>
            <div>
              <h2 style={{margin:0, fontSize:'1.25rem'}}>Bonjour, {session.user?.name}</h2>
              <p style={{margin:0, color:'#64748b', fontSize:'14px'}}>Bienvenue sur votre espace personnel</p>
            </div>
          </ProfileSection>
        </Card>

        {/* Favoris */}
        <Card>
          <h3 style={{fontSize:'16px', margin:0}}>❤️ Ma Liste de Souhaits</h3>
          {!wishlist.length ? <p style={{fontSize:'13px', color:'#94a3b8', marginTop:'10px'}}>Aucun favori pour le moment.</p> : (
            <WishlistGrid>
              {wishlist.map(w => w.product && (
                <Link href={`/product/${w.product._id}`} key={w._id} style={{textDecoration:'none'}}>
                  <WishItem>
                    <img src={w.product.images?.[0]} alt=""/>
                    <p>{w.product.title}</p>
                  </WishItem>
                </Link>
              ))}
            </WishlistGrid>
          )}
        </Card>

        {/* Commandes */}
        <Card>
          <h3 style={{fontSize:'16px', margin:0}}>📦 Historique des Commandes</h3>
          {!orders.length ? <p style={{fontSize:'13px', color:'#94a3b8', marginTop:'10px'}}>Aucune commande effectuée.</p> : (
            <OrdersTable>
              <thead>
                <tr>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Détails</TableHeader>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <TableCell data-label="Statut">
                      <StatusBadge status={order.status}>{order.status}</StatusBadge>
                    </TableCell>
                    <TableCell data-label="Date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell data-label="Produits">
                      <div style={{display:'flex', flexDirection:'column', gap:'5px', alignItems: 'flex-end'}}>
                        {order.line_items.map((item, i) => (
                          <ProductItem key={i}>
                            <span style={{fontSize:'12px'}}>{item.quantity}x {item.name}</span>
                          </ProductItem>
                        ))}
                        {order.status === "En attente" && (
                          <CancelButton onClick={()=>handleCancelOrder(order._id)}>Annuler</CancelButton>
                        )}
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </OrdersTable>
          )}
        </Card>
        <ToastContainer position="bottom-center"/>
      </Container>
    </>
  );
}