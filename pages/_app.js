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
    margin-top: 40px; 


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