import { createContext, useEffect, useState } from "react";

export const CartContext = createContext({});

export function CartContextProvider({ children }) {
  const ls = typeof window !== "undefined" ? window.localStorage : null;
  const [cartProducts, setCartProducts] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    if (ls && ls.getItem("cart")) {
      setCartProducts(JSON.parse(ls.getItem("cart")));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    ls?.setItem("cart", JSON.stringify(cartProducts));
  }, [cartProducts]);

  /**
   * item = {
   *   _id: productId,
   *   colorId,
   *   color,
   *   image,
   *   outOfStock
   * }
   */
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
    ls?.removeItem("cart");
  }

  return (
    <CartContext.Provider
      value={{
        cartProducts,
        addProduct,
        removeProduct,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
