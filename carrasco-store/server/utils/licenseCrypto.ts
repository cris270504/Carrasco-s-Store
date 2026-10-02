import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const secret = useRuntimeConfig().licenseEncryptionKey
  if (!secret) {
    throw new Error('LICENSE_ENCRYPTION_KEY no esta configurada')
  }
  const key = Buffer.from(secret, 'base64')
  if (key.length !== 32) {
    throw new Error('LICENSE_ENCRYPTION_KEY debe decodificar a 32 bytes (clave AES-256 en base64)')
  }
  return key
}

// Formato almacenado: "<iv>.<authTag>.<ciphertext>" en base64, separados por punto.
export function encryptLicenseCode(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, encrypted].map(buf => buf.toString('base64')).join('.')
}

export function decryptLicenseCode(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split('.')
  if (!ivB64 || !tagB64 || !dataB64) {
    // Compatibilidad con codigos de prueba insertados manualmente en texto plano
    // (todavia no existe un panel de administracion que escriba codigos cifrados).
    return stored
  }

  try {
    const key = getKey()
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()])
    return decrypted.toString('utf8')
  }
  catch {
    return stored
  }
}
