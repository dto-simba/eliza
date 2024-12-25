import {IAgentRuntime, ModelClass, State} from "../types.ts";
import elizaLogger from "../logger.ts";
import {generateText} from "../generation.ts";
import {composeContext} from "../context.ts";

export const generateNewTweetContentExtra = async (knowledge: string, runtime: IAgentRuntime, state: State) => {

    const twitterPostTemplate = `
# Areas of Expertise
{{knowledge}}

# About {{agentName}} (@{{twitterUserName}}):
{{bio}}
{{lore}}
{{topics}}

{{providers}}

{{characterPostExamples}}

{{postDirections}}

# Task: Generate a post in the voice and style and perspective of {{agentName}} @{{twitterUserName}}.
Write a post that is {{adjective}} about {{topic}} (without mentioning {{topic}} directly), from the perspective of {{agentName}}. Do not add commentary or acknowledge this request, just write the post.
You can summarize the latest and most important information based on the following message :${knowledge}
Your response should be 1, 2, or 3 sentences (choose the length at random).
Your response should not contain any questions. Brief, concise statements only. The total character count MUST be less than {{maxTweetLength}}. No emojis. Use \\n\\n (double spaces) between statements if there are multiple statements in your response.`;


    const context = composeContext({
        state,
        template: twitterPostTemplate,
    });
    elizaLogger.info(`Twitter post context: ${context}`);

    const newTweetContent = await generateText({
        runtime: runtime,
        context: context,
        modelClass: ModelClass.LARGE,
    });

    elizaLogger.info(`New tweet content: ${newTweetContent}`);
    return newTweetContent;

}
export const feedKnowledgeToLargeModel = async (knowledge: string, runtime: IAgentRuntime) => {

    const context = `# Task: Extract knowledge from the API response and learn from it.
                            API Response: ${knowledge}
                            Your learn from the API response.
                            Your response not contain any api response keywords.`;

    const response = await generateText({
        context,
        runtime,
        modelClass: ModelClass.LARGE,
        stop: ["\n"]
    });
    elizaLogger.info(`feedKnowledgeToLargeModel Response: ${response}`);
    return response;
}

export const generateKeywordsBySearch = async (text: string, runtime: IAgentRuntime) => {
    const context = `Extract 1-3 keywords that you are currently interested in from the message:
${text}
Only respond with the keywords, do not include any other text.
`;
    const searchTerm = await generateText({
        context,
        runtime: runtime,
        modelClass: ModelClass.SMALL,
        stop: ["\n"]
    });
    elizaLogger.info(`generateKeywordsBySearch Search term: ${searchTerm}`);
    return searchTerm;

}
export const generateSerperSearch = async (query: string, runtime: IAgentRuntime) => {
    const apiUrl = "https://google.serper.dev/search";
    const apiKey = runtime.getSetting("SERPER_API_KEY");

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'X-API-KEY': apiKey,
            },
            body: JSON.stringify({
                "q": query,
                "tbs": "qdr:d",
            }),
        });

        if (!response.ok) {
            throw new elizaLogger.error(
                `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        // const organicSimpleArray = data.organic.map((organic: any) => {
        //     return {
        //         title: organic.title,
        //         snippet: organic.snippet
        //     };
        // });

        return JSON.stringify(data);
    } catch (error) {
        elizaLogger.error("Error:", error);
    }
}


