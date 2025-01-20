import {
    Action,
    composeContext,
    Content, elizaLogger,
    generateObject,
    HandlerCallback,
    IAgentRuntime,
    Memory, ModelClass,
    State
} from "@elizaos/core";
import {RetBiz, SampleToken} from "../types.ts";
import {z} from "zod";
import {generateReplyText, ReplyType} from "../service/generateReplyService.ts";

export interface FindSwapTokensParams {
    chainId?: number | string;
    swapDexType?: string;
    fromTokenSymbol: string;
    toTokenSymbol: string;
    amount: number | string;
}

export interface FindSwapTokensResult {
    routerAddress: string;
    routerTokens: SampleToken[];
}

interface SwapTokenContent extends Content {
    amount: string | number;
    fromTokenSymbol: string;
    toTokenSymbol: string;
    pairInfo?: FindSwapTokensResult;
}

const SwapTokenSchema = z.object({
    amount: z.string(),
    fromTokenSymbol: z.string(),
    toTokenSymbol: z.string(),
});

const swapTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "10",
    "fromTokenSymbol": "$VIRTUAL",
    "toTokenSymbol": "$lzSEILOR",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token swap:
- Amount to swap
- From token symbol
- To token symbol


Respond with a JSON markdown block containing only the extracted values.`;

export function isSwapTokenContent(content: SwapTokenContent): content is SwapTokenContent {
    // Validate types
    const validTypes =
        typeof content.fromTokenSymbol === "string" &&
        typeof content.toTokenSymbol === "string" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number");
    if (!validTypes) {
        return false;
    }

    // Validate addresses
    const validAddresses =
        content.fromTokenSymbol.length > 1 &&
        content.toTokenSymbol.length > 1 &&
        content.amount.toString().length > 0
    ;

    return validAddresses;
}


export const swapTokenAction: Action = {
    name: "SWAP_TOKEN",
    description: "Swap tokens on the same chain",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        //Compose send token content
        const swapTokenContentStr = composeContext({
            state,
            template: swapTokenTemplate,
        });

        //Generate send token content
        const content = (await generateObject({
                runtime,
                context: swapTokenContentStr,
                modelClass: ModelClass.LARGE,
                schema: SwapTokenSchema,
            })
        ).object as SwapTokenContent;

        //Validate send token content
        if (!isSwapTokenContent(content)) {
            elizaLogger.error("Invalid content for SWAP_TOKEN action.");
            if (callback) {
                const replyText = await generateReplyText(
                    runtime,
                    state,
                    `Unable to process send token request. Invalid content provided.`,
                    ReplyType.ERROR
                );
                callback({
                    user: state.agentName,
                    text: replyText,
                    content: {error: "Invalid swap token content"},
                });
            }
            return false;
        }

        try {
            await actionFindPairInfo(runtime, state, callback, content);

        } catch (error) {
            elizaLogger.error("Failed to swap token:", error);
            if (callback) {
                const replyText = await generateReplyText(
                    runtime,
                    state,
                    `Swap token failed. Please try again later. If the problem persists, please contact the support team now. Unexpected error. Error details: ${error.message}`,
                    ReplyType.ERROR
                );
                callback({
                    user: state.agentName,
                    text: replyText,
                    content: {error: error.message},
                });
            }
            return false;
        }

    },
    validate: async (runtime: IAgentRuntime) => {
        const baseUrl = !!runtime.getSetting("WEB3_BASE_URL");
        const chainId = !!runtime.getSetting("WEB3_SUPPORT_CHAIN_ID");
        return baseUrl && chainId;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 10 $VIRTUAL to $lzSEILOR",
                    action: "SWAP_TOKEN",
                },
            }
        ],
    ],
    similes: ["TOKEN_SWAP", "EXCHANGE_TOKENS", "TRADE_TOKENS"],
};


const actionFindPairInfo = async (
    runtime: IAgentRuntime,
    state: State,
    callback: HandlerCallback,
    swapTokenContent: SwapTokenContent) => {

    const baseUrl = runtime.getSetting("WEB3_BASE_URL");
    const chainId = runtime.getSetting("WEB3_SUPPORT_CHAIN_ID");
    const url = `${baseUrl}/api/agent/findSwapTokens`;
    const params: FindSwapTokensParams = {
        chainId,
        swapDexType: "uniswap_v2",
        fromTokenSymbol: swapTokenContent.fromTokenSymbol,
        toTokenSymbol: swapTokenContent.toTokenSymbol,
        amount: swapTokenContent.amount,
    }
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });
    const bizRet = await response.json() as RetBiz;
    if (bizRet.status === 1) {
        const swapTokensResult = bizRet.result as FindSwapTokensResult;
        swapTokenContent.pairInfo = swapTokensResult;
        if (callback) {
            const replyText = await generateReplyText(
                runtime,
                state,
                `The swap router is found,you can swap now.`,
                ReplyType.NORMAL
            );
            callback({
                user: state.agentName,
                text: replyText,
                webAction: {
                    step: "swapTokenStep",
                    details: swapTokenContent,
                }
            }, []);
        }
        return true;
    } else {
        elizaLogger.error(`The token pair(${swapTokenContent.fromTokenSymbol} to ${swapTokenContent.toTokenSymbol}) is not found.`);
        if (callback) {
            const replyText = await generateReplyText(
                runtime,
                state,
                `Connect web error. Error details: ${bizRet.error}`,
                ReplyType.ERROR
            );
            callback({
                user: state.agentName,
                text: replyText,
                content: {error: bizRet.error},
            }, []);
        }
        return false;
    }

};
