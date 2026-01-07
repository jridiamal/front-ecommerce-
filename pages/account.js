"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useSession, signIn, signOut } from "next-auth/react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

// ===== Updated Styled Components for Perfect Responsiveness =====
const Container = styled.div`
  min-height: calc(100vh - 80px);
  padding: 15px; /* Smaller padding for mobile */
  margin-top: 80px; 
  
  @media (min-width: 768px) {
    padding: 30px; /* Larger padding for laptops */
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto 20px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);

  @media (min-width: 768px) {
    padding: 25px;
    margin-bottom: 30px;
  }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column; /* Stack vertically on mobile */
  align-items: center;
  text-align: center;
  gap: 15px;
  margin-bottom: 20px;

  @media (min-width: 640px) {
    flex-direction: row; /* Horizontal on laptop */
    text-align: left;
  }
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding: 12px 20px;
  width: 100%;
  max-width: 400px; /* Prevents button from being too wide on PC */
  margin-left: auto;
  margin-right: auto;
  font-weight: 600;
  font-size: 15px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
`;

const AvatarWrapper = styled.div`position: relative;`;
const AvatarImage = styled.img`
  border-radius: 50%;
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: ${props => (props.active ? "3px solid #2563eb" : "2px solid #e5e7eb")};
  cursor: pointer;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  left: 50%; /* Center dropdown on mobile */
  transform: translateX(-50%);
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  min-width: 220px;
  padding: 15px;
  font-size: 14px;
  z-index: 10;

  @media (min-width: 640px) {
    left: 0;
    transform: none;
  }
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 25px;
  font-size: 14px;

  /* Responsive Table Trick */
  @media (max-width: 768px) {
    display: block;
    thead { display: none; } /* Hide headers on mobile */
    tr {
      display: block;
      border: 1px solid #eee;
      margin-bottom: 15px;
      padding: 10px;
      border-radius: 8px;
    }
    td {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 8px 0;
      border: none;
      text-align: right;
      &:before {
        content: attr(data-label); /* Uses the label we add below */
        font-weight: bold;
        text-align: left;
      }
    }
  }
`;

const TableHead = styled.thead`background: #f3f4f6;`;
const TableRow = styled.tr`&:nth-child(even) { background: #f9fafb; }`;
const TableHeader = styled.th`padding: 12px; text-align: left; font-weight: 600;`;
const TableCell = styled.td`padding: 12px; vertical-align: top;`;

const WishlistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 items per row on mobile */
  gap: 15px;
  margin-top: 20px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); /* Auto on laptop */
    gap: 20px;
  }
`;

const WishItem = styled.div`
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  img { width: 100%; height: 100px; object-fit: contain; }
  p { font-size: 13px; margin: 5px 0; font-weight: 500; }
`;

// Remaining components (CancelButton, StatusBadge, ProductList, etc.) kept as-is
const LogoutButton = styled.button` width: 100%; padding: 10px; background-color: #ef4444; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 10px; &:hover { background-color: #b91c1c; } `;
const CancelButton = styled.button` padding: 6px 12px; background-color: #f97316; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; margin-top: 8px; transition: background-color 0.2s; &:hover { background-color: #c2410c; } `;
const StatusBadge = styled.span` padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; color: ${props => (props.status === "Prête" ? "#166534" : "#4b5563")}; background-color: ${props => (props.status === "Prête" ? "#d1fae5" : "#f3f4f6")}; `;
const ProductList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const ProductItem = styled.div`display: flex; align-items: center; gap: 10px;`;
const ProductImage = styled.img`width: 45px; height: 45px; border-radius: 6px; object-fit: cover;`;
const ProductText = styled.div`p { margin: 0; line-height: 1.3; font-size: 13px; color: #374151; }`;

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if(status === "authenticated") {
      fetch('/api/orders').then(res => res.json()).then(data => Array.isArray(data) && setOrders(data)).catch(err => console.error(err));
      fetch('/api/wishlist').then(res => res.json()).then(data => Array.isArray(data) && setWishlist(data)).catch(err => console.error(err));
    }
  }, [session, status]);

  const handleCancelOrder = async (orderId) => {
    if(!window.confirm("Voulez-vous vraiment annuler cette commande ?")) return;
    try{
      const res = await fetch("/api/orders", { method:"DELETE", headers:{ "Content-Type": "application/json" }, body: JSON.stringify({ orderId }), });
      const data = await res.json();
      if(res.ok){ toast.success(data.message); setOrders(orders.map(o => o._id === orderId ? {...o, status:"Annulée"} : o));
      }else toast.error(data.error);
    }catch(err){ toast.error("Erreur serveur !"); }
  };

  if(status === "loading") return <><Header/><Container><p>Chargement...</p></Container></>;

  if(!session) return (
    <>
      <Header/>
      <Container>
        <Card style={{textAlign:'center'}}>
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
        <Card>
          <ProfileSection>
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
          </ProfileSection>
        </Card>

        <Card>
          <h3>❤️ Ma Liste de Souhaits</h3>
          {(!wishlist || wishlist.length===0) ? <p>Aucun favori.</p> :
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

        <Card>
          <h3>📦 Historique des Commandes</h3>
          {orders.length===0 ? <p>Aucune commande.</p> :
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
                    <TableCell data-label="Statut"><StatusBadge status={order.status}>{order.status}</StatusBadge></TableCell>
                    <TableCell data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell data-label="Détails">
                      <ProductList>
                        {order.line_items.map((item,idx)=>(
                          <ProductItem key={idx}>
                            <ProductImage src={item.image} alt={item.name}/>
                            <ProductText>
                              <p><b>{item.name}</b></p>
                              <p>Qté: {item.quantity} | {item.price} DT</p>
                            </ProductText>
                          </ProductItem>
                        ))}
                      </ProductList>
                      {order.status==="En attente" && (
                        <CancelButton onClick={()=>handleCancelOrder(order._id)}>Annuler</CancelButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </OrdersTable>
          }
        </Card>
        <ToastContainer position="top-right" autoClose={3000}/>
      </Container>
    </>
  );
}