import Center from "@/components/Center";
import styled from "styled-components";
import ButtonLink from "@/components/ButtonLink";
import { useContext } from "react";
import { CartContext } from "@/components/CartContext";

const Bg = styled.div`
  background: #7f7bd1;
  background: radial-gradient(circle, rgba(127, 123, 209, 1) 0%, rgba(245, 240, 240, 1) 100%);
  
  /* Garantit que le fond couvre tout l'écran */
  min-height: 60vh;
  display: flex;
  align-items: center;
  
  /* Padding responsive */
  padding: 40px 0;
  
  @media screen and (min-width: 768px) {
    padding: 80px 0;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  font-weight: 900;
  color: #0f172a;
  font-size: 2.5rem;
  letter-spacing: -1.5px;
  line-height: 1.1;

  span {
    font-family: 'Playfair Display', 'Georgia', serif;
    font-style: italic;
    font-weight: 400;
    color: #043cb6ff;
    display: block;
    margin-top: 5px;
    letter-spacing: -0.5px;
  }

  @media screen and (min-width: 768px) {
    font-size: 4rem;
  }
`;

const Desc = styled.p`
  font-family: 'Inter', sans-serif;
  color: #475569; 
  font-size: 1.1rem;
  line-height: 1.8;
  margin-top: 25px;
  max-width: 550px; 
  font-weight: 400;
`;

const ColumnsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 60px; 
  align-items: center;

  img {
    width: 200%; 
    max-width: 500px;
    height: auto; 
    max-height: 450px; 
    object-fit: contain; 
    border-radius: 24px;
    transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    filter: drop-shadow(0 20px 40px rgba(15, 23, 42, 0.1));
  }

  img:hover {
    transform: translateY(-10px) scale(1.02);
    filter: drop-shadow(0 30px 60px rgba(37, 99, 235, 0.2));
  }

  @media screen and (min-width: 768px) {
    grid-template-columns: 1.2fr 0.8fr; 
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
                L'excellence au service de votre savoir. Découvrez notre large sélection de fournitures scolaires, livres, et accessoires de bureau soigneusement sélectionnés.
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