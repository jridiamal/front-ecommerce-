"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useSession, signIn, signOut } from "next-auth/react";
import styled from "styled-components";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

const Container = styled.div`
  min-height: calc(100vh - 80px);
  padding: 10px 5px;
  margin-top: 40px;
  background-color: #f8fafc;
  @media (min-width: 768px) { padding: 30px; }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 15px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  box-sizing: border-box;
  @media (min-width: 768px) { padding: 25px; margin-bottom: 25px; }
`;

const ProfileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 15px;
  @media (min-width: 640px) { flex-direction: row; text-align: left; }
`;

const AvatarWrapper = styled.div`
  position: relative;
  z-index: 20;
`;

const AvatarImage = styled.img`
  border-radius: 50%;
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: ${props => (props.active ? "3px solid #2563eb" : "2px solid #e2e8f0")};
  cursor: pointer;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  min-width: 240px;
  padding: 15px;
  z-index: 100;
  @media (min-width: 640px) { left: 0; transform: none; }
`;

const OrdersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  @media (max-width: 800px) {
    display: block;
    thead { display: none; }
    tr {
      display: block;
      border: 1px solid #edf2f7;
      border-radius: 10px;
      margin-bottom: 15px;
      padding: 12px;
    }
    td {
      display: flex;
      flex-direction: column;
      border: none;
      padding: 8px 0;
      font-size: 14px;
      &:not(:last-child) { border-bottom: 1px solid #f7fafc; }
      &:before {
        content: attr(data-label);
        font-weight: 700;
        color: #64748b;
        font-size: 12px;
        margin-bottom: 4px;
      }
    }
  }
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px;
  background: #f8fafc;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
`;

const TableCell = styled.td`padding: 12px; border-bottom: 1px solid #f1f5f9;`;

const WishlistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap:10px;
  margin-top:15px;
  @media (min-width:640px){grid-template-columns: repeat(auto-fill,minmax(150px,1fr));gap:20px;}
