import type { Permission } from "@jsprtmnn/utils/types"
import get from "lodash/get"

export const defaultPermissions: Permission[] = [
  {
    action: "manage",
    subject: "all",
    conditions: {},
  },
]

export const interpolate = (template: string, vars: object) => {
  return JSON.parse(template, (_, rawValue: string) => {
    if (rawValue == null || rawValue[0] !== "$") {
      return rawValue
    }

    const name = rawValue.slice(2, -1)
    const value = get(vars, name)

    if (typeof value === "undefined") {
      throw new ReferenceError(`Variable ${name} is not defined`)
    }

    return value
  })
}
