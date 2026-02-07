"use client";
import React, { useState, useEffect, useRef } from "react";
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
  border: ${props => (props.$active ? "3px solid #2563eb" : "2px solid #e2e8f0")};
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

const TableCell = styled.td`
  padding: 12px; 
  border-bottom: 1px solid #f1f5f9;
  @media (max-width: 800px) {
    &:last-child {
      border-bottom: none;
    }
  }
`;

const WishlistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 15px;
  @media (min-width: 640px) { 
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
    gap: 20px; 
  }
`;

const WishItem = styled.div`
  border: 1px solid #f1f5f9;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    border-color: #e2e8f0;
  }
`;

const WishItemImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: contain;
  margin-bottom: 10px;
  border-radius: 8px;
  background: #f8fafc;
  @media (min-width: 640px) { height: 160px; }
`;

const WishItemTitle = styled.p`
  font-size: 14px;
  margin: 8px 0;
  font-weight: 600;
  color: #334155;
  line-height: 1.3;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const WishItemPrice = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #166534;
  margin-top: 5px;
`;

const ProductList = styled.div`
  display: flex; 
  flex-direction: column; 
  gap: 10px;
`;

const ProductItem = styled.div`
  display: flex; 
  align-items: center; 
  gap: 12px;
`;

const ProductImage = styled.img`
  width: 50px; 
  height: 50px; 
  border-radius: 8px; 
  object-fit: cover; 
  flex-shrink: 0;
`;

const ProductText = styled.div`
  p {
    margin: 0; 
    font-size: 13px;
    color: #374151;
    line-height: 1.2;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  display: inline-block;
  background: ${props => 
    props.$status === "Prête" ? "#dcfce7" : 
    props.$status === "Récupérée" ? "#d1fae5" :
    props.$status === "En attente" ? "#f1f5f9" : 
    "#fee2e2"};
  color: ${props => 
    props.$status === "Prête" ? "#166534" : 
    props.$status === "Récupérée" ? "#065f46" :
    props.$status === "En attente" ? "#475569" : 
    "#991b1b"};
`;

const CancelButton = styled.button`
  padding: 8px 15px;
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
  transition: all 0.2s;
  &:hover {
    background: #ffe4e6;
  }
  @media(min-width:768px){ 
    width: auto; 
    margin-top: 0;
  }
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
`;

const FilterButton = styled.button`
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid ${props => props.$active ? '#2563eb' : '#cbd5e1'};
  background: ${props => props.$active ? '#dbeafe' : 'white'};
  color: ${props => props.$active ? '#1e40af' : '#475569'};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${props => props.$active ? '#dbeafe' : '#f8fafc'};
    border-color: ${props => props.$active ? '#2563eb' : '#94a3b8'};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
  margin: 20px 0;
`;

const DeleteHistoryButton = styled.button`
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  &:hover {
    background: #fecaca;
  }
`;

const TimeBadge = styled.div`
  font-size: 11px;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #fef3c7;
  padding: 3px 10px;
  border-radius: 12px;
  align-self: flex-start;
  margin-top: 6px;
  font-weight: 500;
`;

