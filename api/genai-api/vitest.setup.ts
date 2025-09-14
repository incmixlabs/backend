// Global setup for vitest to fix __vite_ssr_exportName__ error
;(globalThis as any).__vite_ssr_exportName__ = (name: string) => name
