'use client';

import Header from "@/components/Header";
import Center from "@/components/Center";
import styled from "styled-components";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

/* ===================== STYLES (كيف ما هما) ===================== */

const Container = styled(Center)`
  padding: 40px 0;
`;

const Card = styled.div`
  background: #fff;
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 20px;
`;

const ProfileSection = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const AvatarWrapper = styled.div`
  position: relative;
  cursor: pointer;
`;

const AvatarImage = styled.img<{active:boolean}>`
  width: 55px;
  height: 55px;
  border-radius: 50%;
  border: ${({active}) => active ? "2px solid #000" : "2px solid transparent"};
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 70px;
  left: 0;
  background: #fff;
  border-radius: 10px;
  padding: 15px;
  width: 220px;
  box-shadow: 0 10px 30px rgba(0,0,0,.1);
  z-index: 10;
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 10px;
  border-bottom: 1px solid #eee;
`;

const TableCell = styled.td`
  padding: 10px;
  vertical-align: top;
`;

const StatusBadge = styled.span<{status:string}>`
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background:
    ${({status}) =>
      status === "Livrée" ? "#dcfce7" :
      status === "Prête" ? "#dbeafe" :
      status === "Annulée" ? "#fee2e2" :
      "#fef9c3"};
  color:
    ${({status}) =>
      status === "Livrée" ? "#166534" :
      status === "Prête" ? "#1e40af" :
      status === "Annulée" ? "#991b1b" :
      "#854d0e"};
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ProductItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ProductImage = styled.img`
  width: 45px;
  height: 45px;
  object-fit: cover;
  border-radius: 6px;
`;

const ProductText = styled.div`
  font-size: 13px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 14px;
  margin-bottom: 15px;
  cursor: pointer;
`;

const WishlistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(150px,1fr));
  gap: 15px;
`;

const WishItem = styled.div`
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: .2s;
  &:hover { transform: translateY(-3px); }
  img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 8px;
  }
`;

/* ===================== PAGE ===================== */

export default function AccountPage() {
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<any[]>([]);
  const [historique, setHistorique] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'history' | 'favorites'>('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/orders")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setOrders(data.filter(o => o.status === "En attente"));
            setHistorique(data.filter(o =>
              ["Livrée", "Prête", "Annulée"].includes(o.status)
            ));
          }
        });

      fetch("/api/wishlist")
        .then(res => res.json())
        .then(data => Array.isArray(data) && setWishlist(data));
    }
  }, [status]);

  if (status === "loading") {
    return (
      <>
        <Header/>
        <Container>Chargement...</Container>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header/>
        <Container>
          <Card style={{textAlign:"center"}}>
            <h2>Mon Compte</h2>
            <button
              onClick={() => signIn("google")}
              style={{padding:12,width:300,cursor:"pointer"}}
            >
              Se connecter avec Google
            </button>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header/>
      <Container>

        {/* ================= FAVORITES ================= */}
        {activeView === "favorites" && (
          <Card>
            <BackButton onClick={() => setActiveView("dashboard")}>
              ← Retour
            </BackButton>

            <h3>❤️ Mes Favoris</h3>

            {!wishlist.length ? <p>Aucun favori.</p> : (
              <WishlistGrid>
                {wishlist.map(w => w.product && (
                  <Link
                    key={w._id}
                    href={`/product/${w.product._id}`}
                    style={{textDecoration:"none",color:"inherit"}}
                  >
                    <WishItem>
                      <img src={w.product.images?.[0]} />
                      <p>{w.product.title}</p>
                    </WishItem>
                  </Link>
                ))}
              </WishlistGrid>
            )}
          </Card>
        )}

        {/* ================= HISTORIQUE ================= */}
        {activeView === "history" && (
          <Card>
            <BackButton onClick={() => setActiveView("dashboard")}>
              ← Retour
            </BackButton>

            <h3>📜 Historique des commandes</h3>

            {!historique.length ? <p>Aucun historique.</p> : (
              <OrdersTable>
                <thead>
                  <tr>
                    <TableHeader>Statut</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Produits</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {historique.map(order => (
                    <tr key={order._id}>
                      <TableCell>
                        <StatusBadge status={order.status}>
                          {order.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <ProductList>
                          {order.line_items.map((item:any,i:number)=>(
                            <ProductItem key={i}>
                              <ProductImage src={item.image}/>
                              <ProductText>
                                <b>{item.name}</b><br/>
                                {item.quantity} × {item.price} DT
                              </ProductText>
                            </ProductItem>
                          ))}
                        </ProductList>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </OrdersTable>
            )}
          </Card>
        )}

        {/* ================= DASHBOARD ================= */}
        {activeView === "dashboard" && (
          <>
            <Card>
              <ProfileSection>
                <AvatarWrapper onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <AvatarImage
                    src={session.user?.image || "/avatar.png"}
                    active={isDropdownOpen}
                  />

                  {isDropdownOpen && (
                    <DropdownMenu>
                      <p style={{fontSize:12}}>Connecté en tant que</p>
                      <p style={{fontWeight:700}}>{session.user?.email}</p>

                      <button
                        onClick={() => {
                          setActiveView("favorites");
                          setIsDropdownOpen(false);
                        }}
                        style={{width:"100%",marginBottom:8}}
                      >
                        ❤️ Favoris
                      </button>

                      <button
                        onClick={() => {
                          setActiveView("history");
                          setIsDropdownOpen(false);
                        }}
                        style={{width:"100%",marginBottom:8}}
                      >
                        📜 Historique
                      </button>

                      <button
                        onClick={() => signOut()}
                        style={{width:"100%",background:"#ef4444",color:"#fff"}}
                      >
                        Se déconnecter
                      </button>
                    </DropdownMenu>
                  )}
                </AvatarWrapper>

                <div>
                  <h2>Bonjour, {session.user?.name}</h2>
                  <p>Gérez vos commandes et favoris</p>
                </div>
              </ProfileSection>
            </Card>

            <Card>
              <h3>📦 Mes commandes</h3>

              {!orders.length ? <p>Aucune commande.</p> : (
                <OrdersTable>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id}>
                        <TableCell>
                          <StatusBadge status={order.status}>
                            {order.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <ProductList>
                            {order.line_items.map((item:any,i:number)=>(
                              <ProductItem key={i}>
                                <ProductImage src={item.image}/>
                                <ProductText>
                                  <b>{item.name}</b><br/>
                                  {item.quantity} × {item.price} DT
                                </ProductText>
                              </ProductItem>
                            ))}
                          </ProductList>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </OrdersTable>
              )}
            </Card>
          </>
        )}

        <ToastContainer position="bottom-center"/>
      </Container>
    </>
  );
}