const calculateTimeRemaining = (createdAt) => {
  if (!createdAt) return null;
  
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }
};

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeView, setActiveView] = useState('orders');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const ordersRes = await fetch("/api/orders");
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
          setAllOrders(ordersData);
        }
      }
    } catch (error) {
      console.error("Erreur chargement commandes:", error);
    }
  };

  const fetchWishlist = async () => {
    try {
      const wishlistRes = await fetch("/api/wishlist");
      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json();
        if (Array.isArray(wishlistData)) {
          const validWishlist = wishlistData.filter(item => item.product && item.product._id);
          setWishlist(validWishlist);
        }
      }
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (status === "authenticated") {
        setLoading(true);
        try {
          await Promise.all([
            fetchOrders(),
            fetchWishlist()
          ]);
        } catch (err) {
          console.error("Erreur chargement données:", err);
          toast.error("Erreur lors du chargement des données");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadData();
    
    // Rafraîchir périodiquement les favoris (toutes les 10 secondes)
    const intervalId = setInterval(() => {
      if (status === "authenticated" && activeView === 'favoris') {
        fetchWishlist();
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [status, activeView]);
// Dans AccountPage.js, remplacez l'effet existant par :
useEffect(() => {
  const handleWishlistUpdate = () => {
    if (status === "authenticated") {
      fetchWishlist();
    }
  };

  // Écouter l'événement
  window.addEventListener('wishlist-updated', handleWishlistUpdate);
  
  // Rafraîchir aussi lors du focus de la fenêtre
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && status === "authenticated") {
      fetchWishlist();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    window.removeEventListener('wishlist-updated', handleWishlistUpdate);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [status]);

  const getFilteredOrders = () => {
    if (!Array.isArray(allOrders)) return [];
    
    if (statusFilter === 'all') return allOrders;
    if (statusFilter === 'pending') return allOrders.filter(o => o.status === "En attente");
    if (statusFilter === 'ready') return allOrders.filter(o => o.status === "Prête");
    if (statusFilter === 'cancelled') return allOrders.filter(o => o.status === "Annulée");
    if (statusFilter === 'delivered') return allOrders.filter(o => o.status === "Récupérée");
    
    return allOrders;
  };

  const filteredOrders = getFilteredOrders();

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) return;
    
    try {
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      
      if (res.ok) {
        toast.success("Commande annulée avec succès");
        setAllOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, status: "Annulée" } : order
        ));
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de l'annulation");
      }
    } catch (err) { 
      console.error("Erreur annulation:", err);
      toast.error("Erreur réseau"); 
    }
  };

  const handleDeleteHistory = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer l'historique des commandes terminées ?")) return;
    
    try {
      const res = await fetch("/api/historique", { method: "DELETE" });
      
      if (res.ok) {
        setAllOrders(prev => prev.filter(order => order.status === "En attente"));
        toast.success("Historique supprimé avec succès");
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (err) { 
      console.error("Erreur suppression historique:", err);
      toast.error("Erreur réseau"); 
    }
  };

  const handleRemoveWishlistItem = async (productId) => {
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setWishlist(prev => prev.filter(item => item.product._id !== productId));
        toast.success("Produit retiré des favoris");
        // Émettre l'événement pour mettre à jour les autres composants
        window.dispatchEvent(new CustomEvent('wishlist-updated'));
      } else {
        const error = await res.json();
        toast.error(error.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Erreur suppression favori:", err);
      toast.error("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  const refreshWishlist = () => {
    fetchWishlist();
    toast.info("Favoris rafraîchis");
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Header />
        <Container>
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <p>Chargement de votre compte...</p>
          </Card>
        </Container>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Header />
        <Container>
          <Card style={{ textAlign: 'center', maxWidth: '500px', margin: '50px auto' }}>
            <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>Mon Compte</h2>
            <p style={{ marginBottom: '30px', color: '#64748b' }}>
              Connectez-vous pour accéder à vos commandes et favoris
            </p>
            <button 
              onClick={() => signIn("google")} 
              style={{ 
                padding: '12px 24px', 
                cursor: 'pointer',
                background: '#4285F4',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                margin: '10px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                maxWidth: '300px',
                margin: '0 auto'
              }}
            >
              <img 
                src="https://www.google.com/favicon.ico" 
                alt="Google" 
                style={{ width: '20px', height: '20px' }}
              />
              Se connecter avec Google
            </button>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container>
        <Card>
          <ProfileSection>
            <AvatarWrapper ref={dropdownRef}>
              <AvatarImage 
                src={session.user?.image || "/avatar.png"} 
                $active={isDropdownOpen} 
                alt="Avatar"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onError={(e) => {
                  e.target.src = "/avatar.png";
                }}
              />
              {isDropdownOpen && (
                <DropdownMenu>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Connecté en tant que</p>
                  <p style={{ margin: '4px 0 12px 0', fontWeight: 700, fontSize: '14px' }}>
                    {session.user?.email}
                  </p>
                  
                  <button
                    onClick={() => {
                      setActiveView('orders');
                      setIsDropdownOpen(false);
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      marginBottom: '8px', 
                      background: activeView === 'orders' ? '#dbeafe' : '#f1f5f9', 
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
                    📋 Mes Commandes
                    <span style={{ 
                      fontSize: '12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {allOrders.length}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('favoris');
                      setIsDropdownOpen(false);
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '10px', 
                      marginBottom: '8px', 
                      background: activeView === 'favoris' ? '#fce7f3' : '#f1f5f9', 
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
                    ❤️ Mes Favoris
                    {wishlist.length > 0 && (
                      <span style={{ 
                        fontSize: '12px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px'
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
                      background: '#f1f5f9', 
                      color: '#64748b', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      marginTop: '10px'
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
                  `Vous avez ${allOrders.length} commande${allOrders.length > 1 ? 's' : ''}`
                ) : (
                  "Bienvenue sur votre compte"
                )}
              </p>
            </div>
          </ProfileSection>
        </Card>

        {activeView === 'orders' ? (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '20px' }}>
              <h3 style={{ fontSize: "20px", margin: 0, color: '#1e293b' }}>📋 Mes Commandes</h3>
              
              {allOrders.filter(o => ["Prête", "Annulée", "Récupérée"].includes(o.status)).length > 0 && (
                <DeleteHistoryButton onClick={handleDeleteHistory}>
                  🗑️ Supprimer l'historique
                </DeleteHistoryButton>
              )}
            </div>

            <FilterButtons>
              <FilterButton 
                $active={statusFilter === 'all'}
                onClick={() => setStatusFilter('all')}
              >
                Toutes ({allOrders.length})
              </FilterButton>
              <FilterButton 
                $active={statusFilter === 'pending'}
                onClick={() => setStatusFilter('pending')}
              >
                En attente ({allOrders.filter(o => o.status === "En attente").length})
              </FilterButton>
              <FilterButton 
                $active={statusFilter === 'ready'}
                onClick={() => setStatusFilter('ready')}
              >
                Prêtes ({allOrders.filter(o => o.status === "Prête").length})
              </FilterButton>
              
              <FilterButton 
                $active={statusFilter === 'cancelled'}
                onClick={() => setStatusFilter('cancelled')}
              >
                Annulées ({allOrders.filter(o => o.status === "Annulée").length})
              </FilterButton>
              <FilterButton 
                $active={statusFilter === 'delivered'}
                onClick={() => setStatusFilter('delivered')}
              >
                Récupérée ({allOrders.filter(o => o.status === "Récupérée").length})
              </FilterButton>
            </FilterButtons>

            {filteredOrders.length === 0 ? (
              <EmptyState>
                {statusFilter === 'all' ? (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <h4 style={{ marginBottom: '8px', color: '#334155' }}>Aucune commande</h4>
                    <p style={{ marginBottom: '20px' }}>Vous n'avez pas encore passé de commande.</p>
                    <Link href="/products">
                      <button style={{
                        padding: '10px 20px',
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}>
                        Voir les produits
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <p>Aucune commande avec ce statut.</p>
                    <button 
                      onClick={() => setStatusFilter('all')}
                      style={{
                        padding: '8px 16px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginTop: '10px'
                      }}
                    >
                      Voir toutes les commandes
                    </button>
                  </>
                )}
              </EmptyState>
            ) : (
              <OrdersTable>
                <thead>
                  <tr>
                    <TableHeader>N° Commande</TableHeader>
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
                      <tr key={order._id}>
                        <TableCell data-label="N° Commande">
                          <span style={{ 
                            fontSize: '12px', 
                            fontFamily: 'monospace',
                            color: '#64748b',
                            fontWeight: '500'
                          }}>
                            #{order._id?.toString().slice(-8) || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell data-label="Date">
                          {order.createdAt ? (
                            new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })
                          ) : 'Date inconnue'}
                        </TableCell>
                        <TableCell data-label="Statut">
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <StatusBadge $status={order.status || "Inconnu"}>
                              {order.status || "Inconnu"}
                            </StatusBadge>
                            {order.status === "En attente" && timeInfo && (
                              <TimeBadge>
                                <span style={{ fontSize: "10px" }}>⏳</span>
                                {timeInfo}
                              </TimeBadge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-label="Produits">
                          <ProductList>
                            {Array.isArray(order.line_items) && order.line_items.length > 0 ? (
                              order.line_items.map((item, i) => (
                                <ProductItem key={i}>
                                  <ProductImage 
                                    src={item.image || item.price_data?.product_data?.images?.[0] || "/placeholder.png"} 
                                    alt={item.name} 
                                    onError={(e) => {
                                      e.target.src = "/placeholder.png";
                                    }}
                                  />
                                  <ProductText>
                                    <p><b>{item.name || item.price_data?.product_data?.name || 'Produit'}</b></p>
                                    <p>Qté: {item.quantity} × {item.price || (item.price_data?.unit_amount/100) || 0} DT</p>
                                  </ProductText>
                                </ProductItem>
                              ))
                            ) : (
                              <p style={{ fontSize: '12px', color: '#64748b' }}>Aucun produit</p>
                            )}
                          </ProductList>
                        </TableCell>
                        <TableCell data-label="Total">
                          <strong style={{ fontSize: '15px' }}>{order.total || 0} DT</strong>
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
                                background: '#dcfce7',
                                color: '#166534',
                                border: '1px solid #86efac',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%'
                              }}
                              onClick={() => toast.info("Votre commande est prête pour récupération")}
                            >
                              À récupérer
                            </button>
                          ) : order.status === "Annulée" ? (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#991b1b',
                              fontWeight: '600'
                            }}>
                              ❌ Annulée
                            </span>
                          ) : (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#065f46',
                              fontWeight: '600'       
                            }}>
                              ✅ Récupérée
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
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: '20px' }}>
              <h3 style={{ fontSize: "20px", margin: 0, color: '#1e293b' }}>
                ❤️ Mes Favoris
                {wishlist.length > 0 && (
                  <span style={{ 
                    fontSize: '14px',
                    backgroundColor: '#f1f5f9',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    marginLeft: '10px',
                    fontWeight: '600',
                    color: '#475569'
                  }}>
                    {wishlist.length} produit{wishlist.length > 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <button
                onClick={refreshWishlist}
                style={{
                  padding: '8px 16px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ↻ Rafraîchir
              </button>
            </div>

            {wishlist.length === 0 ? (
              <EmptyState>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
                <h4 style={{ marginBottom: '8px', color: '#334155' }}>Aucun favori</h4>
                <p style={{ marginBottom: '20px' }}>
                  Ajoutez des produits à vos favoris pour les retrouver facilement.
                </p>
                <Link href="/products">
                  <button style={{
                    padding: '10px 20px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}>
                    Parcourir les produits
                  </button>
                </Link>
              </EmptyState>
            ) : (
              <WishlistGrid>
                {wishlist.map(item => (
                  <div key={item._id} style={{ position: 'relative' }}>
                    <Link href={`/product/${item.product._id}`} style={{ textDecoration: 'none' }}>
                      <WishItem>
                        <WishItemImage 
                          src={item.product.images?.[0] || "/placeholder.png"} 
                          alt={item.product.title}
                          onError={(e) => {
                            e.target.src = "/placeholder.png";      
                          }}
                        />
                        <WishItemTitle>{item.product.title || "Produit sans nom"}</WishItemTitle>
                        {item.product.price && (
                          <WishItemPrice>{item.product.price} DT</WishItemPrice>
                        )}
                      </WishItem>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveWishlistItem(item.product._id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #fecaca',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#ef4444',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                      }}
                      title="Retirer des favoris"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </WishlistGrid>
            )}
          </Card>
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