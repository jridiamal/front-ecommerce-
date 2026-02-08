import styled, { keyframes } from "styled-components";
import Center from "@/components/Center";
import ProductsGrid from "@/components/ProductsGrid";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- STYLED COMPONENTS ---

const Section = styled.section`
  padding: 40px 0;
  background: #fdfdfd;
  overflow: hidden;
  @media screen and (min-width: 768px) { padding: 80px 0; }
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
    align-items: center;
    justify-content: space-between;
  }
`;

const FilterViewport = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  cursor: grab;
  &:active { cursor: grabbing; }

  /* Gradient indicateur de scroll à droite */
  &::after {
    content: '';
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 50px;
    background: linear-gradient(to left, #fdfdfd, transparent);
    pointer-events: none;
    z-index: 2;
    opacity: ${props => props.$canScroll ? 1 : 0};
    transition: opacity 0.3s;
  }

  @media screen and (min-width: 768px) {
    width: auto;
    &::after { display: none; }
  }
`;

const FilterWrapper = styled(motion.div)`
  display: flex;
  gap: 10px;
  padding: 5px 0;
  width: max-content; /* Important pour le calcul du drag */

  @media screen and (min-width: 768px) {
    width: auto;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
`;

const FilterChip = styled(motion.button)`
  position: relative;
  background: transparent;
  color: ${props => props.$active ? 'white' : '#555'};
  border: 1px solid ${props => props.$active ? '#1f387e' : '#e0e0e0'};
  padding: 10px 22px;
  border-radius: 50px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1;
  transition: color 0.2s;
`;

const ActiveBg = styled(motion.div)`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #1f387e;
  border-radius: 50px;
  z-index: -1;
`;

const StyledButton = styled.button`
  background: #3d47ddff;
  color: white;
  border: none;
  padding: 16px 40px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 47, 202, 0.3);
  margin: 40px auto 0;
  
  &:hover {
    background: #000;
    transform: translateY(-2px);
  }
`;

// --- COMPONENT ---

export default function NewProducts({ products }) {
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [displayProducts, setDisplayProducts] = useState(products);
  const [dragLimit, setDragLimit] = useState(0);
  
  const viewportRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    axios.get('/api/categories').then(res => setCategories(res.data));
  }, []);

  // Calcul de la limite de drag
  useEffect(() => {
    if (wrapperRef.current && viewportRef.current) {
      const width = wrapperRef.current.offsetWidth - viewportRef.current.offsetWidth;
      setDragLimit(width > 0 ? -width : 0);
    }
  }, [categories]);

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
          <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}>Nouveautés</h2>
          
          <FilterViewport ref={viewportRef} $canScroll={dragLimit < 0}>
            <FilterWrapper 
              ref={wrapperRef}
              drag="x"
              dragConstraints={{ right: 0, left: dragLimit }}
              dragElastic={0.1}
              whileTap={{ cursor: "grabbing" }}
            >
              {allFilters.map((cat) => (
                <FilterChip 
                  key={cat._id}
                  $active={activeFilter === cat._id} 
                  onClick={() => setActiveFilter(cat._id)}
                  whileTap={{ scale: 0.95 }}
                >
                  {cat.name}
                  {activeFilter === cat._id && (
                    <ActiveBg 
                      layoutId="activePill"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </FilterChip>
              ))}
            </FilterWrapper>
          </FilterViewport>
        </HeaderRow>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <ProductsGrid products={displayProducts} />
          </motion.div>
        </AnimatePresence>

        <Link href="/products" passHref legacyBehavior>
          <StyledButton>
            Voir toute la librairie
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </StyledButton>
        </Link>
      </Center>
    </Section>
  );
}