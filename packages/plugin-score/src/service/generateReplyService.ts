import {composeContext, elizaLogger, generateText, IAgentRuntime, ModelClass, State} from "@elizaos/core";

export enum ReplyType {
    NORMAL = "normal",
    PROCESSING = "processing",
    ERROR = "error",
}

const replyTemplate = `Based on this message: "{{replyMsg}}", generate a reply to the user.
Keep the response short and specific.
`;

const errorReplyTemplate = `Based on this message: "{{replyMsg}}", generate an error reply to the user.
You can make a joke or say something funny.
Not include any team information or personal information.
Do not collect any user information or data.`;

export async function generateReplyText(
    runtime: IAgentRuntime,
    state: State,
    replyMsg: string,
    replyType: string,
    template?: string,
): Promise<string> {

    if (!template) {
        if (replyType === ReplyType.ERROR) {
            template = errorReplyTemplate.replace("{{replyMsg}}", replyMsg);
        } else {
            template = replyTemplate.replace("{{replyMsg}}", replyMsg);
        }
    }

    const createReplyMsg = composeContext({
        state,
        template: template,
    });

    const replyText = await generateText({
        runtime,
        context: createReplyMsg,
        modelClass: ModelClass.SMALL,
    });

    elizaLogger.info(`Generated reply text: ${replyText}`);

    return replyText;
}
