"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart]         = useState([]);
  const [hydrated, setHydrated] = useState(false);

  // ✅ Load cart from localStorage on first mount (persists across page refreshes)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {
      // localStorage unavailable (SSR safety) — start with empty cart
    }
    setHydrated(true);
  }, []);

  // ✅ Save cart to localStorage on every change
  useEffect(() => {
    if (!hydrated) return; // Don't overwrite on first render before load
    try {
      localStorage.setItem("cart", JSON.stringify(cart));
    } catch {
      // Ignore write errors (private browsing quota)
    }
  }, [cart, hydrated]);

  // ➕ Add to cart
  const addToCart = (product) => {
    setCart((prev) => {
      const exist = prev.find((item) => item._id === product._id);
      if (exist) {
        return prev.map((item) =>
          item._id === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  // ➖ Remove item
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  // 🔼 Increase qty
  const increaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, qty: item.qty + 1 } : item
      )
    );
  };

  // 🔽 Decrease qty
  const decreaseQty = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === id
          ? { ...item, qty: item.qty > 1 ? item.qty - 1 : 1 }
          : item
      )
    );
  };

  // 🗑️ Clear cart
  const clearCart = () => setCart([]);

  // 💰 Total price
  const total = cart.reduce((acc, item) => acc + (item.price || 0) * item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        total,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);