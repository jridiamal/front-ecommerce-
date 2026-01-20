import { SessionProvider } from "next-auth/react";
import { createGlobalStyle } from "styled-components";
import { CartContextProvider } from "@/components/CartContext";
import { AnimationContextProvider } from "@/components/AnimationContext"; 
import FlyAnimation from "@/components/FlyAnimation"; 

const GlobalStyles = createGlobalStyle`
  
  html, body, #__next {
    height: 100%;
    margin: 0;
    padding: 0;
    max-width: 100vw;
    overflow-x: hidden; 
  }

  input, button, select {
    font-family: inherit;
  }
    body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
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