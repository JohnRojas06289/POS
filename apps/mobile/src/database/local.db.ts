import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('nexus.db');

export async function initDB(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      variants TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      creditLimit REAL DEFAULT 0,
      creditBalance REAL DEFAULT 0,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_orders (
      localId TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products_cache (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      variants TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders_offline (
      localId TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS sync_queue_local (
      localId TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
}

export interface LocalProduct {
  id: string;
  name: string;
  variants: Array<{ id: string; name: string; price: number; stock: number; sku?: string }>;
  updatedAt: string;
}

export async function cacheProducts(products: LocalProduct[]): Promise<void> {
  for (const p of products) {
    await db.runAsync(
      `INSERT OR REPLACE INTO products (id, name, variants, updatedAt) VALUES (?, ?, ?, ?)`,
      [p.id, p.name, JSON.stringify(p.variants), p.updatedAt],
    );
    await db.runAsync(
      `INSERT OR REPLACE INTO products_cache (id, name, variants, updatedAt) VALUES (?, ?, ?, ?)`,
      [p.id, p.name, JSON.stringify(p.variants), p.updatedAt],
    );
  }
}

export async function getProducts(): Promise<LocalProduct[]> {
  const rows = await db.getAllAsync<{ id: string; name: string; variants: string; updatedAt: string }>(
    'SELECT * FROM products ORDER BY name ASC',
  );
  return rows.map((r) => ({ ...r, variants: JSON.parse(r.variants) as LocalProduct['variants'] }));
}

export interface PendingOrder {
  localId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'pending' | 'synced' | 'error';
}

function generateLocalId(): string {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveOfflineOrder(
  localIdOrPayload: string | Record<string, unknown>,
  payloadArg?: Record<string, unknown>,
): Promise<string> {
  const localId = typeof localIdOrPayload === 'string' ? localIdOrPayload : generateLocalId();
  const payload = typeof localIdOrPayload === 'string' ? (payloadArg ?? {}) : localIdOrPayload;
  const createdAt = new Date().toISOString();
  const serialized = JSON.stringify(payload);
  await db.runAsync(
    `INSERT OR REPLACE INTO pending_orders (localId, payload, createdAt, status) VALUES (?, ?, ?, 'pending')`,
    [localId, serialized, createdAt],
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO orders_offline (localId, payload, createdAt, status) VALUES (?, ?, ?, 'pending')`,
    [localId, serialized, createdAt],
  );
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_queue_local (localId, payload, createdAt, status) VALUES (?, ?, ?, 'pending')`,
    [localId, serialized, createdAt],
  );
  return localId;
}

export async function getPendingSync(): Promise<PendingOrder[]> {
  const rows = await db.getAllAsync<{ localId: string; payload: string; createdAt: string; status: string }>(
    `SELECT * FROM pending_orders WHERE status = 'pending' ORDER BY createdAt ASC`,
  );
  return rows.map((r) => ({
    localId: r.localId,
    payload: JSON.parse(r.payload) as Record<string, unknown>,
    createdAt: r.createdAt,
    status: r.status as PendingOrder['status'],
  }));
}

export async function markSynced(localIds: string[]): Promise<void> {
  if (localIds.length === 0) return;
  const placeholders = localIds.map(() => '?').join(', ');
  await db.runAsync(
    `UPDATE pending_orders SET status = 'synced' WHERE localId IN (${placeholders})`,
    localIds,
  );
  await db.runAsync(
    `UPDATE orders_offline SET status = 'synced' WHERE localId IN (${placeholders})`,
    localIds,
  );
  await db.runAsync(
    `UPDATE sync_queue_local SET status = 'synced' WHERE localId IN (${placeholders})`,
    localIds,
  );
}

export async function saveReceipt(id: string, payload: Record<string, unknown>): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO receipts (id, payload, createdAt) VALUES (?, ?, ?)`,
    [id, JSON.stringify(payload), new Date().toISOString()],
  );
}

export async function getSyncMeta(key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(`SELECT value FROM sync_meta WHERE key = ?`, [key]);
  return row?.value ?? null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  await db.runAsync(`INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)`, [key, value]);
}
