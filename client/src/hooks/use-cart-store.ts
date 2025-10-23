import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the type for a single item in the cart
interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

// Define the state and actions for our cart store
interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Action to add an item to the cart
      addItem: (newItem) => {
        const existingItem = get().items.find((item) => item.id === newItem.id);

        if (existingItem) {
          // If item already exists, just increase its quantity
          set((state) => ({
            items: state.items.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          }));
        } else {
          // If it's a new item, add it to the cart with quantity 1
          set((state) => ({
            items: [...state.items, { ...newItem, quantity: 1 }],
          }));
        }
      },

      // Action to remove an item from the cart
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      // Action to clear the entire cart
      clearCart: () => {
        set({ items: [] });
      },

      // Function to get the total number of items in the cart
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Function to calculate the total price of all items
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage', // This name is used for saving the cart in local storage
    }
  )
);