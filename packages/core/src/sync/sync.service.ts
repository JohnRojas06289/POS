// This file runs in React Native / Expo
// Uses fetch (built-in) — no axios dependency

export interface SyncOperation {
  localId: string;
  entityType: 'order' | 'payment' | 'stock_movement' | 'customer' | 'expense';
  entityId?: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  clientTimestamp: string;
}

interface SyncQueueRow {
  id: string;
  operation: SyncOperation;
  status: 'pending' | 'synced' | 'conflict' | 'error';
  createdAt: number;
}

type SyncState = {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
};

type SyncStateListener = (state: SyncState) => void;

export class MobileSyncService {
  private queue: SyncQueueRow[] = [];
  private state: SyncState = { isSyncing: false, pendingCount: 0, lastSyncAt: null };
  private listeners: SyncStateListener[] = [];
  private apiUrl: string;
  private getToken: () => string | null;

  constructor(apiUrl: string, getToken: () => string | null) {
    this.apiUrl = apiUrl;
    this.getToken = getToken;
    this.loadQueueFromStorage();
  }

  private loadQueueFromStorage(): void {
    // In production: load from expo-sqlite
    // Simplified: in-memory for now
    this.updatePendingCount();
  }

  subscribe(listener: SyncStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state));
  }

  private updatePendingCount(): void {
    this.state = {
      ...this.state,
      pendingCount: this.queue.filter((q) => q.status === 'pending').length,
    };
    this.notify();
  }

  queueOperation(op: SyncOperation): void {
    this.queue.push({
      id: op.localId,
      operation: op,
      status: 'pending',
      createdAt: Date.now(),
    });
    this.updatePendingCount();
  }

  async pushPendingOps(): Promise<{ succeeded: number; conflicts: number; errors: number }> {
    const pending = this.queue.filter((q) => q.status === 'pending');
    if (pending.length === 0) return { succeeded: 0, conflicts: 0, errors: 0 };

    this.state = { ...this.state, isSyncing: true };
    this.notify();

    try {
      const token = this.getToken();
      const response = await fetch(`${this.apiUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          terminalId: 'mobile-terminal',
          operations: pending.map((q) => q.operation),
        }),
      });

      if (!response.ok) throw new Error(`Sync push failed: ${response.status}`);

      const result = await response.json() as {
        results: Array<{ localId: string; status: string }>;
      };

      for (const r of result.results) {
        const item = this.queue.find((q) => q.id === r.localId);
        if (item) {
          item.status = r.status === 'done' || r.status === 'skipped'
            ? 'synced'
            : r.status === 'conflict'
            ? 'conflict'
            : 'error';
        }
      }

      return {
        succeeded: result.results.filter((r) => r.status === 'done' || r.status === 'skipped').length,
        conflicts: result.results.filter((r) => r.status === 'conflict').length,
        errors: result.results.filter((r) => r.status === 'error').length,
      };
    } finally {
      this.state = {
        ...this.state,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
      };
      this.updatePendingCount();
    }
  }

  async pullUpdates(branchId: string): Promise<{
    products: unknown[];
    customers: unknown[];
    config: Record<string, unknown>;
  }> {
    const token = this.getToken();
    const response = await fetch(`${this.apiUrl}/sync/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        terminalId: 'mobile-terminal',
        lastSyncAt: this.state.lastSyncAt ?? new Date(0).toISOString(),
        branchId,
      }),
    });

    if (!response.ok) throw new Error(`Sync pull failed: ${response.status}`);
    return response.json();
  }

  async syncNow(branchId: string): Promise<void> {
    await this.pushPendingOps();
    await this.pullUpdates(branchId);
  }

  getState(): SyncState {
    return this.state;
  }
}
