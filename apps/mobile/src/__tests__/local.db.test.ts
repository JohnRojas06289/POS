import { initDB, cacheProducts, getProducts, saveOfflineOrder, getPendingSync, markSynced } from '../database/local.db';

// Mock expo-sqlite
jest.mock('expo-sqlite', () => {
  const data: Record<string, unknown[]> = { products: [], pending_orders: [], sync_meta: [] };

  return {
    openDatabaseSync: () => ({
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockImplementation(async (sql: string, params: unknown[]) => {
        if (sql.includes('INSERT OR REPLACE INTO products')) {
          const existing = (data.products as Array<{id: string}>).findIndex((p) => p.id === params[0]);
          const row = { id: params[0], name: params[1], variants: params[2], updatedAt: params[3] };
          if (existing >= 0) data.products[existing] = row;
          else data.products.push(row);
        } else if (sql.includes('INSERT OR REPLACE INTO pending_orders')) {
          data.pending_orders.push({ localId: params[0], payload: params[1], createdAt: params[2], status: 'pending' });
        } else if (sql.includes("SET status = 'synced'")) {
          const ids = params as string[];
          data.pending_orders = (data.pending_orders as Array<{localId: string; status: string}>).map((o) =>
            ids.includes(o.localId) ? { ...o, status: 'synced' } : o,
          );
        }
      }),
      getAllAsync: jest.fn().mockImplementation(async (sql: string) => {
        if (sql.includes('FROM products')) return data.products;
        if (sql.includes('FROM pending_orders')) return (data.pending_orders as Array<{status: string}>).filter((o) => o.status === 'pending');
        return [];
      }),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    }),
  };
});

describe('local.db', () => {
  beforeEach(async () => {
    await initDB();
  });

  it('caches and retrieves products', async () => {
    await cacheProducts([
      { id: 'p1', name: 'Arepa', variants: [{ id: 'v1', name: 'Normal', price: 3000, stock: 10 }], updatedAt: new Date().toISOString() },
    ]);
    const products = await getProducts();
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Arepa');
    expect(products[0].variants[0].price).toBe(3000);
  });

  it('saves offline orders and retrieves pending', async () => {
    await saveOfflineOrder('local-1', { items: [], payments: [] });
    const pending = await getPendingSync();
    expect(pending).toHaveLength(1);
    expect(pending[0].localId).toBe('local-1');
    expect(pending[0].status).toBe('pending');
  });

  it('marks synced orders', async () => {
    await saveOfflineOrder('local-2', { items: [] });
    await markSynced(['local-2']);
    const pending = await getPendingSync();
    expect(pending.find((o) => o.localId === 'local-2')).toBeUndefined();
  });
});
