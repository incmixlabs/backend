// Vitest setup file to handle SSR globals
declare global {
  const __vite_ssr_exportName__: (
    name: string,
    value: any
  ) => Record<string, any>
  const __vite_ssr_importName__: (mod: any, name: string) => any
  const __vite_ssr_importDefaultName__: (mod: any) => any
  const __vite_ssr_dynamic_import__: (url: string) => Promise<any>
  const __vite_ssr_exportAll__: (obj: any, mod: any) => any
  const __vite_ssr_import_meta__: ImportMeta
}
// Define the SSR globals at runtime
;(globalThis as any).__vite_ssr_exportName__ = (name: string, value: any) => ({
  [name]: value,
})
;(globalThis as any).__vite_ssr_importName__ = (mod: any, name: string) =>
  mod[name]
;(globalThis as any).__vite_ssr_importDefaultName__ = (mod: any) =>
  mod.default || mod
;(globalThis as any).__vite_ssr_dynamic_import__ = (url: string) => import(url)
;(globalThis as any).__vite_ssr_exportAll__ = (obj: any, mod: any) =>
  Object.assign(obj, mod)
;(globalThis as any).__vite_ssr_import_meta__ = import.meta
