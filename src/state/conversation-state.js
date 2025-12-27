const logger = require('../utils/logger');

/**
 * In-memory conversation state store for multi-turn interactions
 * Phase 1 (MVP): In-memory Map
 * Phase 2: SQLite/JSON persistence
 * Phase 3: Full conversation history with context
 */
class ConversationState {
    constructor() {
        this.states = new Map(); // userId -> state
        this.staleTimeout = 30 * 60 * 1000; // 30 minutes

        // Prune stale states every 10 minutes
        setInterval(() => this.prune(), 10 * 60 * 1000);
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
    }

    /**
     * Get state for a user
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
     * Clear state for a user
     */
    clear(userId) {
        const had = this.states.delete(userId.toString());
        if (had) {
            logger.info(`Conversation state cleared for user ${userId}`);
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
        }
    }

    /**
     * Get stats for debugging
     */
    getStats() {
        return {
            activeStates: this.states.size,
            staleTimeout: this.staleTimeout
        };
    }
}

// Singleton instance
const conversationState = new ConversationState();

module.exports = conversationState;