`;

const WishItem = styled.div`
  border: 1px solid #f1f5f9;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  background: #fff;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  img { width: 100%; height: 120px; object-fit: contain; margin-bottom: 8px; }
  p { font-size: 13px; margin: 0; font-weight: 600; color: #334155; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
`;

const ProductList = styled.div`display:flex; flex-direction:column; gap:10px;`;
const ProductItem = styled.div`display:flex; align-items:center; gap:12px;`;
const ProductImage = styled.img`
  width:50px; height:50px; border-radius:8px; object-fit:cover; flex-shrink:0;
`;

const ProductText = styled.div`p{margin:0; font-size:13px;color:#374151;line-height:1.2;}`;

const StatusBadge = styled.span`
  padding:4px 12px;
  border-radius:20px;
  font-size:12px;
  font-weight:700;
  display:inline-block;
  background:${props => 
    props.status === "Prête" ? "#dcfce7" : 
    props.status === "Livrée" ? "#d1fae5" :
    props.status === "En préparation" ? "#fef3c7" :
    props.status === "Confirmée" ? "#dbeafe" :
    props.status === "En attente" ? "#f1f5f9" : 
    "#fee2e2"};
  color:${props => 
    props.status === "Prête" ? "#166534" : 
    props.status === "Livrée" ? "#065f46" :
    props.status === "En préparation" ? "#92400e" :
    props.status === "Confirmée" ? "#1e40af" :
    props.status === "En attente" ? "#475569" : 
    "#991b1b"};
`;

const CancelButton = styled.button`
  padding:8px 15px;
  background:#fff1f2;
  color:#be123c;
  border:1px solid #fecdd3;
  border-radius:8px;
  font-size:12px;
  font-weight:600;
  cursor:pointer;
  margin-top:10px;
  width:100%;
  @media(min-width:768px){width:auto;}
`;

const BackButton = styled.button`
  background: transparent;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 20px;
  font-weight: 600;
  &:hover { background: #f1f5f9; }
`;

const TimeBadge = styled.div`
  font-size: 11px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 3px;
  background-color: #fef3c7;
  padding: 2px 8px;
  border-radius: 12px;
  align-self: flex-start;
  margin-top: 4px;
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid ${props => props.active ? '#2563eb' : '#cbd5e1'};
  background: ${props => props.active ? '#dbeafe' : 'white'};
  color: ${props => props.active ? '#1e40af' : '#475569'};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    background: ${props => props.active ? '#dbeafe' : '#f8fafc'};
  }
`;

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [allOrders, setAllOrders] = useState([]); // TOUTES les commandes
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'ready', 'delivered', 'cancelled'

  // Fonction pour calculer le temps restant avant que la commande soit prête
  const calculateTimeRemaining = (createdAt) => {
    const orderDate = new Date(createdAt);
    const now = new Date();
    const hoursDiff = Math.floor((now - orderDate) / (1000 * 60 * 60));
    const hoursRemaining = 96 - hoursDiff; // 4 jours = 96 heures
    
    if (hoursRemaining <= 0) {
      return { text: "Prête aujourd'hui", color: "#166534", bg: "#dcfce7" };
    } else if (hoursRemaining <= 24) {
      return { text: "Prête demain", color: "#ca8a04", bg: "#fef3c7" };
    } else {
      const days = Math.ceil(hoursRemaining / 24);
      return { text: `Prête dans ${days} jour${days > 1 ? 's' : ''}`, color: "#92400e", bg: "#fef3c7" };
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      // Récupérer TOUTES les commandes
      fetch("/api/orders").then(res => res.json()).then(data => {
        if (Array.isArray(data)) {
          setAllOrders(data);
          setFilteredOrders(data);
        }
      }).catch(err => {
        console.error("Erreur chargement commandes:", err);
        toast.error("Erreur de chargement des commandes");
      });
      
      // Récupérer la wishlist
      fetch("/api/wishlist").then(res => res.json()).then(data => {
        if (Array.isArray(data)) setWishlist(data);
      }).catch(err => {
        console.error("Erreur chargement wishlist:", err);
      });
    }
  }, [status]);

  // Filtrer les commandes selon le statut
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredOrders(allOrders);
    } else if (statusFilter === 'pending') {
      setFilteredOrders(allOrders.filter(order => order.status === "En attente"));
    } else if (statusFilter === 'ready') {
      setFilteredOrders(allOrders.filter(order => order.status === "Prête"));
    } else if (statusFilter === 'delivered') {
      setFilteredOrders(allOrders.filter(order => order.status === "Livrée"));
    } else if (statusFilter === 'cancelled') {
      setFilteredOrders(allOrders.filter(order => order.status === "Annulée"));
    }
  }, [statusFilter, allOrders]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) return;
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) {
        toast.success("✅ Commande annulée avec succès");
        // Mettre à jour la commande dans la liste
        setAllOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: "Annulée" } : order
        ));
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'annulation");
      }
    } catch (err) { 
      toast.error("❌ Erreur réseau"); 
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!window.confirm("Supprimer tout l'historique ? Les commandes annulées, livrées et prêtes seront supprimées.")) return;
    try {
      const res = await fetch("/api/historique", { method: "DELETE" });
      if (res.ok) {
        // Filtrer pour garder seulement les commandes "En attente"
        setAllOrders(prev => prev.filter(order => order.status === "En attente"));
        toast.success("🗑️ Historique supprimé");
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (err) { 
      toast.error("❌ Erreur réseau"); 
    }
  };

  if (status === "loading") return <><Header /><Container>Chargement...</Container></>;
  if (!session) return (
    <><Header /><Container><Card style={{ textAlign: 'center' }}>
      <h2>Mon Compte</h2>
      <button 
        onClick={() => signIn("google")} 
        style={{ 
          padding: '12px 24px', 
          width: '100%', 
          maxWidth: '300px', 
          cursor: 'pointer',
          background: '#4285F4',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          marginTop: '20px'
        }}
      >
        Se connecter avec Google
      </button>
    </Card></Container></>
  );

  return (
    <>
      <Header />
      <Container>
        {activeView === 'orders' ? (
          <Card>
            <BackButton onClick={() => setActiveView('dashboard')}>
              ← Retour au tableau de bord
            </BackButton>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '20px' }}>
              <h3 style={{ fontSize: "18px", margin: 0 }}>📋 Toutes mes commandes</h3>
              {allOrders.filter(o => ["Annulée", "Livrée", "Prête"].includes(o.status)).length > 0 && (
                <button 
                  onClick={handleDeleteAllHistory} 
                  style={{ 
                    background: "#fee2e2", 
                    color: "#991b1b", 
                    border: "1px solid #fecaca", 
                    borderRadius: "8px", 
                    padding: "8px 12px", 
                    cursor: "pointer", 
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  🗑️ Supprimer l'historique
                </button>
              )}
            </div>

            {/* Filtres */}
            <FilterButtons>
              <FilterButton 
                active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              >
                Toutes ({allOrders.length})
              </FilterButton>
              <FilterButton 
                active={statusFilter === 'pending'}
                onClick={() => setStatusFilter('pending')}
              >
                En attente ({allOrders.filter(o => o.status === "En attente").length})
              </FilterButton>
              <FilterButton 
                active={statusFilter === 'ready'}
                onClick={() => setStatusFilter('ready')}
              >
                Prêtes ({allOrders.filter(o => o.status === "Prête").length})
              </FilterButton>
              <FilterButton 
                active={statusFilter === 'delivered'}
                onClick={() => setStatusFilter('delivered')}
              >
                Livrées ({allOrders.filter(o => o.status === "Livrée").length})
              </FilterButton>
              <FilterButton 
                active={statusFilter === 'cancelled'}
                onClick={() => setStatusFilter('cancelled')}
              >
                Annulées ({allOrders.filter(o => o.status === "Annulée").length})
              </FilterButton>
            </FilterButtons>

            {!filteredOrders.length ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 20px' }}>
                {statusFilter === 'all' 
                  ? "Vous n'avez pas encore de commandes."
                  : `Aucune commande ${statusFilter === 'pending' ? 'en attente' : 
                     statusFilter === 'ready' ? 'prête' : 
                     statusFilter === 'delivered' ? 'livrée' : 'annulée'}.`
                }
              </p>
            ) : (
              <OrdersTable>
                <thead>
                  <tr>
                    <TableHeader>ID Commande</TableHeader>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Statut</TableHeader>
                    <TableHeader>Produits</TableHeader>
                    <TableHeader>Total</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const timeInfo = calculateTimeRemaining(order.createdAt);
                    return (
                      <tr key={order._id} style={{
                        backgroundColor: order.status === "Annulée" ? "#fef2f2" : 
                                       order.status === "Prête" ? "#f0fdf4" : 
                                       order.status === "Livrée" ? "#f0fdf4" : "white"
                      }}>
                        <TableCell data-label="ID Commande">
                          <span style={{ 
                            fontSize: '11px', 
                            fontFamily: 'monospace',
                            color: '#64748b'
                          }}>
                            #{order._id.toString().slice(-8)}
                          </span>
                        </TableCell>
                        <TableCell data-label="Date">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell data-label="Statut">
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <StatusBadge status={order.status}>
                              {order.status}
                            </StatusBadge>
                            {order.status === "En attente" && (
                              <TimeBadge style={{ backgroundColor: timeInfo.bg, color: timeInfo.color }}>
                                <span style={{ fontSize: "10px" }}>⏳</span>
                                {timeInfo.text}
                              </TimeBadge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-label="Produits">
                          <ProductList>
                            {order.line_items.map((item, i) => (
                              <ProductItem key={i}>
                                <ProductImage 
                                  src={item.image || item.price_data?.product_data?.images?.[0] || "/placeholder.png"} 
                                  alt={item.name} 
                                />
                                <ProductText>
                                  <p><b>{item.name || item.price_data?.product_data?.name || 'Produit'}</b></p>
                                  <p>Qté: {item.quantity} | {item.price || item.price_data?.unit_amount/100 || 0} DT</p>
                                </ProductText>
                              </ProductItem>
                            ))}
                          </ProductList>
                        </TableCell>
                        <TableCell data-label="Total">
                          <strong style={{ 
                            fontSize: '16px',
                            color: order.status === "Annulée" ? "#991b1b" : "#166534"
                          }}>
                            {order.total} DT
                          </strong>
                        </TableCell>
                        <TableCell data-label="Actions">
                          {order.status === "En attente" ? (
                            <CancelButton onClick={() => handleCancelOrder(order._id)}>
                              Annuler
                            </CancelButton>
                          ) : order.status === "Prête" ? (
                            <button
                              style={{
                                padding: '8px 15px',
                                background: '#dbeafe',
                                color: '#1e40af',
                                border: '1px solid #93c5fd',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                              onClick={() => toast.info("Votre commande est prête pour récupération")}
                            >
                              À récupérer
                            </button>
                          ) : order.status === "Livrée" ? (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#065f46',
                              fontWeight: '600'
                            }}>
                              ✅ Livrée
                            </span>
                          ) : (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#991b1b',
                              fontWeight: '600'
                            }}>
                              ❌ Annulée
                            </span>
                          )}
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </OrdersTable>
            )}
          </Card>
        ) : (
          <>
            {/* Carte Profil */}
            <Card>
              <ProfileSection>
                <AvatarWrapper onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <AvatarImage 
                    src={session.user?.image || "/avatar.png"} 
                    active={isDropdownOpen} 
                    alt="Avatar"
                  />
                  {isDropdownOpen && (
                    <DropdownMenu>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Connecté en tant que</p>
                      <p style={{ margin: '4px 0 12px 0', fontWeight: 700 }}>{session.user?.email}</p>
                      
                      <button
                        onClick={() => {
                          setActiveView('orders');
                          setIsDropdownOpen(false);
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          marginBottom: '8px', 
                          background: '#f1f5f9', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          fontWeight: 600, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          fontSize: '14px'
                        }}
                      >
                        📋 Toutes les commandes
                        {allOrders.length > 0 && (
                          <span style={{ 
                            fontSize: '12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            minWidth: '20px',
                            textAlign: 'center'
                          }}>
                            {allOrders.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setActiveView('dashboard');
                          setIsDropdownOpen(false);
                          document.getElementById('favoris-section')?.scrollIntoView({behavior: 'smooth'});
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          marginBottom: '8px', 
                          background: '#f1f5f9', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          fontWeight: 600, 
                          display: 'flex', 
                          alignItems: 'center',
                          fontSize: '14px'
                        }}
                      >
                        ❤️ Favoris
                        {wishlist.length > 0 && (
                          <span style={{ 
                            fontSize: '12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            minWidth: '20px',
                            textAlign: 'center',
                            marginLeft: '8px'
                          }}>
                            {wishlist.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => signOut()}
                        style={{ 
                          width: '100%', 
                          padding: '10px', 
                          background: '#ef4444', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px', 
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}
                      >
                        Se déconnecter
                      </button>
                    </DropdownMenu>
                  )}
                </AvatarWrapper>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
                    Bonjour, {session.user?.name || session.user?.email?.split('@')[0]}
                  </h2>
                  <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                    {allOrders.length > 0 ? (
                      <>
                        Vous avez <strong>{allOrders.length}</strong> commande{allOrders.length > 1 ? 's' : ''} •
                        Dont <strong>{allOrders.filter(o => o.status === "En attente").length}</strong> en attente
                      </>
                    ) : (
                      "Vous n'avez pas encore de commandes"
                    )}
                  </p>
                </div>
              </ProfileSection>
            </Card>

            {/* Carte Favoris */}
            <Card id="favoris-section">
              <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ef4444' }}>❤️</span> Mes Favoris
                {wishlist.length > 0 && (
                  <span style={{ 
                    fontSize: '12px', 
                    backgroundColor: '#f1f5f9', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    marginLeft: '8px'
                  }}>
                    {wishlist.length} produit{wishlist.length > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              {!wishlist.length ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  Aucun produit dans vos favoris.
                </p>
              ) : (
                <WishlistGrid>
                  {wishlist.map(w => w.product && (
                    <Link href={`/product/${w.product._id}`} key={w._id} style={{ textDecoration: 'none' }}>
                      <WishItem>
                        <img 
                          src={w.product.images?.[0] || "/placeholder.png"} 
                          alt={w.product.title} 
                          onError={(e) => {
                            e.target.src = "/placeholder.png";
                          }}
                        />
                        <p>{w.product.title}</p>
                      </WishItem>
                    </Link>
                  ))}
                </WishlistGrid>
              )}
            </Card>

            {/* Carte Statistiques Commandes */}
            <Card>
              <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span> Vue d'ensemble de vos commandes
              </h3>
              
              {allOrders.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                  Vous n'avez pas encore passé de commande.
                  <br/>
                  <Link href="/products" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                    Parcourir les produits
                  </Link>
                </p>
              ) : (
                <>
                  {/* Statistiques rapides */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '15px', 
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                        {allOrders.length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                        Total commandes
                      </div>
                    </div>
                    
                    <div style={{ 
                      background: '#f0f9ff', 
                      padding: '15px', 
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid #bae6fd'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0369a1' }}>
                        {allOrders.filter(o => o.status === "En attente").length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#0c4a6e', marginTop: '5px' }}>
                        En attente
                      </div>
                    </div>
                    
                    <div style={{ 
                      background: '#f0fdf4', 
                      padding: '15px', 
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid #bbf7d0'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
                        {allOrders.filter(o => o.status === "Prête").length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#166534', marginTop: '5px' }}>
                        Prêtes
                      </div>
                    </div>
                    
                    <div style={{ 
                      background: '#fef2f2', 
                      padding: '15px', 
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid #fecaca'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b' }}>
                        {allOrders.filter(o => o.status === "Annulée").length}
                      </div>
                      <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '5px' }}>
                        Annulées
                      </div>
                    </div>
                  </div>

                  {/* Bouton pour voir toutes les commandes */}
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                      onClick={() => setActiveView('orders')}
                      style={{
                        padding: '12px 24px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      📋 Voir toutes mes commandes
                      <span style={{ 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        padding: '2px 8px', 
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {allOrders.length}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </Card>
          </>
        )}
        <ToastContainer 
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Container>
    </>
  );
}