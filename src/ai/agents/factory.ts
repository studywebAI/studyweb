import { AIModel, createGoogleModel } from '../genkit';
import { BaseAgent } from './base-agent';
import { ContentAgent } from './content-agent';
import { DifficultyAgent } from './difficulty-agent';
import { HintAgent } from './hint-agent';
import { ExplainerAgent } from './explainer-agent';
import { TeacherAgent } from './teacher-agent';
import { EvaluatorAgent } from './evaluator-agent';

// Define a map of agent types to their corresponding classes.
const agentClasses = {
    content: ContentAgent,
    difficulty: DifficultyAgent,
    hint: HintAgent,
    explainer: ExplainerAgent,
    teacher: TeacherAgent,
    evaluator: EvaluatorAgent
};

// Define a type for the keys of the agentClasses map.
export type AgentType = keyof typeof agentClasses;

/**
 * Factory function to create an AI agent instance.
 * @param agentType - The type of agent to create.
 * @param model - The AI model configuration to use for the agent. If not provided, a default is used.
 * @returns An instance of the requested agent.
 */
export function createAgent(agentType: AgentType, model?: AIModel): BaseAgent {
    const AgentClass = agentClasses[agentType];
    if (!AgentClass) {
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    // If no model is provided, create a default one. This is a fallback.
    const agentModel = model || createGoogleModel('gemini-1.5-flash-latest');
    
    return new AgentClass(agentModel);
}
