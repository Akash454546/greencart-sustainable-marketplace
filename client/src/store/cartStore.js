import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ product, qty }]
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (product) => {
        const items = get().items;
        const existing = items.find((i) => i.product._id === product._id);
        if (existing) {
          set({
            items: items.map((i) =>
              i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i
            ),
            isOpen: true,
          });
        } else {
          set({ items: [...items, { product, qty: 1 }], isOpen: true });
        }
      },

      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.product._id !== productId) })),

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          return set((s) => ({
            items: s.items.filter((i) => i.product._id !== productId),
          }));
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.product._id === productId ? { ...i, qty } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
      },

      get totalCarbon() {
        return get().items.reduce(
          (sum, i) => sum + (i.product.carbonFootprint || 0) * i.qty,
          0
        );
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.qty, 0);
      },
    }),
    {
      name: 'greencart-cart',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
