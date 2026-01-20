// components/CartContext.js
import { createContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export const CartContext = createContext({});

export function CartContextProvider({ children }) {
  const { data: session } = useSession();
  const ls = typeof window !== "undefined" ? window.localStorage : null;
  const [cartProducts, setCartProducts] = useState([]);

  const cartKey = session?.user?.email ? `cart_${session.user.email}` : "cart_guest";

  // Load cart from localStorage
  useEffect(() => {
    if (ls && session?.user?.email) {
      const savedCart = ls.getItem(cartKey);
      setCartProducts(savedCart ? JSON.parse(savedCart) : []);
    } else {
      setCartProducts([]);
    }
  }, [session?.user?.email]);

  // Save cart to localStorage
  useEffect(() => {
    if(ls && session?.user?.email) {
      ls.setItem(cartKey, JSON.stringify(cartProducts));
    }
  }, [cartProducts, cartKey]);

  function addProduct(item) {
    if (item.outOfStock) return; // ⛔ sécurité
    setCartProducts(prev => [...prev, item]);
  }

  function removeProduct(item) {
    setCartProducts(prev => {
      const pos = prev.findIndex(
        p => p._id === item._id && p.colorId === item.colorId
      );
      if (pos !== -1) {
        const newCart = [...prev];
        newCart.splice(pos, 1);
        return newCart;
      }
      return prev;
    });
  }

  function clearCart() {
    setCartProducts([]);
    if(ls && session?.user?.email) ls.removeItem(cartKey);
  }

  function getCartTotal() {
    return cartProducts.reduce((total, item) => total + (item.price || 0), 0);
  }

  function getCartCount() {
    return cartProducts.length;
  }

  return (
    <CartContext.Provider
      value={{
        cartProducts,
        addProduct,
        removeProduct,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
