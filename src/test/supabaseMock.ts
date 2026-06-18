// Shared utility for creating chainable Supabase query builder mocks.
// Each method returns `this` so chains like .select().order().eq() work.
// The chain itself is a thenable, resolved to `result`. .single() also resolves to `result`.

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createChain(result: { data?: any; error?: any } = {}): any {
  const resolved = { data: result.data ?? null, error: result.error ?? null }
  const chain: any = {}
  for (const m of ['select', 'insert', 'update', 'delete', 'order', 'eq', 'ilike', 'in']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.single = vi.fn().mockResolvedValue(resolved)
  chain.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(resolved).then(onFulfilled, onRejected)
  return chain
}
