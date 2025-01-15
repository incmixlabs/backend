export type IntlMessage = {
  locale: string
  key: string
  value: string
  namespace: string
  type: "frag" | "label"
}

export type Locale = {
  code: string
  isDefault: boolean
}
