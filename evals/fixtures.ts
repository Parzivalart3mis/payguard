/**
 * Eval fixtures: documents with obligations and the regulatory corpus snippets
 * that should ground each one. Retrieval hit-rate is measured against these
 * expected chunk ids; the LLM-as-judge faithfulness score (optional) is run
 * over drafts generated from these documents.
 */
export interface EvalObligation {
  id: string;
  text: string;
  expectedChunkIds: string[];
}

export interface EvalFixture {
  id: string;
  documentText: string;
  obligations: EvalObligation[];
}

export const FIXTURES: EvalFixture[] = [
  {
    id: "fixture-deposit",
    documentText:
      "The institution will investigate electronic fund transfer errors and determine whether an error occurred within 10 business days. It discloses the annual percentage yield and all fees before the account is opened. It provides an initial privacy notice and an opt-out for sharing nonpublic personal information with nonaffiliated third parties.",
    obligations: [
      {
        id: "dep-1",
        text: "Investigate electronic fund transfer errors and determine whether an error occurred within 10 business days.",
        expectedChunkIds: ["corpus:reg-e-error-resolution"],
      },
      {
        id: "dep-2",
        text: "Disclose the annual percentage yield, interest rate, minimum balance, and all fees before the deposit account is opened.",
        expectedChunkIds: ["corpus:reg-dd-fee-disclosure"],
      },
      {
        id: "dep-3",
        text: "Provide an initial privacy notice and opt-out for sharing nonpublic personal information with nonaffiliated third parties.",
        expectedChunkIds: ["corpus:glba-privacy-notice"],
      },
    ],
  },
  {
    id: "fixture-aml",
    documentText:
      "The institution files a suspicious activity report for transactions it suspects involve illegal activity. It files a currency transaction report for currency transactions of more than $10,000 in a single business day. It verifies the identity of each customer opening an account under its customer identification program.",
    obligations: [
      {
        id: "aml-1",
        text: "File a suspicious activity report (SAR) for transactions suspected to involve illegal activity.",
        expectedChunkIds: ["corpus:bsa-aml-sar"],
      },
      {
        id: "aml-2",
        text: "File a currency transaction report for currency transactions of more than $10,000 in a single business day.",
        expectedChunkIds: ["corpus:bsa-ctr"],
      },
      {
        id: "aml-3",
        text: "Verify the identity of each customer opening an account under the customer identification program.",
        expectedChunkIds: ["corpus:cip-kyc"],
      },
    ],
  },
  {
    id: "fixture-credit",
    documentText:
      "The lender discloses the annual percentage rate, finance charges, and total of payments before the consumer credit transaction is consummated. The institution makes funds from check deposits available within the times required and discloses its funds-availability policy. The institution limits a consumer's liability for unauthorized electronic fund transfers based on timely notice.",
    obligations: [
      {
        id: "cr-1",
        text: "Disclose the annual percentage rate, finance charges, and total of payments before consummation of the consumer credit transaction.",
        expectedChunkIds: ["corpus:reg-z-truth-in-lending"],
      },
      {
        id: "cr-2",
        text: "Make funds from check deposits available within required times and disclose the funds-availability policy.",
        expectedChunkIds: ["corpus:reg-cc-funds-availability"],
      },
      {
        id: "cr-3",
        text: "Limit a consumer's liability for unauthorized electronic fund transfers based on timely notice.",
        expectedChunkIds: ["corpus:reg-e-liability-limits"],
      },
    ],
  },
];
