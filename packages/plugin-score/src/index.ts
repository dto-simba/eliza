import {Plugin} from "@elizaos/core";
import {sendTokenAction} from "./actions/sendToken.ts";
import {swapTokenAction} from "./actions/swapToken.ts";
import {queryPointsAction} from "./actions/queryPoints.ts";
import {openLootBoxAction} from "./actions/OpenLootBox.ts";

export const scorePlugin: Plugin = {
    name: "FaithScore",
    description: "Faith score plugin, including actions to send token, swap token, query points and open loot box.",
    providers: [],
    evaluators: [],
    services: [],
    actions: [sendTokenAction, swapTokenAction, queryPointsAction, openLootBoxAction],
};

export default scorePlugin;
