import styled, { keyframes } from "styled-components";
import Center from "@/components/Center";
import ProductsGrid from "@/components/ProductsGrid";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

// Animation du badge
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const Section = styled.section`
  padding: 40px 0;
  background: #fdfdfd;

  @media screen and (min-width: 768px) {
padding: 50px 0 20px 0; /* On réduit le padding du bas à 20px */  }

  @media screen and (min-width: 1200px) {
padding: 60px 0 30px 0; /* On réduit ici aussi */  }
`;

const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;

  @media screen and (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 40px;
  }
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const Badge = styled.span`
  background: #e63946;
  color: white;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: bold;
  animation: ${pulse} 2s infinite;
  
  @media screen and (min-width: 375px) {
    font-size: 11px;
  }
  
  @media screen and (min-width: 768px) {
    font-size: 12px;
    padding: 4px 10px;
  }
`;

const FilterChip = styled.button`
  background: ${props => props.active ? '#1f387e' : 'white'};
  color: ${props => props.active ? 'white' : '#666'};
  border: 1px solid ${props => props.active ? '#1f387e' : '#ddd'};
  padding: 8px 16px;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 14px;
  
  &:hover { 
    border-color: #1f387e; 
    transform: translateY(-1px); 
  }
  
  @media screen and (min-width: 768px) {
    padding: 8px 20px;
    font-size: 15px;
  }
`;

const FilterWrapper = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 10px 0 5px 0;
  margin: 0 -5px;
  scrollbar-width: none;
  
  &::-webkit-scrollbar { 
    display: none; 
  }
  
  /* Touch-friendly scrolling */
  -webkit-overflow-scrolling: touch;
  
  @media screen and (min-width: 768px) {
    gap: 10px;
    margin: 0;
    padding: 0;
    overflow-x: visible;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
`;

const Title = styled.h2`
  font-size: 1.4rem;
  margin: 0;
  font-weight: 800;
  color: #121212;
  line-height: 1.2;

  @media screen and (min-width: 375px) {
    font-size: 1.5rem;
  }

  @media screen and (min-width: 768px) {
    font-size: 1.8rem;
  }

  @media screen and (min-width: 1024px) {
    font-size: 2rem;
  }
`;

const StyledButton = styled.button`
  background: #3d47ddff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.4s;
  box-shadow: 0 4px 15px rgba(0, 47, 202, 0.4);
  width: 100%;
  justify-content: center;
  font-size: 15px;

  @media screen and (min-width: 375px) {
    width: fit-content;
    padding: 14px 28px;
  }

  @media screen and (min-width: 768px) {
    padding: 16px 45px;
    font-size: 16px;
    gap: 15px;
  }

  &:hover { 
    background: #000;
    transform: translateY(-3px); 
    svg { transform: translateX(8px); }
  }
  
  svg { 
    transition: transform 0.3s ease;
    width: 18px;
    height: 18px;
    
    @media screen and (min-width: 768px) {
      width: 20px;
      height: 20px;
    }
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 30px;
  width: 100%;
  
  @media screen and (min-width: 768px) {
    margin-top: 40px;
  }
`;

export default function NewProducts({ products }) {
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [displayProducts, setDisplayProducts] = useState(products);
  const filterWrapperRef = useRef(null);

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
          
          <FilterWrapper ref={filterWrapperRef}>
            <FilterChip 
              active={activeFilter === "all"} 
              onClick={() => setActiveFilter("all")}
            >
              Tous
            </FilterChip>
            {categories.map(cat => (
              <FilterChip 
                key={cat._id} 
                active={activeFilter === cat._id} 
                onClick={() => setActiveFilter(cat._id)}
              >
                {cat.name}
              </FilterChip>
            ))}
          </FilterWrapper>
        </HeaderRow>

        <ProductsGrid products={displayProducts} />

        <ButtonWrapper>
          <Link href="/products" passHref legacyBehavior>
            <StyledButton>
              Voir toute la librairie
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </StyledButton>
          </Link>
        </ButtonWrapper>
      </Center>
    </Section>
  );
}