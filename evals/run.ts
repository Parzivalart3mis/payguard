import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { docNamespace } from "@/lib/constants";
import { retrieveForObligation } from "@/lib/retrieval";
import { chunkText } from "@/lib/retrieval/chunk";
import { seedCorpus } from "@/lib/retrieval/corpus";
import { FakeVectorStore } from "@/lib/retrieval/fake";
import { FIXTURES } from "./fixtures";

const BASELINE_PATH = join(process.cwd(), "evals", "baseline.json");

interface EvalResult {
  retrievalHitRate: number;
  faithfulnessScore: number | null;
  fixtures: number;
  obligations: number;
  generatedAt: string;
}

async function ingest(
  store: FakeVectorStore,
  id: string,
  text: string,
): Promise<void> {
  const pieces = chunkText(text);
  await store.upsert(
    docNamespace(id),
    pieces.map((t, i) => ({
      id: `${id}:${i}`,
      text: t,
      metadata: { source: "document", chunkIndex: i, documentId: id },
    })),
  );
}

async function measureRetrieval(store: FakeVectorStore): Promise<{
  hitRate: number;
  total: number;
}> {
  let hits = 0;
  let total = 0;
  for (const fixture of FIXTURES) {
    await ingest(store, fixture.id, fixture.documentText);
    for (const obligation of fixture.obligations) {
      total += 1;
      const ctx = await retrieveForObligation(
        store,
        { id: obligation.id, text: obligation.text },
        fixture.id,
      );
      const got = new Set(ctx.chunks.map((c) => c.id));
      if (obligation.expectedChunkIds.some((id) => got.has(id))) hits += 1;
    }
  }
  return { hitRate: total ? hits / total : 0, total };
}

/**
 * Optional LLM-as-judge faithfulness score over generated drafts. Only runs
 * with RUN_FAITHFULNESS=1 and a configured ANTHROPIC_API_KEY (it costs money).
 */
async function measureFaithfulness(
  store: FakeVectorStore,
): Promise<number | null> {
  if (process.env.RUN_FAITHFULNESS !== "1" || !process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  const { draftCompletion } = await import("@/lib/ai/draft");
  const { runSelfCheck } = await import("@/lib/ai/selfcheck");
  const { mergeContexts } = await import("@/lib/pipeline/merge");
  const { retrieveForObligations } = await import("@/lib/retrieval");

  let passes = 0;
  for (const fixture of FIXTURES) {
    const contexts = await retrieveForObligations(
      store,
      fixture.obligations.map((o) => ({ id: o.id, text: o.text })),
      fixture.id,
    );
    const merged = mergeContexts(contexts);
    const content = await draftCompletion({
      documentTitle: fixture.id,
      obligations: fixture.obligations.map((o) => ({
        id: o.id,
        text: o.text,
        category: "other",
      })),
      contextText: merged.contextText,
    });
    const verdict = await runSelfCheck({
      draft: content,
      contextText: merged.contextText,
    });
    if (verdict.verdict === "pass") passes += 1;
  }
  return FIXTURES.length ? passes / FIXTURES.length : null;
}

async function main() {
  const store = new FakeVectorStore();
  await seedCorpus(store);

  const retrieval = await measureRetrieval(store);
  const faithfulnessScore = await measureFaithfulness(store);

  const result: EvalResult = {
    retrievalHitRate: Number(retrieval.hitRate.toFixed(4)),
    faithfulnessScore,
    fixtures: FIXTURES.length,
    obligations: retrieval.total,
    generatedAt: new Date().toISOString(),
  };

  console.log("Eval result:", result);

  const update = process.argv.includes("--update");
  const threshold = Number(process.env.EVAL_THRESHOLD ?? "0.1");

  if (update || !existsSync(BASELINE_PATH)) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(result, null, 2)}\n`);
    console.log(`Baseline written to ${BASELINE_PATH}`);
    return;
  }

  const baseline = JSON.parse(
    readFileSync(BASELINE_PATH, "utf8"),
  ) as EvalResult;
  console.log("Baseline:", baseline);

  if (result.retrievalHitRate < baseline.retrievalHitRate - threshold) {
    console.error(
      `REGRESSION: retrieval hit-rate ${result.retrievalHitRate} fell below baseline ${baseline.retrievalHitRate} (tolerance ${threshold}).`,
    );
    process.exit(1);
  }

  if (
    faithfulnessScore !== null &&
    baseline.faithfulnessScore !== null &&
    faithfulnessScore < baseline.faithfulnessScore - threshold
  ) {
    console.error(
      `REGRESSION: faithfulness score ${faithfulnessScore} fell below baseline ${baseline.faithfulnessScore} (tolerance ${threshold}).`,
    );
    process.exit(1);
  }

  console.log("Eval passed (no regression).");
}

main().catch((err) => {
  console.error("Eval failed:", err);
  process.exit(1);
});
