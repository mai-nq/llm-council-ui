// LLM Council 3-Stage Deliberation Logic

import { callModel, callModelsParallel } from "./openrouter";
import type {
  ChatMessage,
  Stage1Response,
  ModelRanking,
  Stage2Result,
  AggregateRanking,
  CouncilResponse,
} from "./types";

const LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Stage 1: Collect responses from all models in parallel
export async function stage1CollectResponses(
  query: string,
  models: string[]
): Promise<Stage1Response[]> {
  const messages: ChatMessage[] = [
    {
      role: "user",
      content: query,
    },
  ];

  const results = await callModelsParallel(models, messages);

  return results.map((result, index) => ({
    model: result.model,
    content: result.error ? `Error: ${result.error}` : result.content,
    label: LABELS[index],
  }));
}

// Create anonymized prompt for peer ranking
function createRankingPrompt(responses: Stage1Response[], query: string): string {
  let prompt = `You are evaluating multiple AI responses to the following question:

"${query}"

Here are the responses to evaluate:

`;

  for (const response of responses) {
    prompt += `--- Response ${response.label} ---
${response.content}

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
  const rankingPrompt = createRankingPrompt(responses, originalQuery);

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: rankingPrompt,
    },
  ];

  const results = await callModelsParallel(models, messages);

  const rankings: ModelRanking[] = results.map((result) => ({
    model: result.model,
    rankings: result.error ? [] : parseRankingFromText(result.content),
    rawText: result.error ? `Error: ${result.error}` : result.content,
  }));

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
  let prompt = `You are the Chairman of an LLM Council, tasked with synthesizing the best possible answer.

Original Question: "${originalQuery}"

The council has provided the following responses and rankings:

## Individual Responses:
`;

  for (const response of responses) {
    const modelName = response.model.split("/").pop() || response.model;
    prompt += `### ${modelName} (Response ${response.label})
${response.content}

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
  const synthesisPrompt = createSynthesisPrompt(responses, stage2Result, originalQuery);

  const messages: ChatMessage[] = [
    {
      role: "user",
      content: synthesisPrompt,
    },
  ];

  return callModel(chairmanModel, messages);
}

// Run full council deliberation
export async function runFullCouncil(
  query: string,
  models: string[],
  chairmanModel: string,
  onStage1Complete?: (responses: Stage1Response[]) => void,
  onStage2Complete?: (result: Stage2Result) => void
): Promise<CouncilResponse> {
  // Stage 1: Collect responses
  const stage1Responses = await stage1CollectResponses(query, models);
  onStage1Complete?.(stage1Responses);

  // Stage 2: Peer ranking
  const stage2Result = await stage2CollectRankings(stage1Responses, models, query);
  onStage2Complete?.(stage2Result);

  // Stage 3: Synthesis
  const stage3Response = await stage3Synthesize(
    stage1Responses,
    stage2Result,
    query,
    chairmanModel
  );

  return {
    stage1: stage1Responses,
    stage2: stage2Result,
    stage3: stage3Response,
  };
}
