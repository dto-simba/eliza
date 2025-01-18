import {z} from "zod";
import {Content} from "@elizaos/core";

// Add to types.ts
export interface ScoreQueryContent {
    queryAddress: string;
}

export const ScoreQuerySchema = z.object({
    queryAddress: z.string().describe("The address the user needs to query (e.g., 0x0000000000000000000000000000000000000000)"),
});

export const isScoreQueryContent = (obj: any): obj is ScoreQueryContent => {
    return ScoreQuerySchema.safeParse(obj).success;
};




export interface RetBiz {
    status: number;
    error: string;
    result: any;
    code: number;
}

export interface SampleToken {
    chainId: number;
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    isNativeCoin?: boolean;
}

