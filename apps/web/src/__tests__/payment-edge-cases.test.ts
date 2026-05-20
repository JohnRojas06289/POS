// Payment edge case tests

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

// Replicate pure logic from PaymentModal
const computeSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);

const computeTax = (subtotal: number, rate = 0.19) =>
  Math.round(subtotal * rate);

const computeTotal = (subtotal: number, tax: number) => subtotal + tax;

const computeChange = (total: number, paid: number) =>
  paid >= total ? paid - total : 0;

const isPaymentValid = (total: number, paid: number, method: string) => {
  if (method === 'cash') return paid >= total;
  if (method === 'card' || method === 'transfer') return paid >= total;
  return false;
};

const splitPayment = (total: number, cash: number, card: number) => ({
  valid: cash + card >= total,
  remaining: Math.max(0, total - cash - card),
  change: Math.max(0, cash + card - total),
});

describe('Payment Edge Cases', () => {
  const sampleCart: CartItem[] = [
    { id: '1', name: 'Coca-Cola', price: 3500, qty: 2 },
    { id: '2', name: 'Empanada', price: 3000, qty: 1 },
  ];

  describe('Subtotal calculation', () => {
    it('calculates subtotal correctly', () => {
      expect(computeSubtotal(sampleCart)).toBe(10000); // 3500*2 + 3000*1
    });

    it('returns 0 for empty cart', () => {
      expect(computeSubtotal([])).toBe(0);
    });

    it('handles large quantities', () => {
      const cart: CartItem[] = [{ id: '1', name: 'Item', price: 100, qty: 1000 }];
      expect(computeSubtotal(cart)).toBe(100000);
    });
  });

  describe('Tax calculation', () => {
    it('calculates 19% IVA', () => {
      expect(computeTax(10000)).toBe(1900);
    });

    it('rounds to nearest integer', () => {
      expect(computeTax(10001)).toBe(1900); // 1900.19 → 1900
    });

    it('returns 0 for zero subtotal', () => {
      expect(computeTax(0)).toBe(0);
    });
  });

  describe('Total calculation', () => {
    it('adds subtotal + tax', () => {
      const subtotal = computeSubtotal(sampleCart);
      const tax = computeTax(subtotal);
      expect(computeTotal(subtotal, tax)).toBe(11900);
    });
  });

  describe('Change calculation', () => {
    it('calculates change for overpayment', () => {
      expect(computeChange(11900, 20000)).toBe(8100);
    });

    it('returns 0 for exact payment', () => {
      expect(computeChange(11900, 11900)).toBe(0);
    });

    it('returns 0 when underpaid', () => {
      expect(computeChange(11900, 10000)).toBe(0);
    });

    it('handles large bills (COP 100k)', () => {
      expect(computeChange(11900, 100000)).toBe(88100);
    });
  });

  describe('Payment validation', () => {
    it('validates cash payment when amount is sufficient', () => {
      expect(isPaymentValid(11900, 20000, 'cash')).toBe(true);
    });

    it('rejects cash payment when amount is insufficient', () => {
      expect(isPaymentValid(11900, 5000, 'cash')).toBe(false);
    });

    it('validates card payment for exact amount', () => {
      expect(isPaymentValid(11900, 11900, 'card')).toBe(true);
    });

    it('rejects unknown payment method', () => {
      expect(isPaymentValid(11900, 11900, 'crypto')).toBe(false);
    });
  });

  describe('Split payment', () => {
    it('validates when cash + card covers total', () => {
      const result = splitPayment(11900, 7000, 4900);
      expect(result.valid).toBe(true);
      expect(result.remaining).toBe(0);
      expect(result.change).toBe(0);
    });

    it('reports remaining when not fully covered', () => {
      const result = splitPayment(11900, 5000, 3000);
      expect(result.valid).toBe(false);
      expect(result.remaining).toBe(3900);
    });

    it('calculates change on overpayment', () => {
      const result = splitPayment(11900, 10000, 5000);
      expect(result.valid).toBe(true);
      expect(result.change).toBe(3100);
    });

    it('handles zero card amount (cash only)', () => {
      const result = splitPayment(11900, 20000, 0);
      expect(result.valid).toBe(true);
      expect(result.change).toBe(8100);
    });
  });

  describe('Colombian peso quick-fill amounts', () => {
    const quickFills = [5000, 10000, 20000, 50000, 100000];

    it('all quick-fill amounts are multiples of 1000', () => {
      quickFills.forEach(amount => {
        expect(amount % 1000).toBe(0);
      });
    });

    it('provides change for smallest bill covering total', () => {
      const total = 8500;
      const smallestCovering = quickFills.find(a => a >= total)!;
      expect(smallestCovering).toBe(10000);
      expect(computeChange(total, smallestCovering)).toBe(1500);
    });
  });
});
