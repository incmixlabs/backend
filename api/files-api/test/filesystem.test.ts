import type { Dirent } from "node:fs"
import * as fs from "node:fs/promises"
import {
  formatAndWriteWithPrettier,
  listDirectories,
  listFiles,
} from "@/lib/filesystem"
import * as pkgTypes from "pkg-types"
import prettier from "prettier"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock external dependencies
vi.mock("node:fs/promises")
vi.mock("pkg-types")
vi.mock("prettier")

describe("filesystem utils", () => {
  describe("listDirectories", () => {
    it("should return only directories", async () => {
      // Mock readdir to return a mix of files and directories
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: "dir1", isDirectory: () => true } as Dirent,
        { name: "file1", isDirectory: () => false } as Dirent,
        { name: "dir2", isDirectory: () => true } as Dirent,
      ] as Dirent[])

      const result = await listDirectories("/test/path")

      expect(fs.readdir).toHaveBeenCalledWith("/test/path", {
        withFileTypes: true,
      })
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe("dir1")
      expect(result[1].name).toBe("dir2")
    })
  })

  describe("listFiles", () => {
    it("should return only files", async () => {
      // Mock readdir to return a mix of files and directories
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: "dir1", isFile: () => false } as Dirent,
        { name: "file1", isFile: () => true } as Dirent,
        { name: "file2", isFile: () => true } as Dirent,
      ] as Dirent[])

      const result = await listFiles("/test/path")

      expect(fs.readdir).toHaveBeenCalledWith("/test/path", {
        withFileTypes: true,
      })
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe("file1")
      expect(result[1].name).toBe("file2")
    })
  })

  describe("formatAndWriteWithPrettier", () => {
    it("should be defined", () => {
      expect(formatAndWriteWithPrettier).toBeDefined()
    })
  })
})
