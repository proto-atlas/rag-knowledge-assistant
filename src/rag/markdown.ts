import type { MarkdownSection, ParsedMarkdownDocument } from './types'

const TITLE_PATTERN = /^#\s+(.+)$/
const SECTION_HEADING_PATTERN = /^(#{2,4})\s+(.+)$/

export function parseMarkdownDocument(markdown: string): ParsedMarkdownDocument {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const title = findTitle(lines)
  const sections: MarkdownSection[] = []
  const headingPath: string[] = []
  let currentContent: string[] = []

  for (const line of lines) {
    if (TITLE_PATTERN.test(line)) {
      continue
    }

    const headingMatch = SECTION_HEADING_PATTERN.exec(line)
    if (headingMatch) {
      pushSection(sections, headingPath, currentContent)
      currentContent = []

      const level = headingMatch[1].length
      const heading = headingMatch[2].trim()
      const pathIndex = level - 2
      headingPath.splice(pathIndex)
      headingPath[pathIndex] = heading
      continue
    }

    currentContent.push(line)
  }

  pushSection(sections, headingPath.length > 0 ? headingPath : [title], currentContent)

  if (sections.length === 0) {
    throw new Error('Markdown document must include at least one non-empty section')
  }

  return { title, sections }
}

function findTitle(lines: string[]): string {
  const titleLine = lines.find((line) => TITLE_PATTERN.test(line))
  const title = titleLine ? TITLE_PATTERN.exec(titleLine)?.[1].trim() : undefined

  if (!title) {
    throw new Error('Markdown document must start with an H1 title')
  }

  return title
}

function pushSection(sections: MarkdownSection[], headingPath: string[], contentLines: string[]) {
  const content = normalizeContent(contentLines.join('\n'))

  if (content.length === 0) {
    return
  }

  sections.push({
    headingPath: [...headingPath],
    content
  })
}

function normalizeContent(content: string): string {
  return content
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}
