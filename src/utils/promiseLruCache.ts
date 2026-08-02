export class PromiseLruCache<K, V> {
  private readonly entries = new Map<K, Promise<V>>();

  constructor(private readonly capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error("Cache capacity must be a positive integer.");
    }
  }

  getOrCreate(key: K, factory: () => Promise<V>): Promise<V> {
    const cached = this.entries.get(key);
    if (cached) {
      this.entries.delete(key);
      this.entries.set(key, cached);
      return cached;
    }

    const request = factory();
    this.entries.set(key, request);
    while (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      this.entries.delete(oldest);
    }
    void request.catch(() => {
      if (this.entries.get(key) === request) {
        this.entries.delete(key);
      }
    });
    return request;
  }
}
