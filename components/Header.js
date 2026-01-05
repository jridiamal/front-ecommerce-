import Link from "next/link";
import styled from "styled-components";
import Center from "@/components/Center";
import { useContext, useState, useEffect } from "react";
import { CartContext } from "@/components/CartContext";
import { useRouter } from "next/router";

const PrimaryColor = "#1e40af"; 
const InactiveColor = "#94a3b8";

/* ================== STYLES RESPONSIVE ================== */

const MobileNavContainer = styled.div`
  position: fixed;
  /* Utilisation de padding-bottom safe-area pour les iPhone sans bouton home */
  bottom: calc(15px + env(safe-area-inset-bottom)); 
  left: 50%;
  transform: translateX(-50%);
  width: 95%; /* Un peu plus large sur très petits écrans */
  max-width: 420px;
  height: 65px;
  z-index: 1001;
  display: flex;
  justify-content: space-around;
  align-items: center;
  
  @media screen and (min-width: 768px) {
    display: none;
  }
`;

const NavBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  box-shadow: 0 10px 40px rgba(0,0,0,0.12);
  border-radius: 30px;
  z-index: -1;
  
  /* Masque SVG pour la courbe centrale fluide */
  mask: url("data:image/svg+xml,%3Csvg width='375' height='70' viewBox='0 0 375 70' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 25C0 11.1929 11.1929 0 25 0H132.333C143.23 0 153.251 6.00769 158.375 15.631L168.031 33.7362C175.769 48.2443 196.231 48.2443 203.969 33.7362L213.625 15.631C218.749 6.00769 228.77 0 239.667 0H350C363.807 0 375 11.1929 375 25V70H0V25Z' fill='white'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  -webkit-mask: url("data:image/svg+xml,%3Csvg width='375' height='70' viewBox='0 0 375 70' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 25C0 11.1929 11.1929 0 25 0H132.333C143.23 0 153.251 6.00769 158.375 15.631L168.031 33.7362C175.769 48.2443 196.231 48.2443 203.969 33.7362L213.625 15.631C218.749 6.00769 228.77 0 239.667 0H350C363.807 0 375 11.1929 375 25V70H0V25Z' fill='white'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
`;

const CentralButton = styled(Link)`
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%);
  width: 58px;
  height: 58px;
  background: linear-gradient(135deg, #4f46e5 0%, #1e40af 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 25px rgba(30, 64, 175, 0.4);
  z-index: 1002;
  border: 4px solid #eee; /* Créer un léger espace visuel */
  
  &:active {
    transform: translateX(-50%) scale(0.9);
  }

  svg {
    width: 28px;
    height: 28px;
  }
`;

const NavItem = styled(Link)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  font-size: 10px;
  font-weight: 700;
  color: ${props => props.$active ? PrimaryColor : InactiveColor};
  transition: all 0.2s ease;
  padding-top: 5px;

  svg {
    width: 22px;
    height: 22px;
    margin-bottom: 2px;
    /* Effet de remplissage si actif */
    fill: ${props => props.$active ? 'currentColor' : 'none'};
    stroke: currentColor;
  }

  @media screen and (max-width: 360px) {
    font-size: 9px; /* Adaptation iPhone SE */
  }
`;

const Badge = styled.div`
  position: absolute;
  top: 0;
  right: 20%;
  background: #ef4444;
  color: white;
  font-size: 9px;
  min-width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  font-weight: 800;
`;

/* ================== COMPONENT ================== */

export default function Header() {
  const { cartProducts } = useContext(CartContext);
  const router = useRouter();
  const active = (p) => router.pathname === p;

  return (
    <>
      {/* Header Desktop existant ici ... */}

      <MobileNavContainer>
        <NavBackground />
        
        <NavItem href="/" $active={active("/")}>
          <svg viewBox="0 0 24 24" strokeWidth="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span>Accueil</span>
        </NavItem>

        <NavItem href="/categories" $active={active("/categories")}>
          <svg viewBox="0 0 24 24" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span>Filtres</span>
        </NavItem>

        {/* Espace pour le bouton central */}
        <div style={{ width: '70px' }} />

        <CentralButton href="/products">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12M6 12h12" /></svg>
        </CentralButton>

        <NavItem href="/account" $active={active("/account")}>
          <svg viewBox="0 0 24 24" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span>Profil</span>
        </NavItem>

        <NavItem href="/cart" $active={active("/cart")}>
          <div style={{position:'relative'}}>
             <svg viewBox="0 0 24 24" strokeWidth="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             {cartProducts?.length > 0 && <Badge>{cartProducts.length}</Badge>}
          </div>
          <span>Panier</span>
        </NavItem>
      </MobileNavContainer>
    </>
  );
}