/**
 * Edge-compatible database query helper.
 *
 * Uses `@neondatabase/serverless` Pool (HTTP-based) instead of `pg` Pool (TCP-based).
 * Same `.query()` interface, but works in Next.js Edge runtime.
 *
 * Usage in API routes:
 *   import { edgePool } from '@/lib/edge-pool';
 *   export const runtime = 'edge';
 *   const result = await edgePool.query('SELECT ...');
 */
import { Pool } from '@neondatabase/serverless';

let edgePoolInstance: Pool | null = null;

function getEdgePool(): Pool {
  if (!edgePoolInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    edgePoolInstance = new Pool({ connectionString });
  }
  return edgePoolInstance;
}

/**
 * Drop-in replacement for `pool` from `@/lib/db` that works in Edge runtime.
 * Uses Neon's HTTP-based Pool instead of pg's TCP-based Pool.
 */
export const edgePool = new Proxy({} as Pool, {
  get(_, prop: string | symbol) {
    if (typeof prop === 'symbol') return undefined;
    const instance = getEdgePool() as any;
    const value = instance[prop];
    if (typeof value === 'function') {
      return (...args: any[]) => value.apply(instance, args);
    }
    return value;
  },
});
