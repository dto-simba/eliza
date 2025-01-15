import {elizaLogger, HandlerCallback, IAgentRuntime} from "@elizaos/core";
import {FindSwapTokensParams, FindSwapTokensResult, RetBiz, SampleToken} from "../types.ts";

//
// export const actionTokenBySymbol = async (address: string,
//                                         runtime: IAgentRuntime,
//                                         callback: HandlerCallback) => {
//
//     const baseUrl = runtime.getSetting("WEB3_BASE_URL");
//     const chainId = runtime.getSetting("WEB3_SUPPORT_CHAIN_ID");
//
//     const url = `${baseUrl}/api/agent/findTokenBySymbol/${chainId}/${address}`;
//     const response = await fetch(url, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//     });
//     const bizRet = await response.json() as RetBiz;
//     if (bizRet.status === 1) {
//         const sampleToken = bizRet.result as SampleToken;
//         if (callback) {
//             callback({
//                 text: `The token with address ${address} is ${sampleToken.name}(${sampleToken.symbol})`,
//                 webAction: {
//                     action: "sendToken",
//                     token: sampleToken,
//                 }
//             }, []);
//         }
//         return true;
//     } else {
//         elizaLogger.error(`The token with address ${address} is not found.\nError details: ${bizRet.error}`);
//         if (callback) {
//             callback({
//                 text: `The token with address ${address} is not found.`,
//                 content: {error: bizRet.error},
//             }, []);
//         }
//         return false;
//     }
//
// };
//
// export const findTokenByAddress = async (params: FindSwapTokensParams,
//                                          runtime: IAgentRuntime,
//                                          callback: HandlerCallback) => {
//     const baseUrl = runtime.getSetting("WEB3_BASE_URL");
//     const chainId = runtime.getSetting("WEB3_SUPPORT_CHAIN_ID");
//
//     params.chainId = chainId;
//     const url = `${baseUrl}/api/agent/findSwapTokens`;
//     const response = await fetch(url, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify(params),
//     });
//     const bizRet = await response.json() as RetBiz;
//     if (bizRet.status === 1) {
//         const findSwapTokensResult = bizRet.result as FindSwapTokensResult;
//         if (callback) {
//             callback({
//                 text: `The token pair with ${params.fromTokenSymbol} and ${params.toTokenSymbol} is ${findSwapTokensResult.routerTokens[0].name}(${findSwapTokensResult.routerTokens[0].symbol})`,
//                 webAction: {
//                     action: "swapToken",
//                     token: findSwapTokensResult,
//                 }
//             }, []);
//         }
//         return true;
//     } else {
//         elizaLogger.error(`The token pair with ${params.fromTokenSymbol} and ${params.toTokenSymbol} is not found.\nError details: ${bizRet.error}`);
//         if (callback) {
//             callback({
//                 text: `The token pair with ${params.fromTokenSymbol} and ${params.toTokenSymbol} is not found.`,
//                 content: {error: bizRet.error},
//             }, []);
//         }
//         return false;
//     }
//
// }
