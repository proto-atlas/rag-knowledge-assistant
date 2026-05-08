import { describe, expect, it } from 'vitest'
import { constantTimeKeyEqual, verifyAccessKey, verifyAdminAccessKey } from '../../src/worker/auth'

describe('constantTimeKeyEqual', () => {
  it('同じ文字列を渡すとtrueを返す', async () => {
    await expect(constantTimeKeyEqual('same-secret', 'same-secret')).resolves.toBe(true)
  })

  it('同じ長さで違う文字列を渡すとfalseを返す', async () => {
    await expect(constantTimeKeyEqual('same-secret', 'diff-secret')).resolves.toBe(false)
  })

  it('先頭だけ違う文字列を渡すとfalseを返す', async () => {
    await expect(constantTimeKeyEqual('xsame-secret', 'same-secret')).resolves.toBe(false)
  })

  it('末尾だけ違う文字列を渡すとfalseを返す', async () => {
    await expect(constantTimeKeyEqual('same-secrex', 'same-secret')).resolves.toBe(false)
  })

  it('suppliedが短いとfalseを返す', async () => {
    await expect(constantTimeKeyEqual('same', 'same-secret')).resolves.toBe(false)
  })

  it('suppliedが長いとfalseを返す', async () => {
    await expect(constantTimeKeyEqual('same-secret-extra', 'same-secret')).resolves.toBe(false)
  })

  it('片方が空ならfalseを返す', async () => {
    await expect(constantTimeKeyEqual('', 'same-secret')).resolves.toBe(false)
  })

  it('片方がundefinedならfalseを返す', async () => {
    await expect(constantTimeKeyEqual(undefined, 'same-secret')).resolves.toBe(false)
  })
})

describe('verifyAccessKey', () => {
  it('Bearer access keyが一致するとokを返す', async () => {
    const result = await verifyAccessKey(new Headers({
      authorization: 'Bearer test-access-key'
    }), {
      RAG_ACCESS_KEY: 'test-access-key'
    })

    expect(result).toEqual({ ok: true })
  })

  it('x-access-keyが一致しないと401を返す', async () => {
    const result = await verifyAccessKey(new Headers({
      'x-access-key': 'wrong-access-key'
    }), {
      RAG_ACCESS_KEY: 'test-access-key'
    })

    expect(result).toEqual({
      ok: false,
      status: 401,
      response: {
        error: {
          code: 'unauthorized',
          message: 'access keyが必要です。'
        }
      }
    })
  })
})

describe('verifyAdminAccessKey', () => {
  it('admin access keyが一致するとokを返す', async () => {
    const result = await verifyAdminAccessKey(new Headers({
      authorization: 'Bearer test-admin-key'
    }), {
      RAG_ADMIN_ACCESS_KEY: 'test-admin-key'
    })

    expect(result).toEqual({ ok: true })
  })
})
