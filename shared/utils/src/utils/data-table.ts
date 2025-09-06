import {
  type Filter,
  filterParser,
  type JoinOperator,
  type KyselyQuery,
  kyselyQuerySchema,
  type Sort,
  sortParser,
} from "@incmix/utils/data-table"

import type {
  ExpressionBuilder,
  ExpressionWrapper,
  ReferenceExpression,
  SqlBool,
} from "kysely"
import { BadRequestError } from "../errors"
export function parseQueryParams<Column extends string>(
  query: Record<string, string>,
  columns: Column[]
): KyselyQuery<Column> {
  const res: KyselyQuery<Column> = {
    filters: [],
    sort: [],
    joinOperator: "and",
    pagination: { page: 1, pageSize: 10 },
  }

  for (const [key, value] of Object.entries(query)) {
    if (key === "page") {
      res.pagination.page = Number.parseInt(value, 10)
    } else if (key === "pageSize") {
      res.pagination.pageSize = Number.parseInt(value, 10)
    } else if (key === "sort") {
      const sortResult = sortParser<Sort<Column>>(value, {
        validKeys: new Set(columns),
      }) as any
      if (sortResult?.data) {
        res.sort = sortResult.data
      } else if (sortResult?.error) {
        throw new BadRequestError(`Invalid sort parameter: ${sortResult.error}`)
      }
    } else if (key === "filters") {
      const filtersResult = filterParser<Filter<Column>>(value, {
        validKeys: new Set(columns),
      }) as any
      if (filtersResult?.data) {
        res.filters = filtersResult.data
      } else if (filtersResult?.error) {
        throw new BadRequestError(
          `Invalid filters parameter: ${filtersResult.error}`
        )
      }
    } else if (key === "joinOperator") {
      res.joinOperator = value as JoinOperator
    }
  }
  const parsed = kyselyQuerySchema.safeParse(res)
  if (!parsed.success) throw new BadRequestError(parsed.error.message)

  return res
}

export function createKyselyFilter<
  Column extends string,
  Database,
  K extends keyof Database,
>(
  filter: Filter<Column>,
  eb: ExpressionBuilder<Database, K>
):
  | ExpressionWrapper<Database, K, string | SqlBool | null | number>
  | undefined {
  const value = Array.isArray(filter.value)
    ? filter.value
    : filter.value.replace("+", " ")
  const field = filter.id as ReferenceExpression<Database, K>
  switch (filter.operator) {
    case "iLike":
      if (typeof value === "string")
        return eb(
          eb.fn<string>("lower", [field]),
          "like",
          `%${value.toLowerCase()}%`
        )
      return
    case "notILike":
      if (typeof value === "string")
        return eb(
          eb.fn<string>("lower", [field]),
          "not like",
          `%${value.toLowerCase()}%`
        )
      return
    case "eq":
      if (Array.isArray(value)) {
        return eb(field, "in", value)
      }

      return eb(field, "=", value)
    case "ne":
      if (Array.isArray(value)) {
        return eb(field, "not in", value)
      }
      return eb(field, "!=", value)
    case "gt":
      if (filter.type === "number" && typeof value === "string") {
        return eb(field, ">", Number(value))
      }

      return
    case "gte":
      if (filter.type === "number" && typeof value === "string") {
        return eb(field, ">=", Number(value))
      }

      return
    case "lt":
      if (filter.type === "number" && typeof value === "string") {
        return eb(field, "<", Number(value))
      }

      return
    case "lte":
      if (filter.type === "number" && typeof value === "string") {
        return eb(field, "<=", Number(value))
      }

      return
    case "isEmpty":
      return eb.or([
        eb(field, "=", null),
        eb(field, "=", ""),
        eb(field, "=", "[]"),
        eb(field, "=", "{}"),
      ])
    case "isNotEmpty":
      return eb.and([
        eb(field, "!=", null),
        eb(field, "!=", ""),
        eb(field, "!=", "[]"),
        eb(field, "!=", "{}"),
      ])

    default:
      return
  }
}
