export class PerformanceService {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static setCache(key: string, data: any, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  static getCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  static async withCache<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttlMinutes: number = 5
  ): Promise<T> {
    const cached = this.getCache(key);
    
    if (cached !== null) {
      return cached;
    }
    
    const data = await fetchFunction();
    this.setCache(key, data, ttlMinutes);
    
    return data;
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  static measurePerformance<T>(
    name: string,
    operation: () => T
  ): T {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    
    console.log(`Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    
    return result;
  }

  static async measureAsyncPerformance<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await operation();
    const end = performance.now();
    
    console.log(`Async Performance [${name}]: ${(end - start).toFixed(2)}ms`);
    
    return result;
  }

  static optimizeImageLoading(uri: string, quality: number = 0.8): string {
    // For Pexels images, add quality parameters
    if (uri.includes('pexels.com')) {
      const url = new URL(uri);
      url.searchParams.set('auto', 'compress');
      url.searchParams.set('cs', 'tinysrgb');
      url.searchParams.set('q', (quality * 100).toString());
      return url.toString();
    }
    
    return uri;
  }

  static batchOperations<T>(
    items: T[],
    operation: (item: T) => Promise<void>,
    batchSize: number = 10
  ): Promise<void[]> {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return Promise.all(
      batches.map(batch => 
        Promise.all(batch.map(operation))
      )
    ).then(results => results.flat());
  }
}