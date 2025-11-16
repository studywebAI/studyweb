import { AIModel } from '../models';

/**
 * Base class for all AI agents.
 */
export abstract class BaseAgent {
    protected model: AIModel;

    constructor(model: AIModel) {
        this.model = model;
    }

    /**
     * Abstract method to run the agent's logic.
     * @param args - Arguments for the agent.
     * @returns The result of the agent's execution.
     */
    abstract run(...args: any[]): Promise<any>;
}
