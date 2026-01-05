import Link from "next/link";
import styled from "styled-components";
import Center from "@/components/Center";
import { useContext, useState, useEffect } from "react";
import { CartContext } from "@/components/CartContext";
import { useRouter } from "next/router";

// --- Couleurs Thème ---
const PrimaryColor = "#1e40af"; 
const DarkText = "#0f172a";
const InactiveColor = "#a0aec0";

// --- Styles Header Principal ---
const StyledHeader = styled.header`
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  /* On force le blanc sur mobile pour la lisibilité, transparent/blur sur desktop */
  background-color: ${(props) =>
    props.scrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.7)"};
  backdrop-filter: blur(12px);
  box-shadow: ${(props) =>
    props.scrolled ? "0 4px 20px rgba(0,0,0,0.05)" : "none"};

  @media screen and (min-width: 768px) {
    background-color: ${(props) =>
      props.scrolled ? "rgba(255, 255, 255, 0.85)" : "transparent"};
    backdrop-filter: ${(props) => (props.scrolled ? "blur(12px)" : "none")};
  }
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0; /* Plus compact sur mobile */
  transition: padding 0.3s ease;

  @media screen and (min-width: 768px) {
    padding: ${(props) => (props.scrolled ? "10px 0" : "20px 0")};
  }
`;

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
`;

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
  font-weight: 800;
  color: ${DarkText};
  line-height: 1.1;
  font-family: 'Inter', sans-serif;
  font-size: 1rem; /* Adapté mobile */
  
  span {
    font-size: 0.65rem;
    color: ${PrimaryColor};
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }

  @media screen and (min-width: 768px) {
    font-size: 1.1rem;
    span { font-size: 0.75rem; letter-spacing: 1.2px; }
  }
`;

const DesktopNav = styled.nav`
  display: none;
  gap: 32px;
  @media screen and (min-width: 768px) {
    display: flex;
    align-items: center;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: ${props => props.$active ? PrimaryColor : DarkText};
  font-weight: 600;
  font-size: 0.95rem;
  position: relative;
  transition: color 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: ${props => props.$active ? "100%" : "0%"};
    height: 2px;
    background-color: ${PrimaryColor};
    transition: width 0.3s ease;
  }

  &:hover {
    color: ${PrimaryColor};
    &::after { width: 100%; }
  }
`;

const CartBadge = styled.span`
  background: ${PrimaryColor};
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
  margin-left: 5px;
  font-weight: 700;
`;

// --- Styles Mobile Navigation (Bottom) ---
const MobileBottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  z-index: 1000;
  /* Protection pour iPhone (barre home) */
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid rgba(0,0,0,0.05);

  @media screen and (min-width: 768px) {
    display: none;
  }
`;

// Container spécial pour l'encoche incurvée du bouton central
const MobileNavContainer = styled.div`
  position: fixed;
  bottom: calc(15px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: 92%;
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
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
  border-radius: 25px;
  z-index: -1;
  -webkit-mask: url("data:image/svg+xml,%3Csvg width='375' height='70' viewBox='0 0 375 70' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 25C0 11.1929 11.1929 0 25 0H132.333C143.23 0 153.251 6.00769 158.375 15.631L168.031 33.7362C175.769 48.2443 196.231 48.2443 203.969 33.7362L213.625 15.631C218.749 6.00769 228.77 0 239.667 0H350C363.807 0 375 11.1929 375 25V70H0V25Z' fill='white'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
`;

const CentralButton = styled(Link)`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 55px;
  height: 55px;
  background: linear-gradient(135deg, #4f46e5 0%, #1e40af 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3);
  z-index: 1002;
  border: 3px solid #f8f8f8;
  
  svg { width: 26px; height: 26px; stroke-width: 2.5; }
`;

const MobileNavItem = styled(Link)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  font-size: 10px;
  font-weight: 700;
  color: ${props => props.$active ? PrimaryColor : InactiveColor};
  gap: 2px;
  z-index: 1001;
  
  svg { width: 22px; height: 22px; }
`;

const Badge = styled.div`
  position: absolute;
  top: -2px;
  right: 18%;
  background: #ef4444;
  color: white;
  font-size: 9px;
  min-width: 15px;
  height: 15px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid white;
  font-weight: 800;
`;

// --- Icônes SVG ---
const HomeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
const CategoriesIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const UserIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const CartIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);

// --- Composant Principal ---
export default function Header() {
  const { cartProducts } = useContext(CartContext);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
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
              <LogoText>
                BEN MARZOUK
                <span>Librairie</span>
              </LogoText>
            </LogoContainer>
            
            <DesktopNav>
              <NavLink href="/" $active={active("/")}>Accueil</NavLink>
              <NavLink href="/products" $active={active("/products")}>Produits</NavLink>
              <NavLink href="/categories" $active={active("/categories")}>Catégories</NavLink>
              <NavLink href="/account" $active={active("/account")}>Compte</NavLink>
              <NavLink href="/cart" $active={active("/cart")}>
                Panier 
                {cartProducts?.length > 0 && <CartBadge>{cartProducts.length}</CartBadge>}
              </NavLink>
            </DesktopNav>
          </Wrapper>
        </Center>
      </StyledHeader>

      <MobileNavContainer>
        <NavBackground />
        
        <MobileNavItem href="/" $active={active("/")}>
          <HomeIcon />
          <span>Accueil</span>
        </MobileNavItem>

        <MobileNavItem href="/categories" $active={active("/categories")}>
          <CategoriesIcon />
          <span>Filtres</span>
        </MobileNavItem>

        <div style={{ width: '60px' }} /> {/* Espace pour le bouton central */}

        <CentralButton href="/products">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12" /></svg>
        </CentralButton>

        <MobileNavItem href="/account" $active={active("/account")}>
          <UserIcon />
          <span>Compte</span>
        </MobileNavItem>

        <MobileNavItem href="/cart" $active={active("/cart")}>
          <div style={{position:'relative'}}>
            <CartIcon />
            {cartProducts?.length > 0 && <Badge>{cartProducts.length}</Badge>}
          </div>
          <span>Panier</span>
        </MobileNavItem>
      </MobileNavContainer>
    </>
  );
}