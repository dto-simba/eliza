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

interface QueryUserProofResponse {
    userAddress: string;
    leafKey: string;
    leafProof: string;
}
export const openLootBoxAction: Action = {
    name: "OPEN_LOOT_BOX",
    description: "Open a loot box",
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
                await actionOpenLootBox(userAddress, runtime, callback);
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
                    text: "Open loot box.",
                    action: "OPEN_LOOT_BOX",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Open my loot box now.",
                    action: "OPEN_LOOT_BOX",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I'd like to open a loot box.",
                    action: "OPEN_LOOT_BOX",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Activate the loot box.",
                    action: "OPEN_LOOT_BOX",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can I open a loot box?",
                    action: "OPEN_LOOT_BOX",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Am I allowed to open my loot box at this time?",
                    action: "OPEN_LOOT_BOX",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Is it possible to open a loot box right now?",
                    action: "OPEN_LOOT_BOX",
                },
            },
        ],

    ],
    similes: ["ACTIVATE_BOX_LOOT", "OPEN_BOX_REWARD", "LAUNCH_BOX_PRIZE", "TRIGGER_BOX_OPEN"],
};


const actionOpenLootBox = async (userAddress: string, runtime: IAgentRuntime, callback: HandlerCallback) => {

    const baseUrl = runtime.getSetting("WEB3_BASE_URL");
    const chainId = runtime.getSetting("WEB3_SUPPORT_CHAIN_ID");

    const url = `${baseUrl}/api/agent/findUserProof/${userAddress}`;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const bizRet = await response.json() as RetBiz;
    if (bizRet.status === 1) {
        const userProofResponse = bizRet.result as QueryUserProofResponse;
        if (callback) {
            callback({
                text: `Here is your loot box.`,
                webAction: {
                    step: "openLootBoxStep",
                    details:userProofResponse
                }
            }, []);
        }
        return true;
    } else {
        elizaLogger.error(`The address(${userAddress}) loot box is not found.`);
        if (callback) {
            callback({
                text: `The  address(${userAddress}) loot box is not found.`,
                content: {error: bizRet.error},
            }, []);
        }
        return false;
    }

};
