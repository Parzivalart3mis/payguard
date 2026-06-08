import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { documents } from "@/db/schema";
import { MODELS } from "@/lib/constants";
import { hasVector } from "@/lib/env";
import type { Faithfulness, Obligation } from "@/lib/types";
import { getVectorStore } from "@/lib/retrieval";
import { seedCorpus } from "@/lib/retrieval/corpus";
import { ingestDocumentChunks } from "@/lib/pipeline";
import { createAnalysis } from "@/lib/repositories/analyses";
import { createDocument } from "@/lib/repositories/documents";
import { createDraft } from "@/lib/repositories/drafts";
import { upsertUserFromClerk } from "@/lib/repositories/users";

const SEED_TITLE = "Consumer Deposit Account Agreement (Sample)";

const SAMPLE_DOCUMENT = `CONSUMER DEPOSIT ACCOUNT AGREEMENT AND DISCLOSURES

1. Error Resolution for Electronic Transfers.
In case of errors or questions about electronic fund transfers, the account holder must notify us no later than 60 days after we send the FIRST statement on which the problem or error appeared. We will investigate the reported error and determine whether an error occurred within 10 business days of receiving notice. We will tell the account holder the results within three business days after completing our investigation. If we need more time, we may take up to 45 days to investigate, and we will provisionally credit the account for the amount in question.

2. Unauthorized Transfer Liability.
If the account holder tells us within two business days after learning of the loss or theft of their access device, they can lose no more than $50 if someone used the device without permission. Failure to notify us within the applicable period may increase the account holder's liability.

3. Fees and Annual Percentage Yield.
We will disclose the annual percentage yield, the interest rate, minimum balance requirements, and all fees that may be imposed in connection with the account before the account is opened and upon request. A monthly maintenance fee applies unless the minimum daily balance is maintained.

4. Funds Availability.
Funds from deposits may not be available for immediate withdrawal. We make funds available according to our funds-availability policy, which is disclosed at account opening. Longer holds may apply under exception conditions.

5. Privacy.
We provide an initial privacy notice describing our information-sharing practices and the account holder's right to opt out of certain sharing with nonaffiliated third parties. We maintain administrative, technical, and physical safeguards to protect customer information.

6. Account Monitoring and Reporting.
We monitor account activity for unusual or suspicious transactions and may report such activity to the appropriate authorities as required by law. Large currency transactions may be subject to reporting requirements.`;

const OBLIGATIONS: Obligation[] = [
  {
    id: "ob-error-resolution",
    text: "Investigate reported electronic-transfer errors within 10 business days, report results within three business days of completing the investigation, and provisionally credit the account if the investigation extends to 45 days.",
    category: "consumer_protection",
    sourceSpan: "determine whether an error occurred within 10 business days",
  },
  {
    id: "ob-unauthorized-liability",
    text: "Limit the account holder's liability for unauthorized transfers to $50 when they notify the institution within two business days of learning of the loss or theft.",
    category: "consumer_protection",
    sourceSpan: "they can lose no more than $50",
  },
  {
    id: "ob-fee-disclosure",
    text: "Disclose the annual percentage yield, interest rate, minimum balance requirements, and all account fees before the account is opened and upon request.",
    category: "disclosure",
    sourceSpan: "disclose the annual percentage yield ... and all fees",
  },
  {
    id: "ob-privacy",
    text: "Provide an initial privacy notice, honor opt-out rights for sharing with nonaffiliated third parties, and maintain safeguards for customer information.",
    category: "data_privacy",
    sourceSpan:
      "initial privacy notice describing our information-sharing practices",
  },
  {
    id: "ob-monitoring",
    text: "Monitor account activity for suspicious transactions and report large currency transactions and suspicious activity as required by law.",
    category: "anti_money_laundering",
    sourceSpan:
      "monitor account activity for unusual or suspicious transactions",
  },
];

