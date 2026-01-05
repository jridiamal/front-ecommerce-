"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useSession, signIn, signOut } from "next-auth/react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

// ===== Styled Components =====
const Container = styled.div`
  min-height: calc(100vh - 80px);
  padding: 20px;
  margin-top: 80px; 
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 25px;
  max-width: 1000px;
  margin: 0 auto 30px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding: 12px 20px;
  width: 100%;
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
  transition: border 0.2s;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  padding: 15px;
  font-size: 14px;
  z-index: 10;
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  &:hover { background-color: #b91c1c; }
`;

const CancelButton = styled.button`
  padding: 6px 12px;
  background-color: #f97316;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
  transition: background-color 0.2s;
  &:hover { background-color: #c2410c; }
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 25px;
  font-size: 14px;
  @media (max-width: 768px) { display: block; overflow-x: auto; }
`;

const TableHead = styled.thead`background: #f3f4f6;`;
const TableRow = styled.tr`&:nth-child(even) { background: #f9fafb; }`;
const TableHeader = styled.th`padding: 12px; text-align: left; font-weight: 600;`;
const TableCell = styled.td`padding: 12px; vertical-align: top;`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  color: ${props => {
    switch(props.status){
      case "Prête": return "#166534";
      case "Confirmée": return "#1e40af";
      case "En cours": return "#b45309";
      case "En attente": return "#b91c1c";
      case "Annulée":
      case "Terminée": return "#374151";
      default: return "#4b5563";
    }
  }};
  background-color: ${props => {
    switch(props.status){
      case "Prête": return "#d1fae5";
      case "Confirmée": return "#bfdbfe";
      case "En cours": return "#fef3c7";
      case "En attente": return "#fecaca";
      case "Annulée":
      case "Terminée": return "#e5e7eb";
      default: return "#f3f4f6";
    }
  }};
`;

const ProductList = styled.div`display: flex; flex-direction: column; gap: 8px;`;
const ProductItem = styled.div`display: flex; align-items: center; gap: 10px;`;
const ProductImage = styled.img`width: 45px; height: 45px; border-radius: 6px; object-fit: cover;`;
const ProductText = styled.div`p { margin: 0; line-height: 1.3; font-size: 13px; color: #374151; }`;

const WishlistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const WishItem = styled.div`
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  img { width: 100%; height: 100px; object-fit: contain; }
  p { font-size: 13px; margin: 5px 0; font-weight: 500; }
`;

// ===== Component =====
export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if(status === "authenticated" && session?.user?.email){
      fetch(`/api/orders?userId=${session.user.email}`)
        .then(res => res.json())
        .then(data => Array.isArray(data) && setOrders(data))
        .catch(err => console.error(err));

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
        body: JSON.stringify({ orderId, userEmail: session.user.email }),
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
         <p>Vous n&apos;avez pas encore de favoris.</p>

          {(!wishlist || wishlist.length===0) ? <p>Vous n&apos;avez pas encore de favoris.</p>
: (
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
          )}
        </Card>

        {/* Orders */}
        <Card>
          <h3>📦 Historique des Commandes</h3>
          {orders.length===0 ? <p>Vous n&apos;avez aucune commande.</p>
 : (
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
          )}
        </Card>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false}/>
      </Container>
    </>
  );
}
