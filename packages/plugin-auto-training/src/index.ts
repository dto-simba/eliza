import { Plugin } from "@elizaos/core";
import {autoTrainingAction} from "./actions/autoTrainingAction.ts";
// import {autoTrainingEvaluator} from "./evaluators/autoTrainingEvaluator.ts";
// import {autoTrainingProvider} from "./providers/autoTrainingProvider.ts";


export const autoTrainingPlugin: Plugin = {
    name: "autTraining",
    description: "Auto training plugin",
    actions: [
        autoTrainingAction,
    ],
    evaluators: [],
    providers: [],
    // evaluators: [autoTrainingEvaluator],
    // providers: [autoTrainingProvider],
};
