import Center from "@/components/Center";
import styled from "styled-components";
import ButtonLink from "@/components/ButtonLink";
import { useContext } from "react";
import { CartContext } from "@/components/CartContext";

/* ================== STYLES OPTIMISÉS ================== */

const Bg = styled.div`
  width: 100%;
  min-height: 50vh; /* Ajusté pour mobile */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 15px; /* Padding réduit sur mobile */
  box-sizing: border-box;

  background: #7f7bd1;
  background: radial-gradient(circle, rgba(127, 123, 209, 1) 0%, rgba(245, 240, 240, 1) 100%);

  @media screen and (min-width: 768px) {
    min-height: 65vh;
    padding: 80px 40px;
  }
`;

const ColumnsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  align-items: center;
  justify-items: center; /* Centre les colonnes sur mobile */

  @media screen and (min-width: 768px) {
    grid-template-columns: 1.1fr 0.9fr;
    gap: 60px;
    justify-items: start;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center; /* Centre tout sur mobile */
  text-align: center;

  img {
    width: 100%;
    max-width: 320px; /* Taille optimale pour iPhone */
    height: auto;
    border-radius: 20px;
    object-fit: contain;
    /* Petit effet d'ombre pour l'image */
    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));
  }

  @media screen and (min-width: 768px) {
    align-items: flex-start;
    text-align: left;
    
    img {
      max-width: 500px;
    }
  }
`;

const Title = styled.h1`
  font-size: 2.2rem;
  font-weight: 800;
  line-height: 1.1;
  color: #1e293b;
  margin: 0;

  span {
    display: block;
    margin-top: 8px;
    font-size: 1.4rem;
    color: #475569;
    font-weight: 500;
  }

  @media screen and (min-width: 768px) {
    font-size: 3.8rem;
    span { font-size: 1.8rem; }
  }
`;

const Desc = styled.p`
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-top: 15px;
  max-width: 400px; /* Évite que le texte soit trop large sur mobile */

  @media screen and (min-width: 768px) {
    font-size: 1.1rem;
    max-width: 550px;
    margin-top: 25px;
  }
`;

const ButtonsWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 30px;

  @media screen and (min-width: 768px) {
    justify-content: flex-start;
    margin-top: 40px;
  }
`;

const PrimaryButtonLink = styled(ButtonLink)`
  background-color: #1e40af;
  color: white;
  padding: 14px 28px;
  font-weight: 600;
  border-radius: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 16px rgba(30, 64, 175, 0.2);

  /* Empêche le texte de se casser sur iPhone SE */
  white-space: nowrap;

  span {
    transition: transform 0.3s ease;
    font-size: 1.2rem;
  }

  &:hover {
    background-color: #1d4ed8;
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(30, 64, 175, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
`;

/* ================== COMPONENT ================== */

export default function Featured({ product }) {
  const { addProduct } = useContext(CartContext);

  return (
    <Bg>
      <Center>
        <ColumnsWrapper>
          <Column>
            <Title>
              Société <br /> <span>Frères Ben Marzouk</span>
            </Title>
            <Desc>
              L&apos;excellence au service de votre savoir. Découvrez notre large sélection de fournitures scolaires, livres, et accessoires de bureau soigneusement sélectionnés.
            </Desc>
            <ButtonsWrapper>
              <PrimaryButtonLink href={"/products"}>
                Voir les produits <span>&rarr;</span>
              </PrimaryButtonLink>
            </ButtonsWrapper>
          </Column>

          <Column>
            <img src="/13.png" alt="Librairie Frères Ben Marzouk" />
          </Column>
        </ColumnsWrapper>
      </Center>
    </Bg>
  );
}