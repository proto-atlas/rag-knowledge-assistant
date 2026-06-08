import axeCore from 'axe-core'
import type { Page } from '@playwright/test'

export type AxeViolationImpact = 'minor' | 'moderate' | 'serious' | 'critical' | null

export type AxeViolationSummary = {
  id: string
  impact: AxeViolationImpact
  help: string
  helpUrl: string
  nodeTargets: string[]
}

type AxeRunResult = {
  violations: AxeViolationSummary[]
  passes: unknown[]
  incomplete: unknown[]
  inapplicable: unknown[]
  testEngine: {
    name: string
    version: string
  }
  timestamp: string
  url: string
}

type AxeRawViolation = {
  id: string
  impact: AxeViolationImpact
  help: string
  helpUrl: string
  nodes: Array<{
    target: string[]
  }>
}

type AxeRawRunResult = Omit<AxeRunResult, 'violations'> & {
  violations: AxeRawViolation[]
}

type AxeWindow = Window & {
  axe: {
    run: (
      context?: unknown,
      options?: unknown
    ) => Promise<AxeRawRunResult>
  }
}

export async function runAxeCheck(page: Page): Promise<AxeRunResult> {
  await page.addScriptTag({ content: axeCore.source })

  return page.evaluate(async () => {
    const result = await (window as unknown as AxeWindow).axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'best-practice']
      }
    })

    return {
      violations: result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodeTargets: violation.nodes.map((node) => node.target.join(' '))
      })),
      passes: result.passes,
      incomplete: result.incomplete,
      inapplicable: result.inapplicable,
      testEngine: result.testEngine,
      timestamp: result.timestamp,
      url: result.url
    }
  })
}

export function countSevereViolations(violations: AxeViolationSummary[]): number {
  return violations.filter((violation) => {
    return violation.impact === 'critical' || violation.impact === 'serious'
  }).length
}
