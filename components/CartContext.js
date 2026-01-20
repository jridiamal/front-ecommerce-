// components/CartContext.js
import { createContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export const CartContext = createContext({});

export function CartContextProvider({ children }) {
  const { data: session } = useSession();
  const ls = typeof window !== "undefined" ? window.localStorage : null;

  // clé panier spécifique à user ou guest
  const cartKey = session?.user?.email
    ? `cart_${session.user.email}`   // user connecté
    : "cart_guest";                  // invité

  const [cartProducts, setCartProducts] = useState([]);

  // Charger panier depuis localStorage
  useEffect(() => {
    if (ls) {
      const savedCart = ls.getItem(cartKey);
      setCartProducts(savedCart ? JSON.parse(savedCart) : []);
    }
  }, [cartKey]);

  // Sauvegarder panier dans localStorage à chaque modification
  useEffect(() => {
    if (ls) {
      ls.setItem(cartKey, JSON.stringify(cartProducts));
    }
  }, [cartProducts, cartKey]);

  /**
   * item = {
   *   _id: productId,
   *   title,
   *   price,
   *   colorId,
   *   color,
   *   image,
   *   outOfStock
   * }
   */
  function addProduct(item) {
    if (item.outOfStock) return; // sécurité
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

  // vider panier memory, mais garder localStorage pour persistance
  function clearCartMemory() {
    setCartProducts([]);
  }

  // vider complètement panier (memory + localStorage)
  function clearCartAll() {
    setCartProducts([]);
    if (ls) ls.removeItem(cartKey);
  }

  // total prix
  function getCartTotal() {
    return cartProducts.reduce((total, item) => total + (item.price || 0), 0);
  }

  // nombre produits
  function getCartCount() {
    return cartProducts.length;
  }

  return (
    <CartContext.Provider
      value={{
        cartProducts,
        addProduct,
        removeProduct,
        clearCartMemory, // clear memory seulement
        clearCartAll,    // clear memory + LS
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
