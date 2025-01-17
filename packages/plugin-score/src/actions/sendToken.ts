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


interface SendTokenContent extends Content {
    amount: string | number;
    tokenSymbol: string;
    recipient: string;
    token?: any;
}

const SendTokenSchema = z.object({
    amount: z.string(),
    tokenSymbol: z.string(),
    recipient: z.string(),
});

const sendTokenTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "1000",
    "tokenSymbol": "$lzSELLLOR",
    "recipient": "0xCCa8009f5e09F8C5dB63cb0031052F9CB635Af62",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token send:
- Amount to send
- Token symbol
- Recipient wallet address


Respond with a JSON markdown block containing only the extracted values.`;

export function isSendTokenContent(content: SendTokenContent): content is SendTokenContent {
    // Validate types
    const validTypes =
        typeof content.tokenSymbol === "string" &&
        typeof content.recipient === "string" &&
        (typeof content.amount === "string" ||
            typeof content.amount === "number");
    if (!validTypes) {
        return false;
    }

    // Validate addresses
    const validAddresses =
        content.tokenSymbol.length > 1 &&
        content.recipient.startsWith("0x") &&
        content.recipient.length === 42;

    return validAddresses;
}


export const sendTokenAction: Action = {
    name: "SEND_TOKEN",
    description: "Send token to another address",
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
        const sendTokenContentStr = composeContext({
            state,
            template: sendTokenTemplate,
        });

        //Generate send token content
        const content = (await generateObject({
                runtime,
                context: sendTokenContentStr,
                modelClass: ModelClass.SMALL,
                schema: SendTokenSchema,
            })
        ).object as SendTokenContent;


        //Validate send token content
        if (!isSendTokenContent(content)) {
            elizaLogger.error("Invalid content for SEND_TOKEN action.");
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
                    content: {error: "Invalid send token content"},
                });
            }
            return false;
        }

        try {
            await actionTokenBySymbol(runtime, state, callback, content);

        } catch (error) {
            elizaLogger.error("Failed to send token:", error);
            const replyText = await generateReplyText(
                runtime,
                state,
                `Send token failed. Unexpected error. Error details: ${error.message}`,
                ReplyType.ERROR
            );
            if (callback) {
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
                    text: "Transfer 1 $lzSEILOR  to 0x322554076C183838bEF26F1Ba013b150eaf5Ae54",
                    action: "SEND_TOKEN",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 1 $lzSEILOR to 0x322554076C183838bEF26F1Ba013b150eaf5Ae54",
                    action: "SEND_TOKEN",
                },
            },
        ]
    ],
    similes: ["SEND_TOKENS", "TOKEN_TRANSFER", "MOVE_TOKEN"],
};


const actionTokenBySymbol = async (runtime: IAgentRuntime,
                                   state: State,
                                   callback: HandlerCallback,
                                   sendTokenContent: SendTokenContent,) => {

    const baseUrl = runtime.getSetting("WEB3_BASE_URL");
    const chainId = runtime.getSetting("WEB3_SUPPORT_CHAIN_ID");
    let symbol = sendTokenContent.tokenSymbol;
    if (symbol.startsWith("$")) {
        symbol = symbol.slice(1);
    }
    const url = `${baseUrl}/api/agent/findTokenBySymbol/${chainId}/${symbol}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const bizRet = await response.json() as RetBiz;
    if (bizRet.status === 1) {
        const sampleToken = bizRet.result as SampleToken;
        if (callback) {
            sendTokenContent.token = sampleToken;
            const replyText = await generateReplyText(
                runtime,
                state,
                `Find the token(${sampleToken.symbol}) successfully,you can send token now.`,
                ReplyType.NORMAL
            );
            callback({
                user: state.agentName,
                text: replyText,
                webAction: {
                    step: "sendTokenStep",
                    details: sendTokenContent
                }
            }, []);
        }
        return true;
    } else {
        elizaLogger.error(`The token(${symbol}) is not found.`);
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
