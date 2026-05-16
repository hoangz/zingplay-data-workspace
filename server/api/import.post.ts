import { writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { resolveClaudePath } from '../utils/claudeDir'
import { serializeFrontmatter } from '../utils/frontmatter'

interface ImportedItem {
  slug: string
  frontmatter: Record<string, unknown>
  body: string
  directory?: string
}

interface ImportedWorkflow {
  slug: string
  [key: string]: unknown
}

interface ImportPayload {
  version: string
  exportedAt?: string
  agents?: ImportedItem[]
  commands?: ImportedItem[]
  skills?: ImportedItem[]
  workflows?: ImportedWorkflow[]
  settings?: Record<string, unknown>
}

interface ImportResult {
  imported: {
    agents: number
    commands: number
    skills: number
    workflows: number
  }
  skipped: number
  errors: string[]
}

async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true })
  }
}

async function writeMarkdownItem(
  filePath: string,
  item: ImportedItem,
  overwrite: boolean,
  errors: string[],
): Promise<boolean> {
  try {
    if (!overwrite && existsSync(filePath)) return false
    await ensureDir(dirname(filePath))
    const content = serializeFrontmatter(item.frontmatter, item.body)
    await writeFile(filePath, content, 'utf-8')
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    errors.push(`Failed to write ${filePath}: ${msg}`)
    return false
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ImportPayload & { overwrite?: boolean }>(event)

  if (!body?.version) {
    throw createError({ statusCode: 400, message: 'Invalid import file: missing version field' })
  }

  if (body.version !== '1.0') {
    throw createError({ statusCode: 400, message: `Unsupported version: ${body.version}` })
  }

  const overwrite = body.overwrite === true
  const result: ImportResult = {
    imported: { agents: 0, commands: 0, skills: 0, workflows: 0 },
    skipped: 0,
    errors: [],
  }

  // Import agents
  if (Array.isArray(body.agents)) {
    const agentsDir = resolveClaudePath('agents')
    for (const agent of body.agents) {
      if (!agent.slug) continue
      // Support nested slugs like "subdir/agent-name"
      const parts = agent.slug.split('/')
      const filename = `${parts.pop()}.md`
      const subDir = parts.length > 0 ? join(agentsDir, ...parts) : agentsDir
      const filePath = join(subDir, filename)
      const written = await writeMarkdownItem(filePath, agent, overwrite, result.errors)
      if (written) result.imported.agents++
      else if (!result.errors.length || existsSync(filePath)) result.skipped++
    }
  }

  // Import commands
  if (Array.isArray(body.commands)) {
    const commandsDir = resolveClaudePath('commands')
    for (const command of body.commands) {
      if (!command.slug) continue
      const parts = command.slug.split('/')
      const filename = `${parts.pop()}.md`
      const subDir = parts.length > 0 ? join(commandsDir, ...parts) : commandsDir
      const filePath = join(subDir, filename)
      const written = await writeMarkdownItem(filePath, command, overwrite, result.errors)
      if (written) result.imported.commands++
      else if (existsSync(filePath)) result.skipped++
    }
  }

  // Import skills
  if (Array.isArray(body.skills)) {
    const skillsDir = resolveClaudePath('skills')
    for (const skill of body.skills) {
      if (!skill.slug) continue
      const skillDir = join(skillsDir, skill.slug)
      const filePath = join(skillDir, 'SKILL.md')
      const written = await writeMarkdownItem(filePath, skill, overwrite, result.errors)
      if (written) result.imported.skills++
      else if (existsSync(filePath)) result.skipped++
    }
  }

  // Import workflows
  if (Array.isArray(body.workflows)) {
    const workflowsDir = resolveClaudePath('workflows')
    await ensureDir(workflowsDir)
    for (const workflow of body.workflows) {
      if (!workflow.slug) continue
      const filePath = join(workflowsDir, `${workflow.slug}.json`)
      try {
        if (!overwrite && existsSync(filePath)) {
          result.skipped++
          continue
        }
        const { slug: _, ...data } = workflow
        await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
        result.imported.workflows++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        result.errors.push(`Failed to write workflow ${workflow.slug}: ${msg}`)
      }
    }
  }

  // Import settings (only if explicitly included in export)
  if (body.settings && Object.keys(body.settings).length > 0) {
    try {
      const settingsPath = resolveClaudePath('settings.json')
      if (!overwrite && existsSync(settingsPath)) {
        result.skipped++
      } else {
        await writeFile(settingsPath, JSON.stringify(body.settings, null, 2), 'utf-8')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`Failed to write settings.json: ${msg}`)
    }
  }

  return result
})
