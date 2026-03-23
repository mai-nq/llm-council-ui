// LLM Council 3-Stage Deliberation Logic

import { callModel, callModelsParallel } from "./openrouter";
import type {
  ChatMessage,
  Stage1Response,
  ModelRanking,
  Stage2Result,
  AggregateRanking,
  CouncilResponse,
  Settings,
} from "./types";

const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Security: Escape user input to prevent prompt injection
// Uses XML-style delimiters that are harder to break out of
function escapeForPrompt(text: string): string {
  // Replace characters that could be used for prompt injection
  return text
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[/g, "&#91;")
    .replace(/\]/g, "&#93;");
}

// Stage 1: Collect responses from all models in parallel
export async function stage1CollectResponses(
  query: string,
  models: string[],
  conversationHistory?: ChatMessage[]
): Promise<Stage1Response[]> {
  console.log("[council] Stage 1: Collecting responses from models:", models);

  // Build messages: history (user + chairman responses only) + current query
  const messages: ChatMessage[] = [
    ...(conversationHistory || []),
    {
      role: "user",
      content: query,
    },
  ];

  const results = await callModelsParallel(models, messages);

  const responses = results.map((result, index) => {
    if (result.error) {
      console.error(`[council] Model ${result.model} failed:`, result.error);
    } else {
      console.log(`[council] Model ${result.model} succeeded, content length:`, result.content.length);
    }
    return {
      model: result.model,
      content: result.error ? `Error: ${result.error}` : result.content,
      label: LABELS[index],
    };
  });

  console.log("[council] Stage 1 complete, responses:", responses.length);
  return responses;
}

// Create anonymized prompt for peer ranking
function createRankingPrompt(responses: Stage1Response[], query: string): string {
  // Security: Escape user input to prevent prompt injection
  const escapedQuery = escapeForPrompt(query);

  let prompt = `You are evaluating multiple AI responses to the following question:

<USER_QUESTION>${escapedQuery}</USER_QUESTION>

Here are the responses to evaluate:

`;

  for (const response of responses) {
    const escapedContent = escapeForPrompt(response.content);
    prompt += `<RESPONSE label="${response.label}">${escapedContent}</RESPONSE>

`;
  }

  prompt += `Please evaluate each response based on:
1. Accuracy and correctness
2. Completeness and depth
3. Clarity and organization
4. Helpfulness and practical value

After your analysis, provide a FINAL RANKING from best to worst.
Format your ranking EXACTLY as: "FINAL RANKING: X, Y, Z, W" (replacing letters with your ranking)

For example: "FINAL RANKING: B, A, D, C" means Response B is best, A is second, etc.`;

  return prompt;
}

// Parse ranking from model's evaluation text
export function parseRankingFromText(text: string): string[] {
  // Look for "FINAL RANKING:" pattern
  const patterns = [
    /FINAL RANKING:\s*([A-H](?:\s*[,>]\s*[A-H])+)/i,
    /ranking:\s*([A-H](?:\s*[,>]\s*[A-H])+)/i,
    /([A-H])\s*[,>]\s*([A-H])\s*[,>]\s*([A-H])\s*[,>]\s*([A-H])/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Extract letters and clean up
      const rankingStr = match[1] || match[0];
      const letters = rankingStr.match(/[A-H]/gi);
      if (letters && letters.length >= 2) {
        return letters.map((l) => l.toUpperCase());
      }
    }
  }

  return [];
}

// Stage 2: Collect rankings from all models
export async function stage2CollectRankings(
  responses: Stage1Response[],
  models: string[],
  originalQuery: string
): Promise<Stage2Result> {
  console.log("[council] Stage 2: Collecting rankings from models:", models);

  const rankingPrompt = createRankingPrompt(responses, originalQuery);

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: rankingPrompt,
    },
  ];

  const results = await callModelsParallel(models, messages);
  console.log("[council] Stage 2: Got results from", results.length, "models");

  const rankings: ModelRanking[] = results.map((result) => {
    const parsed = result.error ? [] : parseRankingFromText(result.content);
    console.log(`[council] Stage 2: ${result.model} rankings:`, parsed);
    return {
      model: result.model,
      rankings: parsed,
      rawText: result.error ? `Error: ${result.error}` : result.content,
    };
  });

  // Create label to model mapping
  const labelToModel: Record<string, string> = {};
  for (const response of responses) {
    labelToModel[response.label] = response.model;
  }

  // Calculate aggregate rankings
  const aggregateRankings = calculateAggregateRankings(rankings, responses);

  return {
    modelRankings: rankings,
    aggregateRankings,
    labelToModel,
  };
}

// Calculate aggregate rankings ("Street Cred")
export function calculateAggregateRankings(
  rankings: ModelRanking[],
  responses: Stage1Response[]
): AggregateRanking[] {
  const scores: Record<string, { total: number; count: number; label: string }> = {};

  // Initialize scores for all responses
  for (const response of responses) {
    scores[response.model] = { total: 0, count: 0, label: response.label };
  }

  // Accumulate rankings
  for (const ranking of rankings) {
    if (ranking.rankings.length === 0) continue;

    ranking.rankings.forEach((label, position) => {
      // Find the model for this label
      const response = responses.find((r) => r.label === label);
      if (response && scores[response.model]) {
        scores[response.model].total += position + 1; // 1-indexed ranking
        scores[response.model].count += 1;
      }
    });
  }

  // Calculate averages and sort
  const aggregates: AggregateRanking[] = Object.entries(scores)
    .filter(([, data]) => data.count > 0)
    .map(([model, data]) => ({
      model,
      label: data.label,
      avgRank: data.total / data.count,
      votes: data.count,
    }))
    .sort((a, b) => a.avgRank - b.avgRank);

  return aggregates;
}

