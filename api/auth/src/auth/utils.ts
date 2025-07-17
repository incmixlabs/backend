import { randomBytes } from "node:crypto"
import { scrypt as _scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

// Base32 encoding alphabet (RFC 4648)
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567abcdefghijklmnopqrstuvwxyz"

function encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ""
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31]
  }
  return output
}

// Generate a secure random session ID (base32, 40 chars = 25 bytes)
export function generateSessionId(): string {
  const random = randomBytes(25) // 25 bytes = 200 bits = 40 base32 chars
  return encode(random)
}

export function generateRandomId(length = 15): string {
  // Validate length: must be a positive integer within a safe range
  const MIN_LENGTH = 1
  const MAX_LENGTH = 1024
  if (
    typeof length !== "number" ||
    !Number.isInteger(length) ||
    length < MIN_LENGTH ||
    length > MAX_LENGTH
  ) {
    throw new Error(
      `Invalid length for generateRandomId: must be an integer between ${MIN_LENGTH} and ${MAX_LENGTH}`
    )
  }
  const random = randomBytes(length)
  return encode(random)
}

const scryptAsync = promisify(_scrypt)

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  // Store as: salt:hash (both base64)
  return `${salt.toString("base64")}:${derivedKey.toString("base64")}`
}

export async function verifyPassword(
  hashed: string,
  password: string
): Promise<boolean> {
  if (!hashed || typeof hashed !== "string" || !password) return false
  const [saltB64, hashB64] = hashed.split(":")
  if (!saltB64 || !hashB64) return false

  const salt = Buffer.from(saltB64, "base64")
  const hash = Buffer.from(hashB64, "base64")
  const derivedKey = (await scryptAsync(password, salt, hash.length)) as Buffer

  // Ensure both buffers are the same length before comparing
  if (derivedKey.length !== hash.length) return false

  return timingSafeEqual(derivedKey, hash)
}
