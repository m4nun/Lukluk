/**
 * Agent Framework Evaluation Harness
 *
 * Compares three framework implementations of the Lukluk Decision Agent:
 *   1. LangGraph (current, baseline)
 *   2. AI SDK ToolLoopAgent
 *   3. Mastra Agent
 *
 * Run with: npx tsx src/lib/agent/eval.ts
 * Requires: OPENROUTER_API_KEY and TAVILY_API_KEY in environment
 */

import { SupabasePlanningRepository } from "./supabase-repo";
import { runAgent as runLangGraph } from "./invoke";
import { runAiSdkAgent } from "./ai-sdk-agent";
import { runMastraAgent } from "./mastra-agent";
import { createAgentTools } from "./tools";
import { DECISION_SYSTEM_PROMPT } from "./graph";

interface EvalCase {
  id: string;
  message: string;
  expectToolCall?: string;
  expectThai: boolean;
}

interface EvalResult {
  framework: string;
  caseId: string;
  text: string;
  steps: Array<{ type: string; toolName?: string }>;
  durationMs: number;
  toolCallsMatch: boolean;
  thaiDetected: boolean;
  error?: string;
}

const EVAL_CASES: EvalCase[] = [
  {
    id: "thai-greeting",
    message: "สวัสดีครับ ช่วยแนะนำเกี่ยวกับการเลี้ยงสุนัขพันธุ์โกลเด้นหน่อยครับ",
    expectThai: true,
  },
  {
    id: "expense-update",
    message:
      "I want to add an expense for monthly dog food, 2000 THB per month",
    expectToolCall: "update_expenses",
    expectThai: false,
  },
  {
    id: "location-query",
    message: "หาคลินิกรักษาสัตว์แถวสยามให้หน่อย",
    expectToolCall: "search_pet_places",
    expectThai: true,
  },
  {
    id: "concern-resolution",
    message: "Please resolve the shedding concern - I found a good brush",
    expectToolCall: "update_concerns",
    expectThai: false,
  },
  {
    id: "status-change",
    message: "ผมตัดสินใจแล้วว่าจะรับเลี้ยง พร้อมซื้อแล้วครับ",
    expectToolCall: "update_decision_status",
    expectThai: true,
  },
];

function detectThai(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text);
}

function toolCallsMatch(
  steps: Array<{ type: string; toolName?: string }>,
  expected?: string,
): boolean {
  if (!expected) return true; // no expectation = always pass
  return steps.some(
    (s) => s.type === "tool_call" && s.toolName === expected,
  );
}