// Create synthesis prompt for chairman
function createSynthesisPrompt(
  responses: Stage1Response[],
  stage2Result: Stage2Result,
  originalQuery: string
): string {
  // Security: Escape user input to prevent prompt injection
  const escapedQuery = escapeForPrompt(originalQuery);

  let prompt = `You are the Chairman of an LLM Council, tasked with synthesizing the best possible answer.

<ORIGINAL_QUESTION>${escapedQuery}</ORIGINAL_QUESTION>

The council has provided the following responses and rankings:

## Individual Responses:
`;

  for (const response of responses) {
    const modelName = response.model.split("/").pop() || response.model;
    const escapedContent = escapeForPrompt(response.content);
    prompt += `<RESPONSE model="${modelName}" label="${response.label}">${escapedContent}</RESPONSE>

`;
  }

  prompt += `## Peer Rankings (Street Cred Leaderboard):
`;

  for (const ranking of stage2Result.aggregateRankings) {
    const modelName = ranking.model.split("/").pop() || ranking.model;
    prompt += `${ranking.avgRank.toFixed(2)} avg rank - ${modelName}\n`;
  }

  prompt += `
## Your Task:
As Chairman, synthesize the best elements from all responses into a comprehensive, accurate, and well-organized final answer. Consider the peer rankings as a guide to reliability, but use your judgment to include valuable insights from any response.

Provide your synthesized answer directly without meta-commentary about the process.`;

  return prompt;
}

// Stage 3: Synthesize final response
export async function stage3Synthesize(
  responses: Stage1Response[],
  stage2Result: Stage2Result,
  originalQuery: string,
  chairmanModel: string
): Promise<string> {
  console.log("[council] Stage 3: Synthesizing with chairman model:", chairmanModel);

  const synthesisPrompt = createSynthesisPrompt(responses, stage2Result, originalQuery);

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: synthesisPrompt,
    },
  ];

  const result = await callModel(chairmanModel, messages);
  console.log("[council] Stage 3: Synthesis complete, length:", result.length);
  return result;
}

// Generate a concise conversation title using the chairman model
export async function generateConversationTitle(
  userQuestion: string,
  synthesisResponse: string,
  settings: Settings
): Promise<string> {
  const summarySnippet = synthesisResponse.slice(0, 200);

  // Security: Escape user input to prevent prompt injection
  const escapedQuestion = escapeForPrompt(userQuestion);
  const escapedSnippet = escapeForPrompt(summarySnippet);

  const prompt = `Generate a concise title (5-10 words) for this conversation.
Do not use quotes. Just return the title text.

<QUESTION>${escapedQuestion}</QUESTION>
<SUMMARY>${escapedSnippet}</SUMMARY>`;

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: prompt,
    },
  ];

  try {
    const title = await callModel(settings.chairmanModel, messages);
    // Clean up the title: remove quotes, trim, and ensure reasonable length
    const cleanTitle = title
      .replace(/^["']|["']$/g, "")
      .replace(/^Title:\s*/i, "")
      .trim();

    // Ensure title is reasonable length (5-50 chars)
    if (cleanTitle.length >= 5 && cleanTitle.length <= 100) {
      return cleanTitle;
    }
    // If too short or too long, truncate or return fallback
    if (cleanTitle.length > 100) {
      return cleanTitle.slice(0, 97) + "...";
    }
    // Fallback: use truncated user question
    return userQuestion.slice(0, 47) + "...";
  } catch (error) {
    console.error("Failed to generate conversation title:", error);
    // Fallback: use truncated user question
    const fallback = userQuestion.slice(0, 50);
    return fallback.length < userQuestion.length ? fallback.slice(0, 47) + "..." : fallback;
  }
}

// Run full council deliberation
// conversationHistory: previous turns as user/assistant pairs (chairman responses only, no intermediate steps)
export async function runFullCouncil(
  query: string,
  models: string[],
  chairmanModel: string,
  onStage1Complete?: (responses: Stage1Response[]) => void,
  onStage2Complete?: (result: Stage2Result) => void,
  conversationHistory?: ChatMessage[]
): Promise<CouncilResponse> {
  console.log("[council] runFullCouncil started");

  // Stage 1: Collect responses (with conversation history for context)
  console.log("[council] Starting Stage 1...");
  const stage1Responses = await stage1CollectResponses(query, models, conversationHistory);
  console.log("[council] Stage 1 done, calling callback...");
  onStage1Complete?.(stage1Responses);
  console.log("[council] Stage 1 callback done");

  // Stage 2: Peer ranking (no history needed - evaluates current responses only)
  console.log("[council] Starting Stage 2...");
  const stage2Result = await stage2CollectRankings(stage1Responses, models, query);
  console.log("[council] Stage 2 done, calling callback...");
  onStage2Complete?.(stage2Result);
  console.log("[council] Stage 2 callback done");

  // Stage 3: Synthesis
  console.log("[council] Starting Stage 3...");
  const stage3Response = await stage3Synthesize(
    stage1Responses,
    stage2Result,
    query,
    chairmanModel
  );
  console.log("[council] Stage 3 done");

  return {
    stage1: stage1Responses,
    stage2: stage2Result,
    stage3: stage3Response,
  };
}
