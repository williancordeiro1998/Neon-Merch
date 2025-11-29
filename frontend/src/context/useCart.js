import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],

      add: (product) => {
        const currentItems = get().items
        // Evita duplicar o mesmo produto (opcional)
        const exists = currentItems.find((i) => i.id === product.id)
        if (exists) return;

        set({ items: [...currentItems, product] })
      },

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'neon-merch-cart', // Nome salvo no LocalStorage
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // Importante para evitar erros de SSR no Next.js
    }
  )
)