"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getModelDisplayName,
  getModelColor,
  type CouncilResponse,
  type Stage1Response,
  type Stage2Result,
  type Settings,
} from "@/lib/types";

interface CouncilResponseViewProps {
  councilResponse?: CouncilResponse;
  pendingStage1?: Stage1Response[];
  pendingStage2?: Stage2Result;
  pendingStage3?: string;
  currentStage?: 0 | 1 | 2 | 3;
  settings: Settings | null;
}

export function CouncilResponseView({
  councilResponse,
  pendingStage1,
  pendingStage2,
  pendingStage3,
  currentStage = 0,
  settings,
}: CouncilResponseViewProps) {
  const stage1 = councilResponse?.stage1 || pendingStage1;
  const stage2 = councilResponse?.stage2 || pendingStage2;
  const stage3 = councilResponse?.stage3 || pendingStage3;

  const [copied, setCopied] = useState(false);

  // Compute active model - use first model if not set
  const firstModel = stage1?.[0]?.model || "";
  const [selectedModel, setSelectedModel] = useState<string>("");
  const activeModel = selectedModel || firstModel;

  // Reset selection when stage1 changes
  useEffect(() => {
    setSelectedModel("");
  }, [stage1]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate token count (rough estimate)
  const getTokenCount = (text: string) => Math.ceil(text.length / 4);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,320px]">
      {/* Left Column: Council Responses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Council Responses
          </h3>
          {currentStage === 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Collecting responses...
            </div>
          )}
        </div>

        {stage1 && stage1.length > 0 && (
          <Tabs value={activeModel} onValueChange={setSelectedModel}>
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
              {stage1.map((response) => (
                <TabsTrigger
                  key={response.model}
                  value={response.model}
                  className="flex items-center gap-2 rounded-full border bg-secondary px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <div
                    className={`h-2 w-2 rounded-full ${getModelColor(response.model)}`}
                  />
                  <span className="text-sm font-medium">
                    {getModelDisplayName(response.model)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {stage1.map((response) => (
              <TabsContent key={response.model} value={response.model}>
                <Card className="border-border/50 bg-card/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${getModelColor(response.model)}`}
                        />
                        <CardTitle className="text-base">
                          {getModelDisplayName(response.model)}
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">
                          {response.model.split("/")[0]}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(response.content)}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {response.content}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getTokenCount(response.content)} tokens</span>
                      <span>
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Chairman's Synthesis */}
        {(stage3 || currentStage === 3) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Chairman&apos;s Synthesis
            </h3>

            {currentStage === 3 && !stage3 ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="flex items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Synthesizing final response...
                  </span>
                </CardContent>
              </Card>
            ) : stage3 ? (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">Final Response</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Chairman
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Synthesized from all council members
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopy(stage3)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {stage3}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>

      {/* Right Column: Peer Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Peer Review
          </h3>
          {currentStage === 2 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ranking...
            </div>
          )}
        </div>

        {stage2 && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Peer Rankings
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {stage2.rankings.length} reviews
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stage2.aggregateRankings.map((ranking, index) => {
                // Calculate score out of 4 (inverse of avg rank, scaled to 4)
                const maxModels = stage2.aggregateRankings.length;
                const score = ((maxModels - ranking.avgRank + 1) / maxModels) * 4;
                const progressValue = (score / 4) * 100;

                return (
                  <div key={ranking.model} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {index === 0 ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <Star className="h-4 w-4 text-muted-foreground/30" />
                        )}
                        <div
                          className={`h-2 w-2 rounded-full ${getModelColor(ranking.model)}`}
                        />
                        <span>{getModelDisplayName(ranking.model)}</span>
                      </div>
                      <span className="font-mono text-muted-foreground">
                        {score.toFixed(1)} / 4
                      </span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground pt-2">
                Each model anonymously ranks the others based on accuracy and insight
              </p>
            </CardContent>
          </Card>
        )}

        {!stage2 && currentStage >= 1 && (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              {currentStage === 1
                ? "Waiting for responses..."
                : "Processing rankings..."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
