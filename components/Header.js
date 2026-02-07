"use client";
import Link from "next/link";
import styled from "styled-components";
import Center from "@/components/Center";
import { useContext, useState, useEffect, useRef } from "react";
import { CartContext } from "@/components/CartContext";
import { AnimationContext } from "@/components/AnimationContext"; 
import { useRouter } from "next/router";

const PrimaryColor = "#1e40af"; 
const DarkText = "#0f172a";
const InactiveColor = "#a0aec0";

const StyledHeader = styled.header`
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: ${(props) =>
    props.scrolled ? "rgba(255, 255, 255, 0.85)" : "transparent"};
  backdrop-filter: ${(props) => (props.scrolled ? "blur(12px)" : "none")};
  box-shadow: ${(props) =>
    props.scrolled ? "0 4px 20px rgba(0,0,0,0.05)" : "none"};
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
  display: flex;
  flex-direction: column;
  font-weight: 800;
  color: ${DarkText};
  line-height: 1.1;
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  span {
    font-size: 0.80rem;
    color: ${PrimaryColor};
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 600;
  }
`;

const DesktopNav = styled.nav`
  display: none;
  gap: 32px;
  align-items: center;
  @media screen and (min-width: 768px) {
    display: flex;
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: ${props => props.$active ? PrimaryColor : DarkText};
  font-weight: 600;
  font-size: 0.95rem;
  position: relative;
  transition: color 0.3s ease; 
  display: flex;
  align-items: center;
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

const MobileBottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 15px rgba(0,0,0,0.05);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid rgba(0,0,0,0.05);
  @media screen and (min-width: 768px) { display: none; }
`;

const MobileNavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  font-size: 10px;
  font-weight: 600;
  color: ${props => props.$active ? PrimaryColor : InactiveColor};
  gap: 4px;
  transition: all 0.2s ease;
  svg { width: 24px; height: 24px; }
`;

const IconWrapper = styled.div` 
  position: relative; 
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MobileBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -8px;
  background: ${PrimaryColor};
  color: white;
  font-size: 9px;
  min-width: 16px;
  height: 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
`;

const HomeIcon = () => ( <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> );
const PackageIcon = () => ( <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> );
const UserIcon = () => ( <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> );
const CartIcon = () => ( <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> );
const CategoriesIcon = () => ( <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg> );

export default function Header() {
  const { cartProducts } = useContext(CartContext);
  const { cartRef } = useContext(AnimationContext); 
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // Use separate refs for desktop and mobile
  const desktopCartRef = useRef(null);
  const mobileCartRef = useRef(null);

  // Sync refs with AnimationContext
  useEffect(() => {
    if (cartRef) {
      // Set to desktop ref by default, but AnimationContext will update
      // based on which is visible
      cartRef.current = desktopCartRef.current || mobileCartRef.current;
    }
  }, [cartRef]);

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
                Société
                <span>F.B.M</span>
              </LogoText>
            </LogoContainer>
            
            <DesktopNav>
              <NavLink href="/" $active={active("/")}>Accueil</NavLink>
              <NavLink href="/products" $active={active("/products")}>Produits</NavLink>
              <NavLink href="/categories" $active={active("/categories")}>Catégories</NavLink>
              <NavLink href="/account" $active={active("/account")}>Compte</NavLink>
              <NavLink href="/cart" $active={active("/cart")}>
                <span ref={desktopCartRef}>Panier</span>
                {cartProducts?.length > 0 && <CartBadge>{cartProducts.length}</CartBadge>}
              </NavLink>
            </DesktopNav>
          </Wrapper>
        </Center>
      </StyledHeader>

      <MobileBottomNav>
        <MobileNavItem href="/" $active={active("/")}>
          <HomeIcon />
          <span>Accueil</span>
        </MobileNavItem>
        <MobileNavItem href="/products" $active={active("/products")}>
          <PackageIcon />
          <span>Produits</span>
        </MobileNavItem>
        <MobileNavItem href="/categories" $active={active("/categories")}>
          <CategoriesIcon />
          <span>Catégories</span>
        </MobileNavItem>
        <MobileNavItem href="/account" $active={active("/account")}>
          <UserIcon />
          <span>Compte</span>
        </MobileNavItem>
        <MobileNavItem href="/cart" $active={active("/cart")}>
          <IconWrapper ref={mobileCartRef}>
            <CartIcon />
            {cartProducts?.length > 0 && <MobileBadge>{cartProducts.length}</MobileBadge>}
          </IconWrapper>
          <span>Panier</span>
        </MobileNavItem>
      </MobileBottomNav>
    </>
  );
}