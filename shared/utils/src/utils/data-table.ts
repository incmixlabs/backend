import {
  type Filter,
  type JoinOperator,
  type KyselyQuery,
  type Sort,
  filterParser,
  kyselyQuerySchema,
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
      res.pagination.page = Number.parseInt(value)
    } else if (key === "pageSize") {
      res.pagination.pageSize = Number.parseInt(value)
    } else if (key === "sort") {
      const sort = sortParser<Sort<Column>[]>(value, new Set(columns))
      if (sort) res.sort = sort
    } else if (key === "filters") {
      const filters = filterParser<Filter<Column>[]>(value, new Set(columns))
      if (filters) {
        res.filters = filters
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
