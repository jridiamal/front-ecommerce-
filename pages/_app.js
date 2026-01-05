import { SessionProvider } from "next-auth/react";
import { createGlobalStyle } from "styled-components";
import { CartContextProvider } from "@/components/CartContext";
import { AnimationContextProvider } from "@/components/AnimationContext"; 
import FlyAnimation from "@/components/FlyAnimation"; 

const GlobalStyles = createGlobalStyle`
  
  html, body {
    max-width: 100vw;
    overflow-x: hidden; 
    font-size: 16px;    
  }

  input, button, select {
    font-family: inherit;
  }
`;

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <GlobalStyles />
      <CartContextProvider>
          <AnimationContextProvider> 
              <Component {...pageProps} />
              <FlyAnimation /> 
          </AnimationContextProvider>
      </CartContextProvider>
    </SessionProvider>
  );
}