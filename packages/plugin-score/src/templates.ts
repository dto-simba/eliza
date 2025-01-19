export const scoreQueryTemplate = `
Extract the following details to create a score query:
- **queryAddress** (string): The address the user needs to query (e.g., 0x0000000000000000000000000000000000000000).

Provide the values in the following JSON format:

\`\`\`json
{
    "queryAddress": <queryAddress>,
}
\`\`\`

Here are the recent user messages for context:
{{recentMessages}}
`;



