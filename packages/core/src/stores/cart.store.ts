import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  taxRate: number;
  notes?: string;
}

export interface HeldCart {
  label: string;
  items: CartItem[];
  savedAt: number;
}

export interface PaymentEntry {
  method: 'cash' | 'card' | 'nequi' | 'daviplata' | 'credit_store';
  amount: number;
  reference?: string;
}

interface CartState {
  items: CartItem[];
  payments: PaymentEntry[];
  heldCarts: HeldCart[];
  customerId: string | null;
  notes: string | null;

  // Item management
  addItem: (item: Omit<CartItem, 'discount'> & { discount?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  applyDiscount: (
    type: 'percent' | 'fixed',
    value: number,
    scope: 'item' | 'cart',
    variantId?: string,
  ) => void;

  // Payment management
  addPayment: (payment: PaymentEntry) => void;
  removePayment: (index: number) => void;
  clearPayments: () => void;

  // Hold / resume
  holdCart: (label: string) => void;
  resumeCart: (label: string) => boolean;
  deleteHeldCart: (label: string) => void;

  // Cart-level
  setCustomer: (customerId: string | null) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  // Computed
  subtotal: () => number;
  itemDiscount: () => number;
  cartDiscount: () => number;
  discountTotal: () => number;
  taxTotal: () => number;
  total: () => number;
  amountTendered: () => number;
  change: (tendered?: number) => number;
  isPaymentComplete: () => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      payments: [],
      heldCarts: [],
      customerId: null,
      notes: null,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, discount: item.discount ?? 0 },
            ],
          };
        });
      },

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i,
          ),
        }));
      },

      applyDiscount: (type, value, scope, variantId) => {
        if (scope === 'item' && variantId) {
          set((state) => ({
            items: state.items.map((item) => {
              if (item.variantId !== variantId) return item;
              const lineTotal = item.unitPrice * item.quantity;
              const discount =
                type === 'percent'
                  ? (lineTotal * value) / 100
                  : Math.min(value, lineTotal);
              return { ...item, discount };
            }),
          }));
        } else if (scope === 'cart') {
          const subtotal = get().subtotal();
          const cartDiscount =
            type === 'percent' ? (subtotal * value) / 100 : Math.min(value, subtotal);

          set((state) => ({
            items: state.items.map((item) => {
              const lineRatio = (item.unitPrice * item.quantity) / (subtotal || 1);
              return {
                ...item,
                discount: item.discount + cartDiscount * lineRatio,
              };
            }),
          }));
        }
      },

      addPayment: (payment) =>
        set((state) => ({ payments: [...state.payments, payment] })),

      removePayment: (index) =>
        set((state) => ({
          payments: state.payments.filter((_, i) => i !== index),
        })),

      clearPayments: () => set({ payments: [] }),

      holdCart: (label) => {
        const { items, heldCarts } = get();
        if (items.length === 0) return;

        const filtered = heldCarts.filter((c) => c.label !== label);
        set({
          heldCarts: [...filtered, { label, items, savedAt: Date.now() }],
          items: [],
          payments: [],
          customerId: null,
          notes: null,
        });
      },

      resumeCart: (label) => {
        const { heldCarts } = get();
        const held = heldCarts.find((c) => c.label === label);
        if (!held) return false;
        set({
          items: held.items,
          heldCarts: heldCarts.filter((c) => c.label !== label),
          payments: [],
        });
        return true;
      },

      deleteHeldCart: (label) =>
        set((state) => ({
          heldCarts: state.heldCarts.filter((c) => c.label !== label),
        })),

      setCustomer: (customerId) => set({ customerId }),
      setNotes: (notes) => set({ notes }),

      clearCart: () =>
        set({ items: [], payments: [], customerId: null, notes: null }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      itemDiscount: () =>
        get().items.reduce((sum, i) => sum + i.discount, 0),

      cartDiscount: () => 0, // already distributed into items in applyDiscount

      discountTotal: () => get().itemDiscount(),

      taxTotal: () =>
        get().items.reduce(
          (sum, i) =>
            sum +
            (i.unitPrice * i.quantity - i.discount) * i.taxRate,
          0,
        ),

      total: () => {
        const s = get();
        return s.subtotal() - s.discountTotal() + s.taxTotal();
      },

      amountTendered: () =>
        get().payments.reduce((sum, p) => sum + p.amount, 0),

      change: (tendered?: number) => {
        const paid = tendered ?? get().amountTendered();
        return Math.max(0, paid - get().total());
      },

      isPaymentComplete: () => get().amountTendered() >= get().total(),
    }),
    { name: 'nexus-cart' },
  ),
);
