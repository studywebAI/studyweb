import { models, AIModel } from '../models';
import { BaseAgent } from './base-agent';
import { ContentAgent } from './content-agent';
import { DifficultyAgent } from './difficulty-agent';
import { HintAgent } from './hint-agent';
import { ExplainerAgent } from './explainer-agent';
import { TeacherAgent } from './teacher-agent';
import { EvaluatorAgent } from './evaluator-agent';

const agentClasses = {
    content: ContentAgent,
    difficulty: DifficultyAgent,
    hint: HintAgent,
    explainer: ExplainerAgent,
    teacher: TeacherAgent,
    evaluator: EvaluatorAgent
};

/**
 * Factory function to create an AI agent instance.
 * @param agentType - The type of agent to create.
 * @param model - The AI model configuration to use for the agent.
 * @returns An instance of the requested agent.
 */
export function createAgent(agentType: keyof typeof agentClasses, model: AIModel): BaseAgent {
    const AgentClass = agentClasses[agentType];
    if (!AgentClass) {
        throw new Error(`Unknown agent type: ${agentType}`);
    }
    return new AgentClass(model);
}
