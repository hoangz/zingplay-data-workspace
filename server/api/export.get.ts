import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { resolveClaudePath } from '../utils/claudeDir'
import { parseFrontmatter } from '../utils/frontmatter'

interface ExportedItem {
  slug: string
  frontmatter: Record<string, unknown>
  body: string
  directory?: string
}

interface ExportedWorkflow {
  slug: string
  [key: string]: unknown
}

interface ExportPayload {
  version: string
  exportedAt: string
  agents: ExportedItem[]
  commands: ExportedItem[]
  skills: ExportedItem[]
  workflows: ExportedWorkflow[]
  settings: Record<string, unknown>
}

// Recursively scan directory for .md files
async function scanMarkdownFiles(dir: string, relDir = ''): Promise<ExportedItem[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const items: ExportedItem[] = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      const sub = await scanMarkdownFiles(fullPath, relDir ? `${relDir}/${entry.name}` : entry.name)
      items.push(...sub)
    } else if (entry.name.endsWith('.md')) {
      const raw = await readFile(fullPath, 'utf-8')
      const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(raw)
      const name = entry.name.replace(/\.md$/, '')
      const slug = relDir ? `${relDir}/${name}` : name
      const item: ExportedItem = { slug, frontmatter, body }
      if (relDir) item.directory = relDir
      items.push(item)
    }
  }

  return items
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as { includeSettings?: string }
  const includeSettings = query.includeSettings !== 'false'

  // Export agents
  const agentsDir = resolveClaudePath('agents')
  const agents = await scanMarkdownFiles(agentsDir)

  // Export commands
  const commandsDir = resolveClaudePath('commands')
  const commands = await scanMarkdownFiles(commandsDir)

  // Export skills (only local ~/.claude/skills/*/SKILL.md)
  const skillsDir = resolveClaudePath('skills')
  const skills: ExportedItem[] = []
  if (existsSync(skillsDir)) {
    const entries = await readdir(skillsDir, { withFileTypes: true })
    for (const dir of entries) {
      if (!dir.isDirectory()) continue
      const skillPath = join(skillsDir, dir.name, 'SKILL.md')
      if (!existsSync(skillPath)) continue
      const raw = await readFile(skillPath, 'utf-8')
      const { frontmatter, body } = parseFrontmatter<Record<string, unknown>>(raw)
      skills.push({ slug: dir.name, frontmatter, body })
    }
  }

  // Export workflows
  const workflowsDir = resolveClaudePath('workflows')
  const workflows: ExportedWorkflow[] = []
  if (existsSync(workflowsDir)) {
    const files = await readdir(workflowsDir)
    for (const filename of files) {
      if (!filename.endsWith('.json')) continue
      const raw = await readFile(join(workflowsDir, filename), 'utf-8')
      try {
        const data = JSON.parse(raw)
        workflows.push({ slug: filename.replace(/\.json$/, ''), ...data })
      } catch {
        // skip malformed workflow files
      }
    }
  }

  // Export settings
  let settings: Record<string, unknown> = {}
  if (includeSettings) {
    const settingsPath = resolveClaudePath('settings.json')
    if (existsSync(settingsPath)) {
      try {
        const raw = await readFile(settingsPath, 'utf-8')
        settings = JSON.parse(raw)
      } catch {
        // skip malformed settings
      }
    }
  }

  const date = new Date().toISOString().split('T')[0]
  const payload: ExportPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    agents,
    commands,
    skills,
    workflows,
    settings,
  }

  setHeader(event, 'Content-Disposition', `attachment; filename="claude-config-${date}.json"`)
  setHeader(event, 'Content-Type', 'application/json')

  return payload
})
