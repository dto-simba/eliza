import type { Plugin } from "@elizaos/core";
import {walletProvider} from "@elizaos/plugin-solana";

export const predictPlugin: Plugin = {
    name: "predict",
    description: "Predict the next action based on the message.",
    providers: [],
    evaluators: [],
    services: [],
    actions: [],
};

export default predictPlugin;
