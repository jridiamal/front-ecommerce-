import styled from "styled-components";

const FooterContainer = styled.footer`
  background: #7f7bd1;
  background: radial-gradient(circle, rgba(127, 123, 209, 1) 0%, rgba(245, 240, 240, 1) 100%);
  width: 100%;
  padding: 60px 20px 40px;
  font-family: 'Inter', sans-serif;
  border-top: 1px solid rgba(15, 23, 42, 0.05);
  flex-shrink: 0; 

  @media screen and (min-width: 768px) {
    padding: 80px 40px 40px;
  }
`;

const FooterGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;

  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr 1fr;
    gap: 40px;
  }
`;

const BrandColumn = styled.div`
  h2 {
    color: #0f172a;
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 15px;
    letter-spacing: -0.5px;
  }
  p {
    color: #475569;
    font-size: 1rem;
    line-height: 1.6;
    max-width: 400px;
  }
`;

const NavColumn = styled.div`
  h3 {
    color: #0f172a;
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 20px;
    letter-spacing: 1px;
  }
`;

const StyledLink = styled.a`
  display: block;
  color: #475569;
  text-decoration: none;
  margin-bottom: 12px;
  font-size: 0.95rem;
  transition: all 0.2s ease;

  &:hover {
    color: #1e40af;
    padding-left: 5px;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
  
  a {
    color: #1e40af;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Copyright = styled.div`
  max-width: 1200px;
  margin: 60px auto 0;
  padding-top: 30px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #64748b;
  font-size: 0.85rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
`;

export default function Footer() {
  return (
    <FooterContainer>
      <FooterGrid>
        <BrandColumn>
          <h2>Société F.B.M</h2>
          <p>
excellence au service de votre savoir. Découvrez notre large sélection de fournitures scolaires, livres, et accessoires de bureau soigneusement sélectionnés.          </p>
         
        </BrandColumn>

        <NavColumn>
          <h3>Navigation</h3>
          <StyledLink href="/products">Boutique</StyledLink>
          <StyledLink href="/categories">Catégories</StyledLink>
          <StyledLink href="/cart">Panier</StyledLink>
        </NavColumn>

        <NavColumn>
          <h3>Aide & Contact</h3>
          <StyledLink href="/contact">Contact</StyledLink>
       
        </NavColumn>
      </FooterGrid>

      <Copyright>
        <span>© {new Date().getFullYear()} Frères Ben Marzouk. Tous droits réservés.</span>
        <span>Ben arous , Tunisie</span>
      </Copyright>
    </FooterContainer>
  );
}