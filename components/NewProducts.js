import styled, { keyframes } from "styled-components";
import Center from "@/components/Center";
import ProductsGrid from "@/components/ProductsGrid";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Animation du badge
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const Section = styled.section`
  padding: 40px 0;
  background: #fdfdfd;
  overflow: hidden; /* Évite les scrollbars parasites pendant l'animation */

  @media screen and (min-width: 768px) {
    padding: 60px 0;
  }
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
`;

const FilterContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: visible;

  @media screen and (min-width: 768px) {
    width: auto;
  }
`;

const FilterWrapper = styled(motion.div)`
  display: flex;
  gap: 10px;
  cursor: grab;
  padding: 5px 0;

  &:active {
    cursor: grabbing;
  }

  @media screen and (min-width: 768px) {
    flex-wrap: wrap;
    justify-content: flex-end;
    transform: none !important; /* Désactive le drag sur desktop si souhaité */
  }
`;

const FilterChip = styled(motion.button)`
  position: relative;
  background: transparent;
  color: ${props => props.active ? 'white' : '#666'};
  border: 1px solid ${props => props.active ? '#1f387e' : '#ddd'};
  padding: 8px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: color 0.3s ease, border-color 0.3s ease;
  z-index: 1;

  &:hover {
    border-color: #1f387e;
  }
`;

const ActiveBg = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1f387e;
  border-radius: 23px;
  z-index: -1;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin: 0;
  font-weight: 800;
  color: #121212;
`;

const StyledButton = styled.button`
  background: #3d47ddff;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.4s;
  box-shadow: 0 4px 15px rgba(0, 47, 202, 0.4);
  
  &:hover {
    background: #000;
    transform: translateY(-3px);
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 30px;
`;

export default function NewProducts({ products }) {
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [displayProducts, setDisplayProducts] = useState(products);
  
  const constraintsRef = useRef(null);

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

  const allFilters = [{ _id: 'all', name: 'Tous' }, ...categories];

  return (
    <Section>
      <Center>
        <HeaderRow>
          <TitleGroup>
            <Title>Nouveautés</Title>
            <Badge>New</Badge>
          </TitleGroup>
          
          <FilterContainer ref={constraintsRef}>
            <FilterWrapper 
              drag="x"
              dragConstraints={constraintsRef}
              dragElastic={0.2}
              whileTap={{ cursor: "grabbing" }}
            >
              {allFilters.map(cat => (
                <FilterChip 
                  key={cat._id}
                  active={activeFilter === cat._id} 
                  onClick={() => setActiveFilter(cat._id)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {cat.name}
                  {activeFilter === cat._id && (
                    <ActiveBg 
                      layoutId="activeFilter"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </FilterChip>
              ))}
            </FilterWrapper>
          </FilterContainer>
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