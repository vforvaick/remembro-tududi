const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ObsidianFileManager {
  constructor(config) {
    this.vaultPath = config.vaultPath;
    this.dailyNotesPath = path.join(
      config.vaultPath,
      config.dailyNotesPath || 'Daily Notes'
    );
    this.knowledgePath = path.join(config.vaultPath, 'Knowledge');
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async ensureDailyNote(date) {
    const fileName = `${date}.md`;
    const filePath = path.join(this.dailyNotesPath, fileName);

    if (!fs.existsSync(this.dailyNotesPath)) {
      fs.mkdirSync(this.dailyNotesPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      const template = `# ${date}

## Tasks

## Notes

## Journal

`;
      fs.writeFileSync(filePath, template);
      logger.info(`Created daily note: ${date}`);
    }

    return filePath;
  }

  async appendTaskToDailyNote(task) {
    const date = task.due_date || new Date().toISOString().split('T')[0];
    const filePath = await this.ensureDailyNote(date);

    let content = fs.readFileSync(filePath, 'utf-8');

    // Format task line
    const taskLine = `- [ ] ${task.title} (due: ${task.due_date || 'today'}) ⏱️${task.time_estimate}m ⚡${task.energy_level} #${task.project || 'inbox'} [[Tududi-${task.id}]]\n`;

    // Find Tasks section and append
    if (content.includes('## Tasks')) {
      const tasksIndex = content.indexOf('## Tasks') + 9;
      content = content.slice(0, tasksIndex) + '\n' + taskLine + content.slice(tasksIndex);
    } else {
      content += '\n## Tasks\n' + taskLine;
    }

    fs.writeFileSync(filePath, content);
    logger.info(`Appended task to daily note: ${task.title}`);
  }

  async createKnowledgeNote(data) {
    const { title, content, category, tags } = data;
    const slug = this.generateSlug(title);
    const date = new Date().toISOString().split('T')[0];
    const fileName = `${slug}-${date}.md`;

    const categoryPath = path.join(this.knowledgePath, category || 'Uncategorized');
    const filePath = path.join(categoryPath, fileName);

    // Create category directory if needed
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }

    // Format note content
    const noteContent = `# ${title}

**Created:** ${date}
**Tags:** ${tags.map(t => `#${t}`).join(' ')}
**Category:** ${category}

---

${content}

---

**Source:** Telegram
`;

    fs.writeFileSync(filePath, noteContent);
    logger.info(`Created knowledge note: ${title}`);

    return filePath;
  }

  async searchNotes(query) {
    const results = [];
    const searchPath = this.vaultPath;

    function searchDirectory(dirPath) {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          searchDirectory(filePath);
        } else if (file.endsWith('.md')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (content.toLowerCase().includes(query.toLowerCase())) {
            // Extract context around match
            const index = content.toLowerCase().indexOf(query.toLowerCase());
            const start = Math.max(0, index - 100);
            const end = Math.min(content.length, index + 100);
            const excerpt = content.slice(start, end);

            results.push({
              file: filePath.replace(searchPath, ''),
              excerpt,
              relevance: 1.0 // Simple keyword match for now
            });
          }
        }
      }
    }

    searchDirectory(searchPath);
    logger.info(`Found ${results.length} notes matching: ${query}`);

    return results;
  }

  async updateTaskStatus(taskId, completed) {
    // Find daily note containing this task
    const dailyNotesFiles = fs.readdirSync(this.dailyNotesPath);

    for (const file of dailyNotesFiles) {
      const filePath = path.join(this.dailyNotesPath, file);
      let content = fs.readFileSync(filePath, 'utf-8');

      const taskPattern = new RegExp(`- \\[([ x])\\](.+?)\\[\\[Tududi-${taskId}\\]\\]`, 'g');

      if (taskPattern.test(content)) {
        content = content.replace(
          taskPattern,
          `- [${completed ? 'x' : ' '}]$2[[Tududi-${taskId}]]`
        );
        fs.writeFileSync(filePath, content);
        logger.info(`Updated task ${taskId} status in Obsidian: ${completed}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Create a person note in Obsidian People/ folder
   * @param {object} person - Person data from PeopleService
   * @returns {string} Path to created note
   */
  async createPersonNote(person) {
    const peoplePath = path.join(this.vaultPath, 'People');
    const fileName = `${person.id}.md`;
    const filePath = path.join(peoplePath, fileName);

    // Create People directory if needed
    if (!fs.existsSync(peoplePath)) {
      fs.mkdirSync(peoplePath, { recursive: true });
    }

    // Build tags string
    const tags = (person.tags || []).map(t => `#${t}`).join(' ');

    // Build metadata section
    const metaLines = [];
    if (person.metadata) {
      if (person.metadata.organization) metaLines.push(`**Organization:** ${person.metadata.organization}`);
      if (person.metadata.hierarchy) metaLines.push(`**Hierarchy:** ${person.metadata.hierarchy}`);
      if (person.metadata.reports_to) metaLines.push(`**Reports to:** ${person.metadata.reports_to}`);
      if (person.metadata.contact_preference) metaLines.push(`**Contact via:** ${person.metadata.contact_preference}`);
    }

    // Format note content with YAML frontmatter
    const noteContent = `---
aliases: [${(person.aliases || []).map(a => `"${a}"`).join(', ')}]
tags: [${(person.tags || []).join(', ')}]
created: ${person.created_at}
---

# ${person.name}

${metaLines.join('\n')}

## Description

${person.description || '_No description yet._'}

## Notes

${person.metadata?.notes || '_No additional notes._'}

## Related Tasks

_Tasks mentioning ${person.name} will be linked here._

`;

    fs.writeFileSync(filePath, noteContent);
    logger.info(`Created person note: ${person.name}`);

    return filePath;
  }
}

module.exports = ObsidianFileManager;
