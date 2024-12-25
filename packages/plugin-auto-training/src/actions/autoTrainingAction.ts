import {
    ActionExample,
    IAgentRuntime,
    Memory,
    type Action,
    elizaLogger,
    SearchResponse,
    generateText,
    ModelClass,
    HandlerCallback,
    State,
    Content,
    generateSerperSearch,
    composeContext,
    generateKeywordsBySearch,
    stringToUuid,
    feedKnowledgeToLargeModel,
    generateNewTweetContentExtra
} from "@elizaos/core";

export const autoTrainingAction: Action = {
    name: "AUTO_TRAINING",
    similes: [
        "SELF_LEARNING",
        "MODEL_UPDATE",
        "AUTOMATIC_TRAINING",
        "MODEL_TRAINING",
        "TRAINING",
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        const serperApiKey = !!_runtime.getSetting("SERPER_API_KEY");
        return serperApiKey;
    },
    description:
        "Automatically train the model based on new data or interactions. This action triggers the agent to enter a self-learning mode.",
    handler: async (
        _runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: any,
        _callback: HandlerCallback
    ): Promise<void> => {


        const topics = _runtime.character.topics.join(", ");

        const randomTopic = await generateKeywordsBySearch(topics, _runtime);

        elizaLogger.info(`Random topic: ${randomTopic}`);


        const knowledge = await generateSerperSearch(randomTopic + " last news", _runtime);

        elizaLogger.info(`Knowledge: ${knowledge}`);

        const fullData = await feedKnowledgeToLargeModel(knowledge, _runtime);

        const roomId = stringToUuid(
            "twitter_generate_room-sage"
        );

        const state = await _runtime.composeState(
            {
                userId: _runtime.agentId,
                roomId: roomId,
                agentId: _runtime.agentId,
                content: {
                    text: randomTopic || "",
                    action: "TWEET",
                },
            },
            {
                twitterUserName: "sage",
            }
        );
       const newTweetContent = await generateNewTweetContentExtra(fullData, _runtime, state);

        await _callback({text: `randomTopic: ${randomTopic}
        ------------------------------------------------------------------
         knowledge: ${knowledge}
        ------------------------------------------------------------------
         fullData: ${fullData}
        ------------------------------------------------------------------
         newTweetContent: ${newTweetContent}`});

        if (1 === 1) {
            return true;
        }

        // Add handler logic for auto-training
        // const context = `Extract the search term from the user's message:
        // ${_message.content.text}
        // Only respond with the search term, do not include  any other text).
        // `;

        const context = `Extract 1-3 keywords that you are currently interested in from the user's message:
${_message.content.text}
Only respond with the keywords, do not include any other text.
`;

        const searchTerm = await generateText({
            context,
            runtime: _runtime,
            modelClass: ModelClass.SMALL,
            stop: ["\n"]
        });
        elizaLogger.info(`Search term: ${searchTerm}`);

        // Simulate training process
        const searchResults = await generateSerperSearch(searchTerm, _runtime);
        elizaLogger.info(`Search results: ${searchResults}`);


        const searchResultContent = `

        Summarize information from the query results: ${searchResults}, including your understanding of the topic and any important details.
        # response should be 1, 2, or 3 sentences etc.
        `;

        const searchResultsSummary = await generateText({
            context: searchResultContent,
            runtime: _runtime,
            modelClass: ModelClass.SMALL,
            stop: ["\n"]
        });

        elizaLogger.info(`Search results summary: ${searchResultsSummary}`);

        const newMemory: Memory = {
            userId: _runtime.agentId,
            agentId: _runtime.agentId,
            roomId: _runtime.agentId,
            content: {
                text: searchResultsSummary,
                source: _message.content?.source,
                action: "AUTO_TRAINING_RESPONSE",
            } as Content,
        }

        await _runtime.messageManager.createMemory(newMemory);

        await _runtime.evaluate(newMemory, _state);

        await _callback({text: searchResultsSummary});

        console.log("Auto-training completed.");
        // return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {text: "Time to update your knowledge base", action: "AUTO_TRAINING"},
            },
            {
                user: "{{user2}}",
                content: {text: "Initiating auto-training...", action: "AUTO_TRAINING"},
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {text: "Learn from our latest conversation", action: "AUTO_TRAINING"},
            },
            {
                user: "{{user2}}",
                content: {text: "Updating model with new data...", action: "AUTO_TRAINING"},
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {text: "Start self-learning process", action: "AUTO_TRAINING"},
            },
            {
                user: "{{user2}}",
                content: {text: "Self-learning initiated.", action: "AUTO_TRAINING"},
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {text: "Improve your responses", action: "AUTO_TRAINING"},
            },
            {
                user: "{{user2}}",
                content: {text: "Engaging auto-training mode...", action: "AUTO_TRAINING"},
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {text: "Enhance your algorithms", action: "AUTO_TRAINING"},
            },
            {
                user: "{{user2}}",
                content: {text: "Auto-training algorithms...", action: "AUTO_TRAINING"},
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {text: "Upgrade your knowledge", action: "AUTO_TRAINING"},
            },
            {
                user: "{{user2}}",
                content: {text: "Knowledge upgrade in progress...", action: "AUTO_TRAINING"},
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {text: "Train with new data", action: "AUTO_TRAINING"},
            },
            {
                user: "{{user2}}",
                content: {text: "Processing new data for training...", action: "AUTO_TRAINING"},
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {text: "Start your auto-training routine", action: "AUTO_TRAINING"},
            },
            {
                user: "{{user2}}",
                content: {text: "Auto-training routine started.", action: "AUTO_TRAINING"},
            },
        ],
    ] as ActionExample[][],
} as Action;

