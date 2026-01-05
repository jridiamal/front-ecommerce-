import Link from "next/link";
import styled from "styled-components";
import Center from "@/components/Center";
import { useContext, useState, useEffect } from "react";
import { CartContext } from "@/components/CartContext";
import { useRouter } from "next/router";

// --- Couleurs Thème ---
const PrimaryColor = "#1e40af"; 
const DarkText = "#0f172a";
const InactiveColor = "#94a3b8";

/* ================== STYLES HEADER DESKTOP ================== */
const StyledHeader = styled.header`
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  transition: all 0.4s ease;
  background-color: ${(props) => (props.scrolled ? "rgba(255, 255, 255, 0.9)" : "transparent")};
  backdrop-filter: ${(props) => (props.scrolled ? "blur(12px)" : "none")};
  box-shadow: ${(props) => (props.scrolled ? "0 4px 20px rgba(0,0,0,0.05)" : "none")};
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => (props.scrolled ? "10px 0" : "20px 0")};
  transition: padding 0.3s ease;
`;

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
`;

const LogoText = styled.div`
  font-weight: 800;
  color: ${DarkText};
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  span { color: ${PrimaryColor}; font-size: 0.75rem; display: block; text-transform: uppercase; }
`;

const DesktopNav = styled.nav`
  display: none;
  gap: 32px;
  @media screen and (min-width: 768px) { display: flex; align-items: center; }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: ${props => props.$active ? PrimaryColor : DarkText};
  font-weight: 600;
  font-size: 0.95rem;
  &:hover { color: ${PrimaryColor}; }
`;

/* ================== NAVIGATION MOBILE (DESIGN IMAGE) ================== */

const MobileNavContainer = styled.div`
  position: fixed;
  bottom: 20px; /* Décollé du bas comme sur l'image */
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  height: 70px;
  z-index: 1001;
  display: flex;
  justify-content: space-around;
  align-items: center;
  
  @media screen and (min-width: 768px) { display: none; }
`;

// Le fond blanc avec la courbe
const NavBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border-radius: 25px;
  z-index: -1;
  /* Masque pour créer la courbe au centre */
  clip-path: polygon(0 0, 35% 0, 40% 10%, 45% 20%, 50% 25%, 55% 20%, 60% 10%, 65% 0, 100% 0, 100% 100%, 0 100%);
  
  /* Alternative avec SVG pour une courbe plus lisse */
  mask: url("data:image/svg+xml,%3Csvg width='375' height='70' viewBox='0 0 375 70' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 25C0 11.1929 11.1929 0 25 0H132.333C143.23 0 153.251 6.00769 158.375 15.631L168.031 33.7362C175.769 48.2443 196.231 48.2443 203.969 33.7362L213.625 15.631C218.749 6.00769 228.77 0 239.667 0H350C363.807 0 375 11.1929 375 25V70H0V25Z' fill='white'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
`;

const CentralButton = styled(Link)`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #6366f1 0%, #3d47dd 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 20px rgba(61, 71, 221, 0.4);
  z-index: 1002;
  transition: transform 0.2s;
  &:active { transform: translateX(-50%) scale(0.9); }
  svg { width: 30px; height: 30px; stroke-width: 2.5; }
`;

const NavItem = styled(Link)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
  color: ${props => props.$active ? PrimaryColor : InactiveColor};
  gap: 4px;
  position: relative;
  z-index: 1001;

  svg { width: 24px; height: 24px; }
`;

const Badge = styled.div`
  position: absolute;
  top: -4px;
  right: 15%;
  background: #ff4d4d;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
  border: 2px solid white;
`;

// --- Icônes ---
const HomeIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>);
const CategoriesIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>);
const UserIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const CartIcon = () => (<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);

export default function Header() {
  const { cartProducts } = useContext(CartContext);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const active = (p) => router.pathname === p;

  return (
    <>
      <StyledHeader scrolled={scrolled}>
        <Center>
          <Wrapper scrolled={scrolled}>
            <LogoContainer href="/">
              <LogoText>BEN MARZOUK<span>Librairie</span></LogoText>
            </LogoContainer>
            <DesktopNav>
              <NavLink href="/" $active={active("/")}>Accueil</NavLink>
              <NavLink href="/products" $active={active("/products")}>Produits</NavLink>
              <NavLink href="/categories" $active={active("/categories")}>Catégories</NavLink>
              <NavLink href="/account" $active={active("/account")}>Compte</NavLink>
              <NavLink href="/cart" $active={active("/cart")}>Panier ({cartProducts?.length})</NavLink>
            </DesktopNav>
          </Wrapper>
        </Center>
      </StyledHeader>

      <MobileNavContainer>
        <NavBackground />
        
        <NavItem href="/" $active={active("/")}>
          <HomeIcon />
          <span>Home</span>
        </NavItem>

        <NavItem href="/categories" $active={active("/categories")}>
          <CategoriesIcon />
          <span>Catégorie</span>
        </NavItem>

        {/* Espace vide au milieu pour laisser place au bouton central */}
        <div style={{ width: '60px' }} />

        <CentralButton href="/products">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12" /></svg>
        </CentralButton>

        <NavItem href="/account" $active={active("/account")}>
          <UserIcon />
          <span>Compte</span>
        </NavItem>

        <NavItem href="/cart" $active={active("/cart")}>
          <CartIcon />
          {cartProducts?.length > 0 && <Badge>{cartProducts.length}</Badge>}
          <span>Panier</span>
        </NavItem>
      </MobileNavContainer>
    </>
  );
}