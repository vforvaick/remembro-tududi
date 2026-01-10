const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * ProjectService - Manages project knowledge base
 * 
 * Storage: Hybrid (JSON for bot, Obsidian for human browsing)
 * - data/projects.json - Primary lookup
 * - Obsidian Projects/ folder - Rich notes
 */
class ProjectService {
    constructor(config = {}) {
        this.dataPath = config.dataPath || path.join(process.cwd(), 'data', 'projects.json');
        this.llmClient = config.llmClient || null;
        this.fileManager = config.fileManager || null;
        this._ensureDataFile();
    }

    _ensureDataFile() {
        const dir = path.dirname(this.dataPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.dataPath)) {
            fs.writeFileSync(this.dataPath, JSON.stringify({ projects: [], pending: [] }, null, 2));
        }
    }

    _loadData() {
        const raw = fs.readFileSync(this.dataPath, 'utf-8');
        return JSON.parse(raw);
    }

    _saveData(data) {
        fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    }

    _generateId(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }

    /**
     * Get a project by name or alias
     * @param {string} nameOrAlias - Name or alias to search for
     * @returns {object|null} Project object or null
     */
    getProject(nameOrAlias) {
        const data = this._loadData();
        const searchTerm = nameOrAlias.toLowerCase().trim();

        return data.projects.find(p => {
            if (p.name.toLowerCase() === searchTerm) return true;
            if (p.aliases && p.aliases.some(a => a.toLowerCase() === searchTerm)) return true;
            return false;
        }) || null;
    }

    /**
     * Check if a project exists (by name or alias)
     * @param {string} nameOrAlias 
     * @returns {boolean}
     */
    exists(nameOrAlias) {
        return this.getProject(nameOrAlias) !== null;
    }

    /**
     * Add a new project to the knowledge base
     * @param {object} projectData - { name, description, aliases?, tags? }
     * @returns {object} Created project
     */
    async addProject(projectData) {
        const data = this._loadData();
        const id = this._generateId(projectData.name);

        // Check if already exists
        if (this.getProject(projectData.name)) {
            throw new Error(`Project "${projectData.name}" already exists`);
        }

        // Parse description with LLM if available
        let metadata = {};
        if (this.llmClient && projectData.description) {
            try {
                metadata = await this._parseDescription(projectData.description);
            } catch (err) {
                logger.warn(`Failed to parse project description: ${err.message}`);
            }
        }

        const project = {
            id,
            name: projectData.name,
            aliases: projectData.aliases || [],
            description: projectData.description || '',
            tags: [...(projectData.tags || []), ...(metadata.tags || [])],
            metadata: {
                category: metadata.category || 'Uncategorized',
                status: metadata.status || 'active',
                deadline: metadata.deadline || null,
                stakeholders: metadata.stakeholders || [],
                priority: metadata.priority || 'medium',
                ...metadata
            },
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            task_count: 0
        };

        data.projects.push(project);

        // Remove from pending if was there
        data.pending = data.pending.filter(p =>
            p.name.toLowerCase() !== projectData.name.toLowerCase()
        );

        this._saveData(data);
        logger.info(`Added project: ${project.name} (${project.id})`);

        // Create Obsidian note if file manager available
        if (this.fileManager && typeof this.fileManager.createProjectNote === 'function') {
            try {
                await this.fileManager.createProjectNote(project);
            } catch (err) {
                logger.warn(`Failed to create Obsidian note for ${project.name}: ${err.message}`);
            }
        }

        return project;
    }

    /**
     * Update an existing project
     * @param {string} id - Project ID
     * @param {object} updates - Fields to update
     * @returns {object} Updated project
     */
    async updateProject(id, updates) {
        const data = this._loadData();
        const index = data.projects.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error(`Project with id "${id}" not found`);
        }

        // Re-parse description if updated
        if (updates.description && this.llmClient) {
            try {
                const metadata = await this._parseDescription(updates.description);
                updates.metadata = { ...data.projects[index].metadata, ...metadata };
                updates.tags = [...new Set([...(data.projects[index].tags || []), ...(metadata.tags || [])])];
            } catch (err) {
                logger.warn(`Failed to parse updated description: ${err.message}`);
            }
        }

        data.projects[index] = {
            ...data.projects[index],
            ...updates,
            updated_at: new Date().toISOString().split('T')[0]
        };

        this._saveData(data);
        logger.info(`Updated project: ${data.projects[index].name}`);

        return data.projects[index];
    }

    /**
     * List all known projects
     * @returns {array} Array of projects
     */
    listProjects() {
        const data = this._loadData();
        return data.projects;
    }

    /**
     * Get known projects for prompt injection
     * Returns minimal format: [{id, name, description}]
     */
    getKnownProjectsForPrompt() {
        const data = this._loadData();
        return data.projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description?.substring(0, 50) || ''
        }));
    }

    /**
     * Get pending (unknown) projects to ask about
     * @returns {array} Array of pending names with context
     */
    getPendingProjects() {
        const data = this._loadData();
        return data.pending;
    }

    /**
     * Mark a project name as pending (to ask about later)
     * @param {string} name - Project name
     * @param {string} context - Where/how the name was mentioned
     */
    markAsPending(name, context = '') {
        // Skip if already known
        if (this.exists(name)) {
            return false;
        }

        // Skip generic category names
        const genericCategories = ['work', 'personal', 'family', 'shopping', 'business', 'health', 'finance'];
        if (genericCategories.includes(name.toLowerCase())) {
            return false;
        }

        const data = this._loadData();

        // Check if already pending
        const existing = data.pending.find(p => p.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            existing.mentions = (existing.mentions || 1) + 1;
            existing.last_mentioned = new Date().toISOString();
            if (context) existing.contexts = [...(existing.contexts || []), context].slice(-5);
        } else {
            data.pending.push({
                name,
                mentions: 1,
                contexts: context ? [context] : [],
                first_mentioned: new Date().toISOString(),
                last_mentioned: new Date().toISOString()
            });
        }

        this._saveData(data);
        logger.info(`Marked project as pending: ${name}`);
        return true;
    }

    /**
     * Increment task count for a project
     * @param {string} nameOrAlias 
     */
    incrementTaskCount(nameOrAlias) {
        const project = this.getProject(nameOrAlias);
        if (project) {
            const data = this._loadData();
            const index = data.projects.findIndex(p => p.id === project.id);
            data.projects[index].task_count = (data.projects[index].task_count || 0) + 1;
            this._saveData(data);
        }
    }

    /**
     * Get project statistics
     * @returns {object} Stats object
     */
    getStats() {
        const data = this._loadData();
        const active = data.projects.filter(p => p.metadata?.status === 'active').length;
        const paused = data.projects.filter(p => p.metadata?.status === 'paused').length;
        const completed = data.projects.filter(p => p.metadata?.status === 'completed').length;
        const totalTasks = data.projects.reduce((sum, p) => sum + (p.task_count || 0), 0);

        return {
            total: data.projects.length,
            active,
            paused,
            completed,
            pending: data.pending.length,
            totalTasks
        };
    }

    /**
     * Clear pending list (after batch asking)
     */
    clearPending() {
        const data = this._loadData();
        data.pending = [];
        this._saveData(data);
    }

    /**
     * Use LLM to parse natural language description into structured metadata
     * @param {string} description - User's description of the project
     * @returns {object} Extracted metadata
     */
    async _parseDescription(description) {
        if (!this.llmClient) {
            return {};
        }

        const prompt = `Extract structured metadata from this project description. Return JSON only.

Description: "${description}"

Extract:
- category: "Work", "Personal", "Client", "Side Project", etc.
- status: "active", "paused", "completed", "planning"
- deadline: Date if mentioned (YYYY-MM-DD format), null otherwise
- stakeholders: Array of people names if mentioned
- priority: "high", "medium", "low"
- tags: Array of relevant tags
- notes: Any other relevant info

Respond with JSON only:
{
  "category": "...",
  "status": "active",
  "deadline": null,
  "stakeholders": [],
  "priority": "medium",
  "tags": [],
  "notes": ""
}`;

        try {
            const result = await this.llmClient.parseJSON(prompt, {
                systemPrompt: 'You are a metadata extraction assistant. Extract structured information from natural language descriptions. Respond with valid JSON only.'
            });
            return result;
        } catch (err) {
            logger.error(`Failed to parse description: ${err.message}`);
            return {};
        }
    }
}

module.exports = ProjectService;