function buildDraftContent(docChunkId: string): string {
  return `Error resolution. Upon receiving notice of an alleged electronic fund transfer error, the institution will determine whether an error occurred within 10 business days, report the results within three business days of completing its investigation, and, where the investigation extends to 45 days, provisionally credit the account for the disputed amount [corpus:reg-e-error-resolution] [${docChunkId}]. Account holders must report suspected errors within 60 days of the first statement reflecting the error [${docChunkId}].

Unauthorized transfer liability. The account holder's liability for unauthorized electronic fund transfers is limited to $50 when the institution is notified within two business days of learning of the loss or theft of the access device, with higher limits applying to later notice [corpus:reg-e-liability-limits].

Fee and yield disclosures. Before an account is opened and upon request, the institution discloses the annual percentage yield, interest rate, minimum balance requirements, and all applicable fees [corpus:reg-dd-fee-disclosure].

Privacy and safeguards. The institution provides an initial privacy notice, offers the right to opt out of sharing nonpublic personal information with nonaffiliated third parties [corpus:glba-privacy-notice], and maintains administrative, technical, and physical safeguards for customer information [corpus:glba-safeguards-rule].

Monitoring and reporting. The institution monitors account activity for suspicious transactions and files reports as required, including currency transaction reports for cash transactions exceeding $10,000 in a single business day [corpus:bsa-ctr] and suspicious activity reports where warranted [corpus:bsa-aml-sar].`;
}

function buildCitations(docChunkId: string) {
  return [
    {
      claim:
        "Determine whether an error occurred within 10 business days and report results within three business days.",
      sourceChunkIds: ["corpus:reg-e-error-resolution", docChunkId],
    },
    {
      claim:
        "Liability for unauthorized transfers is limited to $50 with timely notice.",
      sourceChunkIds: ["corpus:reg-e-liability-limits"],
    },
    {
      claim:
        "Disclose APY, interest rate, minimum balances, and fees before opening and on request.",
      sourceChunkIds: ["corpus:reg-dd-fee-disclosure"],
    },
    {
      claim:
        "Provide a privacy notice with opt-out and maintain information safeguards.",
      sourceChunkIds: [
        "corpus:glba-privacy-notice",
        "corpus:glba-safeguards-rule",
      ],
    },
    {
      claim: "File CTRs over $10,000 and SARs for suspicious activity.",
      sourceChunkIds: ["corpus:bsa-ctr", "corpus:bsa-aml-sar"],
    },
  ];
}

const FAITHFULNESS: Faithfulness = { verdict: "pass", flags: [] };

async function main() {
  const db = getDb();

  console.log("Seeding users...");
  const author = await upsertUserFromClerk(db, {
    clerkId: "seed_author",
    email: "author@payguard.example",
    name: "Avery Author",
    role: "author",
  });
  const reviewer = await upsertUserFromClerk(db, {
    clerkId: "seed_reviewer",
    email: "reviewer@payguard.example",
    name: "Riley Reviewer",
    role: "reviewer",
  });
  await upsertUserFromClerk(db, {
    clerkId: "seed_admin",
    email: "admin@payguard.example",
    name: "Adrian Admin",
    role: "admin",
  });

  const store = getVectorStore();

  if (hasVector()) {
    console.log("Seeding regulatory corpus into Upstash Vector...");
    const count = await seedCorpus(store);
    console.log(`  upserted ${count} corpus snippets`);
  } else {
    console.warn("Upstash Vector not configured — skipping vector seeding.");
  }

  const existing = await db
    .select()
    .from(documents)
    .where(
      and(eq(documents.ownerId, author.id), eq(documents.title, SEED_TITLE)),
    )
    .limit(1);

  if (existing[0]) {
    console.log("Sample document already exists — skipping document seed.");
    console.log("Seed complete.");
    return;
  }

  console.log("Seeding sample document, analysis, and draft...");
  const document = await createDocument(db, {
    ownerId: author.id,
    title: SEED_TITLE,
    sourceType: "text",
    rawText: SAMPLE_DOCUMENT,
  });

  const docChunkId = `${document.id}:0`;
  if (hasVector()) {
    const n = await ingestDocumentChunks(store, document.id, SAMPLE_DOCUMENT);
    console.log(`  ingested ${n} document chunks`);
  }

  await createAnalysis(db, {
    documentId: document.id,
    obligations: OBLIGATIONS,
    model: MODELS.extract,
  });

  await createDraft(db, {
    documentId: document.id,
    version: 1,
    content: buildDraftContent(docChunkId),
    citations: buildCitations(docChunkId),
    faithfulness: FAITHFULNESS,
    status: "drafted",
    createdById: author.id,
    assignedReviewerId: reviewer.id,
  });

  // Reflect that a draft is ready for the author to review/submit.
  await db
    .update(documents)
    .set({ status: "drafted" })
    .where(eq(documents.id, document.id));

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
