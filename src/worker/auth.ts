import type { ApiErrorResponse, WorkerBindings } from './types'

export type AccessKeyResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; response: ApiErrorResponse }

const encoder = new TextEncoder()

type SubtleCryptoWithTimingSafeEqual = SubtleCrypto & {
  timingSafeEqual?: (a: BufferSource, b: BufferSource) => boolean
}

export async function verifyAccessKey(headers: Headers, env?: WorkerBindings): Promise<AccessKeyResult> {
  if (!env?.RAG_ACCESS_KEY) {
    return {
      ok: false,
      status: 500,
      response: {
        error: {
          code: 'server_misconfigured',
          message: 'サーバー設定が不足しています。'
        }
      }
    }
  }

  const suppliedKey = getSuppliedAccessKey(headers)

  if (!await constantTimeKeyEqual(suppliedKey, env.RAG_ACCESS_KEY)) {
    return {
      ok: false,
      status: 401,
      response: {
        error: {
          code: 'unauthorized',
          message: '確認用キーが必要です。'
        }
      }
    }
  }

  return { ok: true }
}

export async function verifyAdminAccessKey(headers: Headers, env?: WorkerBindings): Promise<AccessKeyResult> {
  if (!env?.RAG_ADMIN_ACCESS_KEY) {
    return {
      ok: false,
      status: 500,
      response: {
        error: {
          code: 'server_misconfigured',
          message: 'サーバー設定が不足しています。'
        }
      }
    }
  }

  const suppliedKey = getSuppliedAccessKey(headers)

  if (!await constantTimeKeyEqual(suppliedKey, env.RAG_ADMIN_ACCESS_KEY)) {
    return {
      ok: false,
      status: 401,
      response: {
        error: {
          code: 'unauthorized',
          message: 'admin確認用キーが必要です。'
        }
      }
    }
  }

  return { ok: true }
}

function getSuppliedAccessKey(headers: Headers): string | null {
  const bearer = headers.get('authorization')

  if (bearer?.startsWith('Bearer ')) {
    return bearer.slice('Bearer '.length).trim()
  }

  return headers.get('x-access-key')
}

export async function constantTimeKeyEqual(supplied: string | null | undefined, expected: string | null | undefined): Promise<boolean> {
  if (!supplied || !expected) {
    return false
  }

  const [suppliedHash, expectedHash] = await Promise.all([
    hashSecret(supplied),
    hashSecret(expected)
  ])

  const subtle = crypto.subtle as SubtleCryptoWithTimingSafeEqual

  if (typeof subtle.timingSafeEqual === 'function') {
    return subtle.timingSafeEqual(suppliedHash, expectedHash)
  }

  return timingSafeEqualFallback(new Uint8Array(suppliedHash), new Uint8Array(expectedHash))
}

async function hashSecret(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest('SHA-256', encoder.encode(value))
}

function timingSafeEqualFallback(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.byteLength ^ b.byteLength
  const length = Math.max(a.byteLength, b.byteLength)

  for (let index = 0; index < length; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0)
  }

  return diff === 0
}
