// Pure logic tests for POS keyboard shortcuts

describe('POS Keyboard Shortcut Logic', () => {
  describe('F1 — Focus search', () => {
    it('identifies F1 key correctly', () => {
      const isF1 = (key: string) => key === 'F1';
      expect(isF1('F1')).toBe(true);
      expect(isF1('F2')).toBe(false);
      expect(isF1('f1')).toBe(false);
    });

    it('should not trigger when modifier keys are pressed', () => {
      const shouldHandle = (e: { key: string; ctrlKey: boolean; metaKey: boolean }) =>
        !e.ctrlKey && !e.metaKey;
      expect(shouldHandle({ key: 'F1', ctrlKey: false, metaKey: false })).toBe(true);
      expect(shouldHandle({ key: 'F1', ctrlKey: true, metaKey: false })).toBe(false);
    });
  });

  describe('F2 — Open payment', () => {
    it('identifies F2 key correctly', () => {
      const isF2 = (key: string) => key === 'F2';
      expect(isF2('F2')).toBe(true);
      expect(isF2('F1')).toBe(false);
    });

    it('F2 should not open payment if cart is empty', () => {
      const canOpenPayment = (cartItems: unknown[]) => cartItems.length > 0;
      expect(canOpenPayment([])).toBe(false);
      expect(canOpenPayment([{ id: '1' }])).toBe(true);
    });
  });

  describe('Escape — Close modal', () => {
    it('identifies Escape key correctly', () => {
      const isEscape = (key: string) => key === 'Escape';
      expect(isEscape('Escape')).toBe(true);
      expect(isEscape('Esc')).toBe(false);
    });
  });

  describe('Ctrl+Z — Undo last item', () => {
    it('identifies Ctrl+Z correctly', () => {
      const isCtrlZ = (e: { key: string; ctrlKey: boolean }) => e.ctrlKey && e.key === 'z';
      expect(isCtrlZ({ key: 'z', ctrlKey: true })).toBe(true);
      expect(isCtrlZ({ key: 'z', ctrlKey: false })).toBe(false);
      expect(isCtrlZ({ key: 'Z', ctrlKey: true })).toBe(false);
    });

    it('removes last item from cart on Ctrl+Z', () => {
      const undoLastItem = (items: Array<{ id: string }>) => items.slice(0, -1);
      const cart = [{ id: '1' }, { id: '2' }, { id: '3' }];
      expect(undoLastItem(cart)).toHaveLength(2);
      expect(undoLastItem(cart).at(-1)).toEqual({ id: '2' });
      expect(undoLastItem([])).toHaveLength(0);
    });
  });

  describe('Cart persistence', () => {
    it('serializes cart to JSON correctly', () => {
      const cart = [{ id: '1', qty: 2, price: 5000 }];
      const serialized = JSON.stringify(cart);
      const deserialized = JSON.parse(serialized);
      expect(deserialized).toEqual(cart);
    });

    it('handles corrupted localStorage gracefully', () => {
      const parseCart = (raw: string | null) => {
        if (!raw) return [];
        try { return JSON.parse(raw) as unknown[]; } catch { return []; }
      };
      expect(parseCart(null)).toEqual([]);
      expect(parseCart('invalid json {')).toEqual([]);
      expect(parseCart('[{"id":"1"}]')).toHaveLength(1);
    });
  });

  describe('Product search filter', () => {
    const products = [
      { id: '1', name: 'Coca-Cola', barcode: '123456', categoryId: 'beb' },
      { id: '2', name: 'Agua Cristal', barcode: '789012', categoryId: 'beb' },
      { id: '3', name: 'Empanada', barcode: '345678', categoryId: 'com' },
    ];

    const filterProducts = (list: typeof products, query: string) => {
      if (!query.trim()) return list;
      const q = query.toLowerCase();
      return list.filter(p =>
        p.name.toLowerCase().includes(q) || p.barcode.includes(query)
      );
    };

    it('returns all products for empty query', () => {
      expect(filterProducts(products, '')).toHaveLength(3);
      expect(filterProducts(products, '  ')).toHaveLength(3);
    });

    it('filters by name case-insensitively', () => {
      expect(filterProducts(products, 'coca')).toHaveLength(1);
      expect(filterProducts(products, 'COCA')).toHaveLength(1);
      expect(filterProducts(products, 'agua')).toHaveLength(1); // Agua Cristal only
      expect(filterProducts(products, 'col')).toHaveLength(1); // Coca-Cola only
    });

    it('filters by barcode', () => {
      expect(filterProducts(products, '123456')).toHaveLength(1);
      expect(filterProducts(products, '999999')).toHaveLength(0);
    });
  });
});
