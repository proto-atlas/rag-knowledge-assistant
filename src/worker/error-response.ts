import type { Context } from 'hono'
import type { ApiErrorResponse, WorkerBindings } from './types'

type AppContext = Context<{ Bindings: WorkerBindings }>

export function logAndReturn500(c: AppContext, route: string, error: unknown, message: string) {
  console.error(JSON.stringify({
    level: 'error',
    route,
    code: 'server_misconfigured',
    error: normalizeLoggedError(error),
    timestamp: new Date().toISOString()
  }))

  const response: ApiErrorResponse = {
    error: {
      code: 'server_misconfigured',
      message
    }
  }

  return c.json(response, 500)
}

export function normalizeLoggedError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: truncateLogMessage(error.message)
    }
  }

  return {
    name: typeof error,
    message: truncateLogMessage(String(error))
  }
}

export function truncateLogMessage(message: string): string {
  return message.length > 500 ? `${message.slice(0, 500)}...` : message
}
