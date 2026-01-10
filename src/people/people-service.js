const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * PeopleService - Manages people knowledge base
 * 
 * Storage: Hybrid (JSON for bot, Obsidian for human browsing)
 * - data/people.json - Primary lookup
 * - Obsidian People/ folder - Rich notes
 */
class PeopleService {
    constructor(config = {}) {
        this.dataPath = config.dataPath || path.join(process.cwd(), 'data', 'people.json');
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
            fs.writeFileSync(this.dataPath, JSON.stringify({ people: [], pending: [] }, null, 2));
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
     * Get a person by name or alias
     * @param {string} nameOrAlias - Name or alias to search for
     * @returns {object|null} Person object or null
     */
    getPerson(nameOrAlias) {
        const data = this._loadData();
        const searchTerm = nameOrAlias.toLowerCase().trim();

        return data.people.find(p => {
            if (p.name.toLowerCase() === searchTerm) return true;
            if (p.aliases && p.aliases.some(a => a.toLowerCase() === searchTerm)) return true;
            return false;
        }) || null;
    }

    /**
     * Check if a person exists (by name or alias)
     * @param {string} nameOrAlias 
     * @returns {boolean}
     */
    exists(nameOrAlias) {
        return this.getPerson(nameOrAlias) !== null;
    }

    /**
     * Add a new person to the knowledge base
     * @param {object} personData - { name, description, aliases?, tags? }
     * @returns {object} Created person
     */
    async addPerson(personData) {
        const data = this._loadData();
        const id = this._generateId(personData.name);

        // Check if already exists
        if (this.getPerson(personData.name)) {
            throw new Error(`Person "${personData.name}" already exists`);
        }

        // Parse description with LLM if available
        let metadata = {};
        if (this.llmClient && personData.description) {
            try {
                metadata = await this._parseDescription(personData.description);
            } catch (err) {
                logger.warn(`Failed to parse person description: ${err.message}`);
            }
        }

        const person = {
            id,
            name: personData.name,
            aliases: personData.aliases || [],
            description: personData.description || '',
            tags: [...(personData.tags || []), ...(metadata.tags || [])],
            metadata: {
                organization: metadata.organization || null,
                hierarchy: metadata.hierarchy || null,
                reports_to: metadata.reports_to || null,
                manages: metadata.manages || null,
                contact_preference: metadata.contact_preference || null,
                ...metadata
            },
            created_at: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0],
            task_count: 0
        };

        data.people.push(person);

        // Remove from pending if was there
        data.pending = data.pending.filter(p =>
            p.name.toLowerCase() !== personData.name.toLowerCase()
        );

        this._saveData(data);
        logger.info(`Added person: ${person.name} (${person.id})`);

        // Create Obsidian note if file manager available
        if (this.fileManager && typeof this.fileManager.createPersonNote === 'function') {
            try {
                await this.fileManager.createPersonNote(person);
            } catch (err) {
                logger.warn(`Failed to create Obsidian note for ${person.name}: ${err.message}`);
            }
        }

        return person;
    }

    /**
     * Update an existing person
     * @param {string} id - Person ID
     * @param {object} updates - Fields to update
     * @returns {object} Updated person
     */
    async updatePerson(id, updates) {
        const data = this._loadData();
        const index = data.people.findIndex(p => p.id === id);

        if (index === -1) {
            throw new Error(`Person with id "${id}" not found`);
        }

        // Re-parse description if updated
        if (updates.description && this.llmClient) {
            try {
                const metadata = await this._parseDescription(updates.description);
                updates.metadata = { ...data.people[index].metadata, ...metadata };
                updates.tags = [...new Set([...(data.people[index].tags || []), ...(metadata.tags || [])])];
            } catch (err) {
                logger.warn(`Failed to parse updated description: ${err.message}`);
            }
        }

        data.people[index] = {
            ...data.people[index],
            ...updates,
            updated_at: new Date().toISOString().split('T')[0]
        };

        this._saveData(data);
        logger.info(`Updated person: ${data.people[index].name}`);

        return data.people[index];
    }

    /**
     * List all known people
     * @returns {array} Array of people
     */
    listPeople() {
        const data = this._loadData();
        return data.people;
    }

    /**
     * Get known people for prompt injection
     * Returns minimal format: [{id, name, description}]
     */
    getKnownPeopleForPrompt() {
        const data = this._loadData();
        return data.people.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description?.substring(0, 50) || ''
        }));
    }

    /**
     * Get pending (unknown) people to ask about
     * @returns {array} Array of pending names with context
     */
    getPendingPeople() {
        const data = this._loadData();
        return data.pending;
    }

    /**
     * Mark a person name as pending (to ask about later)
     * @param {string} name - Person name
     * @param {string} context - Where/how the name was mentioned
     */
    markAsPending(name, context = '') {
        // Skip if already known
        if (this.exists(name)) {
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
        logger.info(`Marked as pending: ${name}`);
        return true;
    }

    /**
     * Increment task count for a person
     * @param {string} nameOrAlias 
     */
    incrementTaskCount(nameOrAlias) {
        const person = this.getPerson(nameOrAlias);
        if (person) {
            const data = this._loadData();
            const index = data.people.findIndex(p => p.id === person.id);
            data.people[index].task_count = (data.people[index].task_count || 0) + 1;
            this._saveData(data);
        }
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
     * @param {string} description - User's description of the person
     * @returns {object} Extracted metadata
     */
    async _parseDescription(description) {
        if (!this.llmClient) {
            return {};
        }

        const prompt = `Extract structured metadata from this person description. Return JSON only.

Description: "${description}"

Extract:
- organization: "Work", "Personal", "Family", "Client", etc.
- hierarchy: Relationship to user, e.g. "2 levels above", "peer", "reports to me"
- reports_to: Name if mentioned (e.g., "reports to Mas Afan")
- manages: Names if mentioned
- contact_preference: Preferred way to contact if mentioned
- tags: Array of relevant tags (e.g., ["boss", "department-head", "formal"])
- notes: Any other relevant info

Respond with JSON only:
{
  "organization": "...",
  "hierarchy": "...",
  "reports_to": null,
  "manages": null,
  "contact_preference": null,
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

module.exports = PeopleService;
