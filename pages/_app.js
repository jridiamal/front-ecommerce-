import { SessionProvider } from "next-auth/react";
import { createGlobalStyle } from "styled-components";
import { CartContextProvider } from "@/components/CartContext";
import { AnimationContextProvider } from "@/components/AnimationContext"; 
import FlyAnimation from "@/components/FlyAnimation"; 

const GlobalStyles = createGlobalStyle`
  /* ... vos styles existants ... */
  
  html, body {
    max-width: 100vw;
    overflow-x: hidden; /* Sécurité anti-scroll horizontal */
    font-size: 16px;    /* Base pour éviter le zoom auto sur input iOS */
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