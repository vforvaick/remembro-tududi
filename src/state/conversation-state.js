const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Conversation state store with JSON file persistence
 * Phase 1 (MVP): In-memory Map ✅ 
 * Phase 2: JSON persistence ✅
 * Phase 3: Full conversation history with context (future)
 */
class ConversationState {
    constructor(options = {}) {
        this.states = new Map(); // userId -> state
        this.staleTimeout = options.staleTimeout || 30 * 60 * 1000; // 30 minutes
        this.storagePath = options.storagePath || 'data/conversation-state.json';
        this.saveDebounce = null;
        this.saveDelay = 1000; // 1 second debounce

        // Ensure data directory exists
        const dir = path.dirname(this.storagePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Load persisted state on init
        this._load();

        // Prune stale states every 10 minutes
        setInterval(() => this.prune(), 10 * 60 * 1000);
    }

    /**
     * Load state from JSON file
     */
    _load() {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));
                const now = Date.now();
                let loaded = 0;

                for (const [userId, state] of Object.entries(data)) {
                    // Skip stale states during load
                    if (now - state.timestamp <= this.staleTimeout) {
                        this.states.set(userId, state);
                        loaded++;
                    }
                }

                if (loaded > 0) {
                    logger.info(`Loaded ${loaded} conversation state(s) from disk`);
                }
            }
        } catch (error) {
            logger.warn(`Failed to load conversation state: ${error.message}`);
        }
    }

    /**
     * Save state to JSON file (debounced)
     */
    _save() {
        // Debounce saves
        if (this.saveDebounce) {
            clearTimeout(this.saveDebounce);
        }

        this.saveDebounce = setTimeout(() => {
            try {
                const data = Object.fromEntries(this.states);
                // Atomic write: write to temp file, then rename
                const tempPath = `${this.storagePath}.tmp`;
                fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
                fs.renameSync(tempPath, this.storagePath);
                logger.info(`Saved ${this.states.size} conversation state(s) to disk`);
            } catch (error) {
                logger.error(`Failed to save conversation state: ${error.message}`);
            }
        }, this.saveDelay);
    }

    /**
     * Set state for a user
     */
    set(userId, state) {
        this.states.set(userId.toString(), {
            ...state,
            timestamp: Date.now()
        });
        logger.info(`Conversation state set for user ${userId}: ${state.type}`);
        this._save();
    }

    /**
     * Get state for a user
     * Types: 'story_confirmation', 'tentative', or custom
     */
    get(userId) {
        const state = this.states.get(userId.toString());
        if (state && Date.now() - state.timestamp > this.staleTimeout) {
            this.clear(userId);
            return null;
        }
        return state;
    }

    /**
     * Check if user has tentative state (needs confirmation)
     */
    hasTentative(userId) {
        const state = this.get(userId);
        return state?.type === 'tentative';
    }

    /**
     * Clear state for a user
     */
    clear(userId) {
        const had = this.states.delete(userId.toString());
        if (had) {
            logger.info(`Conversation state cleared for user ${userId}`);
            this._save();
        }
    }

    /**
     * Check if user has pending state
     */
    hasPending(userId) {
        const state = this.get(userId);
        return state !== null;
    }

    /**
     * Cleanup stale states (>30 min)
     */
    prune() {
        const now = Date.now();
        let pruned = 0;
        for (const [userId, state] of this.states) {
            if (now - state.timestamp > this.staleTimeout) {
                this.states.delete(userId);
                pruned++;
            }
        }
        if (pruned > 0) {
            logger.info(`Pruned ${pruned} stale conversation state(s)`);
            this._save();
        }
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            activeStates: this.states.size,
            staleTimeout: this.staleTimeout,
            storagePath: this.storagePath
        };
    }
}

// Singleton instance
const conversationState = new ConversationState();

module.exports = conversationState;

