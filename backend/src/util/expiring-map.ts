/**
 * Simple extension of the standard map that clears an entry after a certain
 * amount of time. Resets the time if an object is updated, unless resetTimer
 * is set to false.
 */
export default class ExpiringMap<K, V> implements Map<K, V> {
    private map = new Map<K, V>();
    private cooldowns = new Map<K, NodeJS.Timer>();

    constructor(private timeout: number) {}

    [Symbol.toStringTag]: "Map";

    clear(): void {
        this.map.clear();
    }

    delete(key: K): boolean {
        this.cancelAndDelete(key);
        return this.map.delete(key);
    }

    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        this.map.forEach(callbackfn, thisArg);
    }

    get(key: K): any | V {
        return this.map.get(key);
    }

    has(key: K): boolean {
        return this.map.has(key);
    }

    set(key: K, value: V, resetTimer = true): this {
        if (resetTimer) this.cancelAndDelete(key);
        this.map.set(key, value);

        if (!this.cooldowns.has(key)) {
            this.cooldowns.set(key, setTimeout(() => {
                this.delete(key);
            }, this.timeout));
        }

        return this;
    }

    get size(): number {
        return this.map.size;
    }

    [Symbol.iterator](): IterableIterator<[K, V]> {
        return this.map[Symbol.iterator]();
    }

    entries(): IterableIterator<[K, V]> {
        return this.map.entries();
    }

    keys(): IterableIterator<K> {
        return this.map.keys();
    }

    values(): IterableIterator<V> {
        return this.map.values();
    }

    private cancelAndDelete(key: K) {
        if (this.cooldowns.has(key)) {
            clearTimeout(this.cooldowns.get(key)!);
            this.cooldowns.delete(key);
        }
    }
}