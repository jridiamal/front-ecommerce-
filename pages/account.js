'use client';
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
  margin-top: 80px;
  background-color: #f8fafc;
  @media (min-width: 768px) { padding: 30px; }
`;
const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  width: 100%;
  max-width: 1000px;
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
  @media (min-width:640px){grid-template-columns: repeat(auto-fill,minmax(180px,1fr));gap:20px;}
`;
const WishItem = styled.div`
  border: 1px solid #f1f5f9;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  background: #fff;
  img { width: 100%; height: 120px; object-fit: contain; }
  p { font-size: 13px; margin: 8px 0 0; font-weight: 600; color: #334155; }
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
  background:${props => props.status === "Prête" ? "#dcfce7" : props.status === "Annulée" ? "#fee2e2" : "#f1f5f9"};
  color:${props => props.status === "Prête" ? "#166534" : props.status === "Annulée" ? "#991b1b" : "#475569"};
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

export default function AccountPage(){
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [showHistorique, setShowHistorique] = useState(false);

  // Fetch Orders & Wishlist & Historique
  useEffect(()=>{
    if(status==="authenticated"){
      fetch("/api/orders").then(res=>res.json()).then(data=>{
        if(Array.isArray(data)){
          const active = data.filter(o=>o.status==="En attente");
          const hist = data.filter(o=>["Annulée","Livrée","Prête"].includes(o.status));
          setOrders(active);
          setHistorique(hist);
        }
      });
      fetch("/api/wishlist").then(res=>res.json()).then(data=>Array.isArray(data)&&setWishlist(data));
    }
  },[status]);

  const handleCancelOrder = async(orderId)=>{
    if(!window.confirm("Annuler cette commande ?")) return;
    try{
      const res = await fetch("/api/orders",{
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({orderId})
      });
      if(res.ok){
        toast.success("Commande annulée");
        setOrders(orders.map(o=>o._id===orderId?{...o,status:"Annulée"}:o));
        setHistorique(prev=>[...prev, ...orders.filter(o=>o._id===orderId)]);
      }
    }catch(err){toast.error("Erreur");}
  };

  const handleDeleteHistorique = async()=>{
    if(!window.confirm("Supprimer tout l’historique ?")) return;
    try{
      const res = await fetch("/api/historique",{method:"DELETE"});
      if(res.ok){
        setHistorique([]);
        toast.success("Historique supprimé");
      } else toast.error("Erreur suppression");
    }catch(err){toast.error("Erreur réseau");}
  };

  if(status==="loading") return <><Header/><Container>Chargement...</Container></>;
  if(!session) return (
    <><Header/><Container><Card style={{textAlign:'center'}}>
      <h2>Mon Compte</h2>
      <button onClick={()=>signIn("google")} style={{padding:'12px', width:'100%', maxWidth:'300px', cursor:'pointer'}}>
        Se connecter avec Google
      </button>
    </Card></Container></>
  );

  return (
    <>
      <Header/>
      <Container>
        {/* PROFILE */}
        <Card>
          <ProfileSection>
            <AvatarWrapper onClick={()=>setIsDropdownOpen(!isDropdownOpen)}>
              <AvatarImage src={session.user?.image||"/avatar.png"} active={isDropdownOpen}/>
              {isDropdownOpen && (
                <DropdownMenu>
                  <p style={{margin:0,fontSize:'12px',color:'#64748b'}}>Connecté en tant que</p>
                  <p style={{margin:'4px 0 12px 0', fontWeight:700}}>{session.user?.email}</p>

                  <button
                    onClick={()=>setShowHistorique(!showHistorique)}
                    style={{width:'100%',padding:'8px',marginBottom:'8px',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'6px',cursor:'pointer',fontWeight:600, display:'flex', alignItems:'center', justifyContent:'space-between'}}
                  >
                    📜 Historique
                    {historique.length > 0 && !showHistorique && (
                      <span style={{
                        display:"inline-block",
                        width:"10px",
                        height:"10px",
                        borderRadius:"50%",
                        background:"#ef4444"
                      }}></span>
                    )}
                  </button>

                  <button
                    onClick={()=>signOut()}
                    style={{width:'100%', padding:'8px', background:'#ef4444', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}
                  >
                    Se déconnecter
                  </button>
                </DropdownMenu>
              )}
            </AvatarWrapper>

            <div>
              <h2 style={{margin:0,fontSize:'1.4rem'}}>Bonjour, {session.user?.name}</h2>
              <p style={{margin:0,color:'#64748b', fontSize:'14px'}}>Gérez vos commandes et favoris</p>
            </div>
          </ProfileSection>
        </Card>

        <Card>
          <h3 style={{fontSize:'18px', marginBottom:'15px'}}>❤️ Mes Favoris</h3>
          {!wishlist.length ? <p>Aucun favori.</p> : (
            <WishlistGrid>
              {wishlist.map(w=>w.product&&(
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

        <Card>
          <h3 style={{fontSize:'18px', marginBottom:'15px'}}>📦 Mes Commandes</h3>
          {!orders.length ? <p>Aucune commande.</p> : (
            <OrdersTable>
              <thead>
                <tr>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Produits</TableHeader>
                </tr>
              </thead>
              <tbody>
                {orders.map(order=>(
                  <tr key={order._id}>
                    <TableCell data-label="Statut"><StatusBadge status={order.status}>{order.status}</StatusBadge></TableCell>
                    <TableCell data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell data-label="Produits">
                      <ProductList>
                        {order.line_items.map((item,i)=>(
                          <ProductItem key={i}>
                            <ProductImage src={item.image} alt=""/>
                            <ProductText>
                              <p><b>{item.name}</b></p>
                              <p>Qté: {item.quantity} | {item.price} DT</p>
                            </ProductText>
                          </ProductItem>
                        ))}
                      </ProductList>
                      {order.status==="En attente" && <CancelButton onClick={()=>handleCancelOrder(order._id)}>Annuler la commande</CancelButton>}
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </OrdersTable>
          )}
        </Card>

        {/* HISTORIQUE */}
        {showHistorique && (
          <Card>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
              <h3 style={{fontSize:"18px"}}>📜 Historique des commandes</h3>
              <button onClick={handleDeleteHistorique}
                style={{background:"#fee2e2",color:"#991b1b",border:"1px solid #fecaca",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"12px"}}
              >
                🗑️ Tout supprimer
              </button>
            </div>
            {!historique.length ? <p style={{marginTop:"10px"}}>Aucun historique.</p> : (
              <OrdersTable>
                <tbody>
                  {historique.map(order=>(
                    <tr key={order._id}>
                      <TableCell data-label="Statut"><StatusBadge status={order.status}>{order.status}</StatusBadge></TableCell>
                      <TableCell data-label="Date">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell data-label="Produits">
                        <ProductList>
                          {order.line_items.map((item,i)=>(
                            <ProductItem key={i}>
                              <ProductImage src={item.image} alt=""/>
                              <ProductText>
                                <p><b>{item.name}</b></p>
                                <p>Qté: {item.quantity} | {item.price} DT</p>
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

        <ToastContainer position="bottom-center" />
      </Container>
    </>
  );
}
