import Center from "@/components/Center";
import styled from "styled-components";
import ButtonLink from "@/components/ButtonLink";
import { useContext } from "react";
import { CartContext } from "@/components/CartContext";

const Bg = styled.div`
  width: 100%;             /* important pour mobile */
  min-height: 60vh;
  display: flex;
  flex-direction: column;  /* mobile = column */
  align-items: center;
  justify-content: center;
  padding: 40px 20px;      /* padding responsive pour mobile */
  box-sizing: border-box;  /* éviter débordement */

  background: #7f7bd1;
  background: radial-gradient(circle, rgba(127, 123, 209, 1) 0%, rgba(245, 240, 240, 1) 100%);

  @media screen and (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    padding: 80px 40px;
  }
`;


const Title = styled.h1`
  font-size: 2rem;      /* mobile */
  text-align: center;    /* centré sur mobile */
  margin: 0;

  span {
    display: block;
    margin-top: 5px;
    font-size: 1.5rem;
  }

  @media screen and (min-width: 768px) {
    font-size: 4rem;
    text-align: left;
    span { font-size: 2rem; }
  }
`;

const Desc = styled.p`
  max-width: 100%;       /* mobile full width */
  text-align: center;    /* centré sur mobile */
  font-size: 1rem;
  margin-top: 20px;

  @media screen and (min-width: 768px) {
    max-width: 550px;
    text-align: left;
    font-size: 1.1rem;
  }
`;


const ColumnsWrapper = styled.div`
  width: 100%;          /* full width pour mobile */
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  align-items: center;

  img {
    width: 100%;        /* image full width sur mobile */
    max-width: 500px;   /* limite pour desktop */
    height: auto;
    border-radius: 24px;
    object-fit: contain;
  }

  @media screen and (min-width: 768px) {
    grid-template-columns: 1.2fr 0.8fr;
    gap: 60px;
  }
`;




const Column = styled.div`
  display: flex;
  align-items: center;
  justify-content: center; 
`;

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 40px;
`;

const PrimaryButtonLink = styled(ButtonLink)`
  background-color: #1e40af; 
  color: white;
  padding: 16px 32px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  border-radius: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px rgba(30, 64, 175, 0.2);

  span {
    transition: transform 0.3s ease;
    font-size: 1.2rem;
  }

  &:hover {
    background-color: #2563eb;
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(30, 64, 175, 0.3);
    
    span {
      transform: translateX(5px);
    }
  }
`;

export default function Featured({ product }) {
  const { addProduct } = useContext(CartContext);

  return (
    <Bg>
      <Center>
        <ColumnsWrapper>
          <Column>
            <div>
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
            </div>
          </Column>

          <Column>
            <img src="/13.png" alt="Librairie Frères Ben Marzouk" />
          </Column>
        </ColumnsWrapper>
      </Center>
    </Bg>
  );
}