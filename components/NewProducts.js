import styled, { keyframes } from "styled-components";
import Center from "@/components/Center";
import ProductsGrid from "@/components/ProductsGrid";
import Link from "next/link";
import { useState, useEffect } from "react";
import axios from "axios";

// Animation du badge
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const Section = styled.section`
  padding: 60px 0;
  background: #fdfdfd;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 40px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
  @media screen and (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center; gap: 12px;
`;



const Badge = styled.span`
  background: #e63946; color: white; font-size: 11px; padding: 3px 8px;
  border-radius: 12px; font-weight: bold; animation: ${pulse} 2s infinite;
`;

const FilterChip = styled.button`
  background: ${props => props.active ? '#1f387e' : 'white'};
  color: ${props => props.active ? 'white' : '#666'};
  border: 1px solid ${props => props.active ? '#1f387e' : '#ddd'};
  padding: 8px 20px; border-radius: 25px; cursor: pointer;
  transition: all 0.3s ease;
  &:hover { border-color: #1f387e; transform: translateY(-1px); }
`;

const FilterWrapper = styled.div`
  display: flex;
  gap: 10px;
  overflow-x: auto;
  width: calc(100% + 40px); /* Sort des marges du parent pour un scroll plein écran */
  margin: 0 -20px; 
  padding: 5px 20px 15px 20px;
  scroll-snap-type: x mandatory; /* Aligne proprement les puces lors du scroll */
  
  & > button {
    scroll-snap-align: start;
    flex-shrink: 0; /* Empêche les boutons de s'écraser */
  }

  &::-webkit-scrollbar { display: none; }
`;

const Title = styled.h2`
  font-size: 1.5rem; /* Réduit pour mobile */
  margin: 0;
  font-weight: 800;
  color: #121212;

  @media screen and (min-width: 768px) {
    font-size: 2rem;
  }
`;

const StyledButton = styled.button`
  background: #3d47ddff;
  color: white;
  border: none;
  padding: 14px 30px; /* Plus petit sur mobile */
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.4s;
  box-shadow: 0 4px 15px rgba(0, 47, 202, 0.4);
  width: fit-content;

  @media screen and (min-width: 768px) {
    padding: 16px 45px;
  }

  &:hover { 
    background: #000;
    transform: translateY(-3px); 
    svg { transform: translateX(8px); }
  }
  svg { transition: transform 0.3s ease; }
`;

export default function NewProducts({ products }) {
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [displayProducts, setDisplayProducts] = useState(products);

  useEffect(() => {
    axios.get('/api/categories').then(res => setCategories(res.data));
  }, []);

  useEffect(() => {
    if (activeFilter === "all") {
      setDisplayProducts(products.slice(0, 8));
    } else {
      const filtered = products.filter(p => p.category === activeFilter);
      setDisplayProducts(filtered);
    }
  }, [activeFilter, products]);

  return (
    <Section>
      <Center>
        <HeaderRow>
          <TitleGroup>
            <Title>Nouveautés</Title>
            <Badge>New</Badge>
          </TitleGroup>
          
          <FilterWrapper>
            <FilterChip active={activeFilter === "all"} onClick={() => setActiveFilter("all")}>
              Tous
            </FilterChip>
            {categories.map(cat => (
              <FilterChip 
                key={cat._id} 
                active={activeFilter === cat._id} 
                onClick={() => setActiveFilter(cat._id)}
                style={{whiteSpace:'nowrap'}} // Empêche le texte de se couper
              >
                {cat.name}
              </FilterChip>
            ))}
          </FilterWrapper>
        </HeaderRow>

        <ProductsGrid products={displayProducts} />

        <div style={{display:'flex', flexDirection:'column', alignItems:'center', marginTop:'40px'}}>
          <Link href="/products" passHref legacyBehavior>
            <StyledButton>
              Voir toute la librairie
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </StyledButton>
          </Link>
        </div>
      </Center>
    </Section>
  );
}