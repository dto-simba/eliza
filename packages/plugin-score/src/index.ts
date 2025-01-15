import {Plugin} from "@elizaos/core";
import {sendTokenAction} from "./actions/sendToken.ts";
import {swapTokenAction} from "./actions/swapToken.ts";

export const scorePlugin: Plugin = {
    name: "FaithScore",
    description: "Faith score plugin, including actions to send and swap tokens.",
    providers: [],
    evaluators: [],
    services: [],
    actions: [sendTokenAction,swapTokenAction],
};

export default scorePlugin;