async function runEval(
  name: string,
  profileId: string,
  runFn: (
    repo: SupabasePlanningRepository,
    profileId: string,
    message: string,
  ) => Promise<{ text: string; steps: Array<{ type: string; toolName?: string; content: string }> }>,
): Promise<EvalResult[]> {
  const repo = new SupabasePlanningRepository();
  const results: EvalResult[] = [];

  for (const tc of EVAL_CASES) {
    const start = performance.now();

    try {
      const result = await runFn(repo, profileId, tc.message);
      const durationMs = Math.round(performance.now() - start);

      results.push({
        framework: name,
        caseId: tc.id,
        text: result.text,
        steps: result.steps,
        durationMs,
        toolCallsMatch: toolCallsMatch(result.steps, tc.expectToolCall),
        thaiDetected: detectThai(result.text),
      });
    } catch (e) {
      results.push({
        framework: name,
        caseId: tc.id,
        text: "",
        steps: [],
        durationMs: Math.round(performance.now() - start),
        toolCallsMatch: false,
        thaiDetected: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return results;
}

function printReport(allResults: EvalResult[]) {
  console.log("\n" + "=".repeat(80));
  console.log("LUKLUK AGENT FRAMEWORK EVALUATION");
  console.log("=".repeat(80));

  const frameworks = ["LangGraph", "AI SDK ToolLoopAgent", "Mastra"];

  // Per-framework summary
  for (const fw of frameworks) {
    const fwResults = allResults.filter((r) => r.framework === fw);
    const passed = fwResults.filter(
      (r) => r.toolCallsMatch && !r.error,
    ).length;
    const avgLatency = fwResults.reduce((s, r) => s + r.durationMs, 0) / Math.max(fwResults.length, 1);
    const errors = fwResults.filter((r) => r.error).length;

    console.log(`\n--- ${fw} ---`);
    console.log(`  Pass rate: ${passed}/${fwResults.length}`);
    console.log(`  Avg latency: ${Math.round(avgLatency)}ms`);
    console.log(`  Errors: ${errors}`);

    for (const r of fwResults) {
      const status = r.error ? "FAIL" : r.toolCallsMatch ? "PASS" : "MISMATCH";
      const thai = r.thaiDetected ? "TH" : "EN";
      const tools = r.steps
        .filter((s) => s.type === "tool_call")
        .map((s) => s.toolName)
        .join(", ");
      console.log(
        `  ${status} | ${r.caseId.padEnd(20)} | ${r.durationMs.toString().padStart(5)}ms | ${thai} | tools: [${tools || "none"}]`,
      );
      if (r.error) console.log(`         ERROR: ${r.error}`);
    }
  }

  // Comparison table
  console.log("\n" + "=".repeat(80));
  console.log("COMPARISON TABLE");
  console.log("=".repeat(80));
  console.log(
    [
      "| Criterion".padEnd(32),
      "| LangGraph".padEnd(18),
      "| AI SDK".padEnd(18),
      "| Mastra".padEnd(18),
      "|",
    ].join(""),
  );
  console.log("|" + "-".repeat(31) + "|" + "-".repeat(17) + "|" + "-".repeat(17) + "|" + "-".repeat(17) + "|");

  const langPassed = allResults.filter((r) => r.framework === "LangGraph" && r.toolCallsMatch && !r.error).length;
  const aiSdkPassed = allResults.filter((r) => r.framework === "AI SDK ToolLoopAgent" && r.toolCallsMatch && !r.error).length;
  const mastraPassed = allResults.filter((r) => r.framework === "Mastra" && r.toolCallsMatch && !r.error).length;

  const langAvg = allResults.filter((r) => r.framework === "LangGraph").reduce((s, r) => s + r.durationMs, 0) / EVAL_CASES.length;
  const aiSdkAvg = allResults.filter((r) => r.framework === "AI SDK ToolLoopAgent").reduce((s, r) => s + r.durationMs, 0) / EVAL_CASES.length;
  const mastraAvg = allResults.filter((r) => r.framework === "Mastra").reduce((s, r) => s + r.durationMs, 0) / EVAL_CASES.length;

  const metrics: Array<[string, string, string, string]> = [
    ["Correctness", `${langPassed}/${EVAL_CASES.length}`, `${aiSdkPassed}/${EVAL_CASES.length}`, `${mastraPassed}/${EVAL_CASES.length}`],
    ["Avg latency", `${Math.round(langAvg)}ms`, `${Math.round(aiSdkAvg)}ms`, `${Math.round(mastraAvg)}ms`],
    ["Dependencies", "3 (@langchain/*)", "1 (ai)", "140 (@mastra/*)"],
    ["Tool loop control", "Manual graph", "stopWhen", "maxSteps"],
    ["Streaming", "Custom SSE", "toUIMessageStream", "handleChatStream"],
    ["State persistence", "agent_threads", "DIY onEnd", "@mastra/memory"],
    ["OpenRouter", "Manual config", "@ai-sdk/openai", "Native provider"],
    ["Next.js integration", "Custom route", "Native", "handleChatStream"],
  ];

  for (const [criterion, lang, ai, mastra] of metrics) {
    console.log(`| ${criterion.padEnd(30)} | ${lang.padEnd(16)} | ${ai.padEnd(16)} | ${mastra.padEnd(16)} |`);
  }
}

async function main() {
  const profileId = process.env.EVAL_PROFILE_ID;
  if (!profileId) {
    console.log("Skipping live eval (set EVAL_PROFILE_ID to a real planning profile UUID)");
    printStaticComparison();
    return;
  }

  const allResults: EvalResult[] = [];

  // LangGraph baseline
  console.log("\nRunning LangGraph evals...");
  const langGraphResults = await runEval(
    "LangGraph",
    profileId,
    async (repo, pid, msg) => {
      const result = await runLangGraph({
        profileTable: "planning_pet_profiles",
        threadField: "planning_pet_profile_id",
        profileId: pid,
        agentType: "decision",
        systemPrompt: DECISION_SYSTEM_PROMPT,
        tools: createAgentTools(repo),
        repo,
        idParam: "planning_profile_id",
        message: msg,
      });
      if ("error" in result) throw new Error(result.error);
      return {
        text: result.response,
        steps: result.steps.map((s) => ({
          type: s.type,
          toolName: s.toolName,
          content: s.content,
        })),
      };
    },
  );
  allResults.push(...langGraphResults);

  // AI SDK ToolLoopAgent
  console.log("Running AI SDK ToolLoopAgent evals...");
  const aiSdkResults = await runEval(
    "AI SDK ToolLoopAgent",
    profileId,
    async (repo, pid, msg) => {
      return runAiSdkAgent(repo, pid, msg);
    },
  );
  allResults.push(...aiSdkResults);

  // Mastra
  console.log("Running Mastra evals...");
  const mastraResults = await runEval(
    "Mastra",
    profileId,
    async (repo, pid, msg) => {
      return runMastraAgent(repo, pid, msg);
    },
  );
  allResults.push(...mastraResults);

  printReport(allResults);
}

function printStaticComparison() {
  console.log("\n" + "=".repeat(80));
  console.log("LUKLUK AGENT FRAMEWORK — STATIC COMPARISON");
  console.log("=".repeat(80));

  const comparison = [
    { criterion: "Framework maturity", langGraph: "Proven (v1.4.7)", aiSdk: "Stable (v7.0.14)", mastra: "Young (v1.50, supply-chain risk)" },
    { criterion: "New dependencies", langGraph: "3 (@langchain/*)", aiSdk: "0 (already installed)", mastra: "140+ (@mastra/*)" },
    { criterion: "Install size (server)", langGraph: "~15MB", aiSdk: "~3MB", mastra: "~30MB+" },
    { criterion: "Tool calling API", langGraph: "StructuredTool.bindTools()", aiSdk: "tool({ inputSchema, execute })", mastra: "createTool({ id, inputSchema, execute })" },
    { criterion: "Loop control", langGraph: "Manual graph + forceText", aiSdk: "stopWhen: [isStepCount(N)]", mastra: "maxSteps: N" },
    { criterion: "Loop hooks", langGraph: "StateGraph edges", aiSdk: "onStepEnd, onToolExecution*", mastra: "onStepFinish, beforeToolCall" },
    { criterion: "State persistence", langGraph: "agent_threads manual", aiSdk: "DIY (onEnd callback)", mastra: "@mastra/memory (PostgreSQL)" },
    { criterion: "Streaming protocol", langGraph: "Custom SSE", aiSdk: "toUIMessageStream (native)", mastra: "handleChatStream (native)" },
    { criterion: "Client integration", langGraph: "Custom AgentChat", aiSdk: "useChat hook (native)", mastra: "useChat hook (native)" },
    { criterion: "OpenRouter support", langGraph: "Manual ChatOpenAI config", aiSdk: "@ai-sdk/openai .chat()", mastra: "@openrouter/ai-sdk-provider (native)" },
    { criterion: "TypeScript safety", langGraph: "Weak (constructor.name)", aiSdk: "Full (ToolSet, Context)", mastra: "Full" },
    { criterion: "Learning curve", langGraph: "Steep (graphs, nodes)", aiSdk: "Gentle (ToolLoopAgent)", mastra: "Moderate (Agent + config)" },
    { criterion: "Code for Decision Agent", langGraph: "~200 lines (graph.ts)", aiSdk: "~200 lines (ai-sdk-agent.ts)", mastra: "~230 lines (mastra-agent.ts)" },
    { criterion: "Production readiness", langGraph: "Deployed", aiSdk: "Ready (test first)", mastra: "Risky (supply chain)" },
  ];

  for (const row of comparison) {
    console.log(`\n${row.criterion}:`);
    console.log(`  LangGraph:  ${row.langGraph}`);
    console.log(`  AI SDK:     ${row.aiSdk}`);
    console.log(`  Mastra:     ${row.mastra}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log("RECOMMENDATION: AI SDK ToolLoopAgent");
  console.log("=".repeat(80));
  console.log("Reasons:");
  console.log("  1. Zero new dependencies (ai@7.0.14 already installed)");
  console.log("  2. ToolLoopAgent is a first-class agent primitive in AI SDK v7");
  console.log("  3. stopWhen replaces manual iteration counting");
  console.log("  4. toUIMessageStream enables native useChat client integration");
  console.log("  5. Mastra adds 140+ deps with supply-chain attack history");
  console.log("  6. LangGraph's graph abstraction is overkill for linear tool loops");
  console.log("  7. Code is the same ~200 lines with cleaner APIs");
}

main().catch(console.error);
