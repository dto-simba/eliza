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
import {generateReplyText, ReplyType} from "../service/generateReplyService.ts";

interface QueryUserProofResponse {
    userAddress: string;
    leafKey: string;
    leafProof: string;
    lootBoxContractAddress?: string;
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
                await actionOpenLootBox(runtime, state, callback, userAddress);
            } else {
                elizaLogger.error("Invalid user address.");
                if (callback) {
                    const replyText = await generateReplyText(
                        runtime,
                        state,
                        `Open loot box failed. Error details: Invalid user address.`,
                        ReplyType.ERROR
                    );
                    callback({
                        user: state.agentName,
                        text: replyText,
                        content: {error: "Invalid your address."},
                    });
                }
                return false;
            }

        } catch (error) {
            elizaLogger.error("Open loot box failed:", error);
            if (callback) {
                const replyText = await generateReplyText(
                    runtime,
                    state,
                    `Open loot box failed. Unexpected error. Error details: ${error.message}`,
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
        const lootBoxAddress = !!runtime.getSetting("LOOT_BOX_CONTRACT_ADDRESS");
        return baseUrl && chainId && lootBoxAddress;
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


const actionOpenLootBox = async (runtime: IAgentRuntime, state: State, callback: HandlerCallback, userAddress: string) => {

    const baseUrl = runtime.getSetting("WEB3_BASE_URL");
    const lootBoxContractAddress = runtime.getSetting("LOOT_BOX_CONTRACT_ADDRESS");

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
        userProofResponse.lootBoxContractAddress = lootBoxContractAddress;
        if (callback) {
            const replyText = await generateReplyText(
                runtime,
                state,
                `Now you can open your loot box.`,
                ReplyType.NORMAL
            );
            callback({
                user: state.agentName,
                text: replyText,
                webAction: {
                    step: "openLootBoxStep",
                    details: userProofResponse
                }
            }, []);
        }
        return true;
    } else {
        elizaLogger.error(`The address(${userAddress}) loot box is not found.`);
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
