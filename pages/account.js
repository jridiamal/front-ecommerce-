"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useSession, signIn, signOut } from "next-auth/react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

// ===== Updated Styled Components for Responsiveness =====

const Container = styled.div`
  min-height: calc(100vh - 80px);
  padding: 15px;
  margin-top: 80px;
  background-color: #f9fafb;

  @media (min-width: 768px) {
    padding: 30px;
  }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    padding: 30px;
    margin-bottom: 30px;
  }
`;

const ProfileHeader = styled.div`
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

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 14px;

  /* Mobile Responsive Table Strategy */
  @media (max-width: 768px) {
    display: block;
    thead { display: none; } /* Hide headers on mobile */
    tr {
      display: block;
      border: 1px solid #eee;
      margin-bottom: 15px;
      border-radius: 8px;
      padding: 10px;
    }
    td {
      display: block;
      text-align: right;
      padding: 8px 0;
      border: none;
      position: relative;
      &:before {
        content: attr(data-label);
        position: absolute;
        left: 0;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 12px;
      }
    }
  }
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  background: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
`;

const TableCell = styled.td`
  padding: 15px 12px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
`;

const WishlistGrid = styled.div`
  display: grid;
  /* 2 columns on mobile, auto-fill on desktop */
  grid-template-columns: repeat(2, 1fr); 
  gap: 15px;
  margin-top: 20px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 25px;
  }
`;

// ... (Other styled components like GoogleButton, StatusBadge, etc. remain the same)
const GoogleButton = styled.button`
  display: flex; align-items: center; justify-content: center; gap: 12px;
  margin: 20px auto; padding: 12px 20px; width: 100%; max-width: 350px;
  font-weight: 600; border-radius: 8px; border: 1px solid #d1d5db;
  background-color: #fff; cursor: pointer;
`;

const AvatarWrapper = styled.div`position: relative; cursor: pointer;`;
const AvatarImage = styled.img`
  border-radius: 50%; width: 80px; height: 80px; object-fit: cover;
  border: ${props => (props.active ? "3px solid #2563eb" : "2px solid #e5e7eb")};
`;

const DropdownMenu = styled.div`
  position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  background: #fff; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  min-width: 220px; padding: 15px; z-index: 50; margin-top: 10px;
`;

const LogoutButton = styled.button`
  width: 100%; padding: 10px; background-color: #ef4444; color: #fff;
  border: none; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 10px;
`;

const StatusBadge = styled.span`
  padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 12px;
  background-color: ${props => props.status === "Prête" ? "#d1fae5" : "#f3f4f6"};
  color: ${props => props.status === "Prête" ? "#065f46" : "#374151"};
`;

const ProductItem = styled.div`
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
  text-align: left;
`;

const WishItem = styled.div`
  border: 1px solid #eee; padding: 15px; border-radius: 12px; text-align: center;
  transition: transform 0.2s;
  &:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
  img { width: 100%; height: 120px; object-fit: contain; }
  p { font-size: 14px; margin: 10px 0 0; font-weight: 600; color: #1f2937; }
`;

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

  if(status === "loading") return <><Header/><Container><p>Chargement...</p></Container></>;

  if(!session) return (
    <>
      <Header/>
      <Container>
        <Card style={{textAlign:'center'}}>
          <h2 style={{marginBottom:'10px'}}>Bienvenue</h2>
          <p>Connectez-vous pour voir vos commandes</p>
          <GoogleButton onClick={()=>signIn("google")}>
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
        {/* Profile Card */}
        <Card>
          <ProfileHeader>
            <AvatarWrapper onClick={()=>setIsDropdownOpen(!isDropdownOpen)}>
              <AvatarImage src={session.user?.image || "/default-avatar.png"} active={isDropdownOpen}/>
              {isDropdownOpen && (
                <DropdownMenu>
                  <p style={{margin:0, color:'#6b7280'}}>Compte:</p>
                  <p><b>{session.user?.email}</b></p>
                  <LogoutButton onClick={()=>signOut()}>Se déconnecter</LogoutButton>
                </DropdownMenu>
              )}
            </AvatarWrapper>
            <div>
              <h2 style={{margin:0}}>Salut, {session.user?.name} 👋</h2>
              <p style={{color:"#6b7280", margin:0}}>Heureux de vous revoir !</p>
            </div>
          </ProfileHeader>
        </Card>

        {/* Wishlist Section */}
        <Card>
          <h3 style={{marginBottom:'15px'}}>❤️ Ma Liste de Souhaits</h3>
          {!wishlist?.length ? <p style={{color:'#9ca3af'}}>Aucun produit favori.</p> :
            <WishlistGrid>
              {wishlist.map(w => w.product && (
                <Link href={`/product/${w.product._id}`} key={w._id} style={{textDecoration:'none'}}>
                  <WishItem>
                    <img src={w.product.images?.[0]} alt={w.product.title}/>
                    <p>{w.product.title}</p>
                  </WishItem>
                </Link>
              ))}
            </WishlistGrid>
          }
        </Card>

        {/* Orders Section */}
        <Card>
          <h3>📦 Mes Commandes</h3>
          {orders.length===0 ? <p style={{color:'#9ca3af'}}>Aucune commande trouvée.</p> :
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
                    <TableCell data-label="Statut"><StatusBadge status={order.status}>{order.status}</StatusBadge></TableCell>
                    <TableCell data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell data-label="Produits">
                      {order.line_items.map((item,idx)=>(
                        <ProductItem key={idx}>
                          <strong>{item.quantity}x</strong> <span>{item.name}</span>
                        </ProductItem>
                      ))}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </OrdersTable>
          }
        </Card>
        <ToastContainer />
      </Container>
    </>
  );
}