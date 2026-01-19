import Header from "@/components/Header";
import Footer from "@/components/Footer"; 
import styled from "styled-components";

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
`;

const MainContent = styled.main`
  flex: 1 0 auto;
  padding: 1rem 1rem 3rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  
  @media (min-width: 640px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  
  @media (min-width: 1024px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
`;

export default function Layout({ children }) {
  return (
    <LayoutContainer>
      <Header /> 
      <MainContent>
        {children}
      </MainContent>
      <Footer />
    </LayoutContainer>
  );
}