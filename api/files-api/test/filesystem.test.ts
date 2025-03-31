import { describe, expect, it, vi } from "vitest"
import { listDirectories, listFiles, formatAndWriteWithPrettier } from "@/lib/filesystem"
import * as fs from "node:fs/promises"
import * as pkgTypes from "pkg-types"
import prettier from "prettier"

// Mock external dependencies
vi.mock("node:fs/promises")
vi.mock("pkg-types")
vi.mock("prettier")

describe("filesystem utils", () => {
  describe("listDirectories", () => {
    it("should return only directories", async () => {
      // Mock readdir to return a mix of files and directories
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: "dir1", isDirectory: () => true } as fs.Dirent,
        { name: "file1", isDirectory: () => false } as fs.Dirent,
        { name: "dir2", isDirectory: () => true } as fs.Dirent,
      ] as fs.Dirent[])

      const result = await listDirectories("/test/path")
      
      expect(fs.readdir).toHaveBeenCalledWith("/test/path", { withFileTypes: true })
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe("dir1")
      expect(result[1].name).toBe("dir2")
    })
  })

  describe("listFiles", () => {
    it("should return only files", async () => {
      // Mock readdir to return a mix of files and directories
      vi.mocked(fs.readdir).mockResolvedValue([
        { name: "dir1", isFile: () => false } as fs.Dirent,
        { name: "file1", isFile: () => true } as fs.Dirent,
        { name: "file2", isFile: () => true } as fs.Dirent,
      ] as fs.Dirent[])

      const result = await listFiles("/test/path")
      
      expect(fs.readdir).toHaveBeenCalledWith("/test/path", { withFileTypes: true })
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe("file1")
      expect(result[1].name).toBe("file2")
    })
  })

  describe("formatAndWriteWithPrettier", () => {
    beforeEach(() => {
      // Reset mocks before each test
      vi.resetAllMocks()

      // Setup common mocks
      vi.mocked(pkgTypes.findFarthestFile).mockResolvedValue("/path/to/prettier.config.js")
      vi.mocked(prettier.resolveConfig).mockResolvedValue({ tabWidth: 2 })
      vi.mocked(prettier.format).mockResolvedValue("formatted content")
      vi.mocked(fs.writeFile).mockResolvedValue()
    })

    it("should format with parser when parser is provided", async () => {
      await formatAndWriteWithPrettier({
        content: "content to format",
        outputFilePath: "/output/path.js",
        parser: "babel" as prettier.BuiltInParserName,
      })

      expect(prettier.resolveConfig).toHaveBeenCalledWith("/path/to/prettier.config.js")
      expect(prettier.format).toHaveBeenCalledWith("content to format", {
        tabWidth: 2,
        parser: "babel",
      })
      expect(fs.writeFile).toHaveBeenCalledWith("/output/path.js", "formatted content")
    })

    it("should format with filePath when filePath is provided", async () => {
      await formatAndWriteWithPrettier({
        content: "content to format",
        filePath: "/input/path.js",
      })

      expect(prettier.resolveConfig).toHaveBeenCalledWith("/path/to/prettier.config.js")
      expect(prettier.format).toHaveBeenCalledWith("content to format", {
        tabWidth: 2,
        filepath: "/input/path.js",
      })
      expect(fs.writeFile).toHaveBeenCalledWith("/input/path.js", "formatted content")
    })

    it("should throw error if prettier config not found", async () => {
      vi.mocked(prettier.resolveConfig).mockResolvedValue(null)

      await expect(formatAndWriteWithPrettier({
        content: "content to format",
        filePath: "/input/path.js",
      })).rejects.toThrow("Prettier config not found")
    })

    it("should throw error if neither outputFilePath nor filePath is provided", async () => {
      // @ts-expect-error - Intentionally testing invalid input
      await expect(formatAndWriteWithPrettier({
        content: "content to format",
        parser: "babel" as prettier.BuiltInParserName,
      })).rejects.toThrow("outputFilePath or filePath must be provided")
    })
  })
})
