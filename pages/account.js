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
  position: relative;
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
  min-height: 40px;
`;

const WishItemPrice = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #166534;
  margin-top: 5px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  background: #f8fafc;
  border-radius: 12px;
  margin: 20px 0;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #fecaca;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: #ef4444;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 10;
  &:hover {
    background: #fff;
    transform: scale(1.1);
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default function AccountPage() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [activeView, setActiveView] = useState('orders');
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const dropdownRef = useRef(null);

  const fetchWishlist = async () => {
    try {
      const wishlistRes = await fetch("/api/wishlist");
      if (wishlistRes.ok) {
        const wishlistData = await wishlistRes.json();
        if (Array.isArray(wishlistData)) {
          // Filtrer les éléments invalides et formater les données
          const validWishlist = wishlistData
            .filter(item => item && item.product && item.product._id)
            .map(item => ({
              ...item,
              product: {
                ...item.product,
                price: item.product.price || 0,
                title: item.product.title || "Produit sans nom",
                images: item.product.images || ["/placeholder.png"]
              }
            }));
          
          console.log("Wishlist chargée:", validWishlist.length, "produits");
          setWishlist(validWishlist);
        }
      } else {
        console.error("Erreur de réponse API wishlist:", await wishlistRes.text());
      }
    } catch (error) {
      console.error("Erreur chargement favoris:", error);
      toast.error("Erreur lors du chargement des favoris");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (status === "authenticated") {
        setLoading(true);
        try {
          await fetchWishlist();
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
  }, [status]);

  // Écouter les événements de mise à jour des favoris
  useEffect(() => {
    const handleWishlistUpdate = () => {
      fetchWishlist();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
    };
  }, []);

  const handleRemoveWishlistItem = async (productId) => {
    if (!productId) return;
    
    setRemovingId(productId);
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
      toast.error("Erreur réseau");
    } finally {
      setRemovingId(null);
    }
  };

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
                {activeView === 'favoris' && wishlist.length > 0 
                  ? `${wishlist.length} produit${wishlist.length > 1 ? 's' : ''} favori${wishlist.length > 1 ? 's' : ''}`
                  : "Bienvenue sur votre compte"}
              </p>
            </div>
          </ProfileSection>
        </Card>

        {activeView === 'favoris' ? (
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
                {wishlist.map(item => {
                  const product = item.product;
                  return (
                    <div key={item._id} style={{ position: 'relative' }}>
                      <Link href={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
                        <WishItem>
                          <WishItemImage 
                            src={product.images[0] || "/placeholder.png"} 
                            alt={product.title}
                            onError={(e) => {
                              e.target.src = "/placeholder.png";      
                            }}
                          />
                          <WishItemTitle>{product.title}</WishItemTitle>
                          {product.price > 0 && (
                            <WishItemPrice>{product.price} DT</WishItemPrice>
                          )}
                        </WishItem>
                      </Link>
                      <RemoveButton
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveWishlistItem(product._id);
                        }}
                        disabled={removingId === product._id}
                        title="Retirer des favoris"
                      >
                        {removingId === product._id ? (
                          <LoadingSpinner />
                        ) : (
                          '×'
                        )}
                      </RemoveButton>
                    </div>
                  );
                })}
              </WishlistGrid>
            )}
          </Card>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <h3 style={{ marginBottom: '16px', color: '#1e293b' }}>Mes Commandes</h3>
              <p style={{ marginBottom: '24px', color: '#64748b' }}>
                Pour voir vos commandes, vous devez être dans la section "Commandes".
              </p>
              <button
                onClick={() => setActiveView('orders')}
                style={{
                  padding: '12px 24px',
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Voir mes commandes
              </button>
            </div>
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