import { composeContext } from "@elizaos/core";
import { generateObjectArray } from "@elizaos/core";
import { MemoryManager } from "@elizaos/core";
import {
    ActionExample,
    IAgentRuntime,
    Memory,
    ModelClass,
    Evaluator,
} from "@ai16z/eliza";

export const formatFacts = (facts: Memory[]) => {
    const messageStrings = facts
        .reverse()
        .map((fact: Memory) => fact.content.text);
    const finalMessageStrings = messageStrings.join("\n");
    return finalMessageStrings;
};

const factsTemplate =
    // {{actors}}
    `TASK: Extract Claims from the conversation as an array of claims in JSON format.

# START OF EXAMPLES
These are an examples of the expected output of this task:
{{evaluationExamples}}
# END OF EXAMPLES

# INSTRUCTIONS

Extract any claims from the conversation that are not already present in the list of known facts above:
- Try not to include already-known facts. If you think a fact is already known, but you're not sure, respond with already_known: true.
- If the fact is already in the user's description, set in_bio to true
- If we've already extracted this fact, set already_known to true
- Set the claim type to 'status', 'fact' or 'opinion'
- For true facts about the world or the character that do not change, set the claim type to 'fact'
- For facts that are true but change over time, set the claim type to 'status'
- For non-facts, set the type to 'opinion'
- 'opinion' inlcudes non-factual opinions and also includes the character's thoughts, feelings, judgments or recommendations
- Include any factual detail, including where the user lives, works, or goes to school, what they do for a living, their hobbies, and any other relevant information

Recent Messages:
{{recentMessages}}

Response should be a JSON object array inside a JSON markdown block. Correct response format:
\`\`\`json
[
  {"claim": string, "type": enum<fact|opinion|status>, in_bio: boolean, already_known: boolean },
  {"claim": string, "type": enum<fact|opinion|status>, in_bio: boolean, already_known: boolean },
  ...
]
\`\`\``;

async function handler(runtime: IAgentRuntime, message: Memory) {
    const state = await runtime.composeState(message);

    const { agentId, roomId } = state;

    const context = composeContext({
        state,
        template: runtime.character.templates?.factsTemplate || factsTemplate,
    });

    const facts = await generateObjectArray({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    const factsManager = new MemoryManager({
        runtime,
        tableName: "facts",
    });

    if (!facts) {
        return [];
    }

    // If the fact is known or corrupted, remove it
    const filteredFacts = facts
        .filter((fact) => {
            return (
                !fact.already_known &&
                fact.type === "fact" &&
                !fact.in_bio &&
                fact.claim &&
                fact.claim.trim() !== ""
            );
        })
        .map((fact) => fact.claim);

    for (const fact of filteredFacts) {
        const factMemory = await factsManager.addEmbeddingToMemory({
            userId: agentId!,
            agentId,
            content: { text: fact },
            roomId,
            createdAt: Date.now(),
        });

        await factsManager.createMemory(factMemory, true);

        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return filteredFacts;
}

export const autoTrainingEvaluator: Evaluator = {
    name: "AUTO_TRAINING",
    similes: [
        "SELF_LEARNING",
        "MODEL_UPDATE",
        "AUTOMATIC_TRAINING",
        "MODEL_TRAINING",
        "TRAINING",
    ],
    validate: async (
        runtime: IAgentRuntime,
        message: Memory
    ): Promise<boolean> => {
        // Add validation logic if required
        const messageCount = (await runtime.messageManager.countMemories(
            message.roomId
        )) as number;

        const reflectionCount = Math.ceil(runtime.getConversationLength() / 2);

        return messageCount % reflectionCount === 0;
    },
    description:
        "Automatically train the model based on new data or interactions. This evaluator triggers the agent to enter a self-learning mode.",
    handler,
    examples: [
        {
            context: `Training data:
[
  {"input": "How can I improve my code?", "output": "You can improve your code by following best practices and writing clean, maintainable code."},
  {"input": "What are some good resources for learning Python?", "output": "Some good resources for learning Python include official documentation, online courses, and coding practice websites."}
]`,
            messages: [
                {
                    user: "{{user1}}",
                    content: { text: "How can I improve my code?", action: "AUTO_TRAINING" },
                },
                {
                    user: "{{user2}}",
                    content: { text: "You can improve your code by following best practices and writing clean, maintainable code.", action: "AUTO_TRAINING" },
                },
            ] as ActionExample[],
            outcome: `Training initiated with provided data.`,
        },
        {
            context: `Training data:
[
  {"input": "What is the best way to learn JavaScript?", "output": "The best way to learn JavaScript is through practice and studying online tutorials and resources."},
  {"input": "Can you recommend a good JavaScript framework?", "output": "A popular and widely recommended JavaScript framework is React."}
]`,
            messages: [
                {
                    user: "{{user1}}",
                    content: { text: "What is the best way to learn JavaScript?", action: "AUTO_TRAINING" },
                },
                {
                    user: "{{user2}}",
                    content: { text: "The best way to learn JavaScript is through practice and studying online tutorials and resources.", action: "AUTO_TRAINING" },
                },
            ] as ActionExample[],
            outcome: `Training initiated with provided data.`,
        },
        {
            context: `Training data:
[
  {"input": "What is the capital of France?", "output": "The capital of France is Paris."},
  {"input": "What is the largest planet in our solar system?", "output": "The largest planet in our solar system is Jupiter."}
]`,
            messages: [
                {
                    user: "{{user1}}",
                    content: { text: "What is the capital of France?", action: "AUTO_TRAINING" },
                },
                {
                    user: "{{user2}}",
                    content: { text: "The capital of France is Paris.", action: "AUTO_TRAINING" },
                },
            ] as ActionExample[],
            outcome: `Training initiated with provided data.`,
        },
    ],
} as Evaluator;
