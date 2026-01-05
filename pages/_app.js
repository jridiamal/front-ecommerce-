import { SessionProvider } from "next-auth/react";
import { createGlobalStyle } from "styled-components";
import { CartContextProvider } from "@/components/CartContext";
import { AnimationContextProvider } from "@/components/AnimationContext"; 
import FlyAnimation from "@/components/FlyAnimation"; 

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #eee;
    margin: 0;
    padding: 0;
    font-family: 'Poppins', sans-serif;
    /* Suppression du margin-top fixe qui casse le header mobile */
    overflow-x: hidden; /* Empêche le scroll horizontal accidentel */
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