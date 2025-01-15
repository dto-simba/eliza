import {composeContext, elizaLogger, generateObject, ModelClass} from "@elizaos/core";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@elizaos/core";
import {scoreQueryTemplate} from "../templates.ts";
import {isScoreQueryContent, ScoreQuerySchema} from "../types.ts";
import {initWalletProvider, SupportedChain} from "@elizaos/plugin-evm";
import {Address, Chain} from "viem";
import {scoreAirdropAbi} from "../abi/scoreAbis.ts";


const scoreQuery: Action = {
    name: "SCORE_QUERY",
    similes: [
        "QUERY_SCORE",
        "QUERY_POINTS",
        "QUERY_FAITH_SCORE",
    ],
    description:
        "Query the score of a user based on their address.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const scoreBaseUrl = !!runtime.getSetting("SCORE_BASE_URL");
        return scoreBaseUrl;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Composing state for message:", message);
        state = (await runtime.composeState(message)) as State;
        const userId = runtime.agentId;
        elizaLogger.log("User ID:", userId);


        try {
            const context = composeContext({
                state,
                template: scoreQueryTemplate,
            });

            // elizaLogger.info("Context:", context);

            const scoreQueryDetails = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: ScoreQuerySchema,
            });
            elizaLogger.info("Invocation details:", scoreQueryDetails.object);
            if (!isScoreQueryContent(scoreQueryDetails.object)) {
                callback(
                    {
                        text: "I'm sorry, I couldn't understand the query. Please try again.",
                    },
                    []
                );
                return;
            }

            const {queryAddress} = scoreQueryDetails.object;

            await doScoreQueryHandler(runtime, queryAddress, callback)


        } catch (e) {
            elizaLogger.error("Failed to query the score:", e);
            callback(
                {
                    text: "Failed to query the score. Please check the logs for more details.",
                },
                []
            );
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What is the faith score of 0x1234567890abcdef?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "The faith score for address 0x1234567890abcdef is:",
                    action: "SCORE_QUERY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Can you check the faith score for 0xabcdef1234567890?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here is the faith score for 0xabcdef1234567890:",
                    action: "SCORE_QUERY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Please find the faith score of the address 0x0987654321fedcba.",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "The faith score for the address 0x0987654321fedcba is:",
                    action: "SCORE_QUERY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I need the faith score for 0xabcdefabcdefabcd.",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "The faith score for 0xabcdefabcdefabcd is:",
                    action: "SCORE_QUERY",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Could you provide the faith score for 0x1234abcd5678efgh?",
                },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here is the faith score for 0x1234abcd5678efgh:",
                    action: "SCORE_QUERY",
                },
            },
        ],
    ],
} as Action;

const doScoreQueryHandler = async (
    runtime: IAgentRuntime,
    queryAddress: string,
    callback: HandlerCallback) => {
    const baseUrl = runtime.getSetting("SCORE_BASE_URL");

    const response = await fetch(`${baseUrl}/telegram/queryScore?queryAddress=${queryAddress}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const data = await response.json();
    elizaLogger.info("Query Score Response:", data);
    if (data.status === 1) {
        if (data.result.airdropAmount > 0) {
            await airdropHandler(runtime, queryAddress, data.result, callback)
        } else {
            callback(
                {
                    text: `Querying the score successfully:
- Query Address: ${queryAddress}
- score: ${data.result.userScore}
- airdrop amount: ${data.result.airdropAmount}`,
                },
                []
            );
        }

    } else {
        elizaLogger.error("Failed to query the score:", data);
        callback(
            {
                text: "Failed to query the score. Please check the logs for more details.",
            },
            []
        );
    }

}

const airdropHandler = async (
    runtime: IAgentRuntime, userAddress: string, data: any, callback: HandlerCallback) => {
    const airdrpContractAddress = runtime.getSetting("SCORE_AIRDROP_CONTRACT_ADDRESS");
    if (airdrpContractAddress) {

        const walletProvider = await initWalletProvider(runtime);

        const walletAddress = walletProvider.getAddress();
        const walletAddressBalance = await walletProvider.getWalletBalance();
        elizaLogger.info(`Wallet Address: ${walletAddress}, Balance: ${walletAddressBalance}`);

        const currentChain: Chain = walletProvider.getCurrentChain();


        const chainName = runtime.getSetting("SCORE_VIEM_CHAIN_NAME");
        const walletClient = walletProvider.getWalletClient(chainName as SupportedChain);

        try {

            const hash = await walletClient.writeContract({
                account: walletProvider.account,
                chain: currentChain,
                address: airdrpContractAddress as Address,
                abi: scoreAirdropAbi,
                functionName: "airdrop",
                args: [userAddress as Address, BigInt(data.airdropAmountRaw)],
            });
            elizaLogger.info("Airdrop completed successfully! Transaction hash:", hash);

            const callbackText = `Querying the score successfully:
    - Query Address: ${userAddress}
    - score: ${data.userScore}
    - airdrop amount: ${data.airdropAmount}
    - Airdrop completed successfully! Transaction hash: ${hash}`;
            callback(
                {
                    text: callbackText,
                },
                []
            );
        } catch
            (e) {
            elizaLogger.error("Failed to airdrop the score:", e);
            callback(
                {
                    text: "Failed to airdrop the score. Please check the logs for more details.",
                },
                []
            );
        }
    } else {
        elizaLogger.error("Airdrop contract address is not set");
    }

}

// export const scoreQueryPlugin: Plugin = {
//     name: "scoreQuery",
//     description: "Score query",
//     actions: [scoreQuery],
//     evaluators: [],
//     providers: [],
// };

// export default scoreQueryPlugin;
