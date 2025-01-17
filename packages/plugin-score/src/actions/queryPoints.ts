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

interface QueryUserPointsResponse {
    chainId: number;
    userAddress: string;
    userPoints: number;
    basePoints: number;
    gamePoints: number;
}
export const queryPointsAction: Action = {
    name: "QUERY_POINTS",
    description: "Query points for a user",
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
        const userAddress = state.userAddress as string;

        try {
            if (userAddress && userAddress.length > 0) {
                await actionQueryPoint(userAddress, runtime, callback);
            }else{
                elizaLogger.error("Invalid user address.");
                if (callback) {
                    callback({
                        text: "Invalid your address.",
                        content: {error: "Invalid your address."},
                    });
                }
                return false;
            }

        } catch (error) {
            elizaLogger.error("Failed to query my faith points:", error);
            if (callback) {
                callback({
                    text: "Failed to query your faith points.",
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
                    text: "Query my faith points.",
                    action: "QUERY_POINTS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Query my faith points for account 0x322554076C183838bEF26F1Ba013b150eaf5Ae54",
                    action: "QUERY_POINTS",
                },
            },
        ],
        [

            {
                user: "{{user1}}",
                content: {
                    text: "Can you check how many faith points I have accumulated on my account?",
                    action: "QUERY_POINTS",
                },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How many faith points do I have?",
                    action: "QUERY_POINTS",
                },
            },
        ]
    ],
    similes: ["QUERY_POINTS", "CHECK_POINTS", "POINTS_QUERY", "POINTS_FAITH_QUERY"],
};


const actionQueryPoint = async (userAddress: string, runtime: IAgentRuntime, callback: HandlerCallback) => {

    const baseUrl = runtime.getSetting("WEB3_BASE_URL");
    const chainId = runtime.getSetting("WEB3_SUPPORT_CHAIN_ID");

    const url = `${baseUrl}/api/agent/findUserPoints/${chainId}/${userAddress}`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const bizRet = await response.json() as RetBiz;
    if (bizRet.status === 1) {
        const pointsResponse = bizRet.result as QueryUserPointsResponse;
        if (callback) {
            callback({
                text: `The address(${userAddress}) faith points is found. The total points is ${pointsResponse.userPoints}.`,
                webAction: {
                    step: "queryFaithPointsStep",
                    details:pointsResponse
                }
            }, []);
        }
        return true;
    } else {
        elizaLogger.error(`The address(${userAddress}) faith points is not found.`);
        if (callback) {
            callback({
                text: `The  address(${userAddress}) faith points is not found.`,
                content: {error: bizRet.error},
            }, []);
        }
        return false;
    }

};
