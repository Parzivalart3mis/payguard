import { CORPUS_NAMESPACE } from "@/lib/constants";
import type { VectorStore } from "./types";

/**
 * Synthetic regulatory reference snippets for the shared `corpus` namespace.
 * These stand in for a curated compliance knowledge base; drafts cite them by id.
 */
export const CORPUS_SNIPPETS: ReadonlyArray<{ id: string; text: string }> = [
  {
    id: "corpus:reg-e-error-resolution",
    text: "Regulation E (Electronic Fund Transfers) requires a financial institution to investigate alleged errors promptly. The institution must determine whether an error occurred within 10 business days of receiving notice, report the results within three business days after completing the investigation, and correct any error within one business day after determining it occurred. If more time is needed, the institution may take up to 45 days but must provisionally credit the consumer's account.",
  },
  {
    id: "corpus:reg-z-truth-in-lending",
    text: "Regulation Z (Truth in Lending) requires clear and conspicuous disclosure of the annual percentage rate (APR), finance charges, amount financed, and total of payments before consummation of a consumer credit transaction. Disclosures must be grouped together, segregated from other information, and provided in a form the consumer may keep.",
  },
  {
    id: "corpus:reg-dd-fee-disclosure",
    text: "Regulation DD (Truth in Savings) requires depository institutions to disclose the annual percentage yield (APY), interest rate, minimum balance requirements, and all fees that may be imposed in connection with a deposit account. Fee schedules must be provided before an account is opened and upon request.",
  },
  {
    id: "corpus:glba-privacy-notice",
    text: "The Gramm-Leach-Bliley Act (GLBA) requires financial institutions to provide consumers an initial privacy notice describing information-sharing practices, and an annual notice thereafter where applicable. Institutions must give consumers the right to opt out of having nonpublic personal information shared with nonaffiliated third parties.",
  },
  {
    id: "corpus:glba-safeguards-rule",
    text: "The GLBA Safeguards Rule requires a written information security program with administrative, technical, and physical safeguards appropriate to the size and complexity of the institution. The program must designate a qualified individual to oversee it, conduct risk assessments, and encrypt customer information in transit and at rest.",
  },
  {
    id: "corpus:bsa-aml-sar",
    text: "The Bank Secrecy Act (BSA) and its anti-money-laundering rules require filing a Suspicious Activity Report (SAR) for transactions of $5,000 or more that the institution knows, suspects, or has reason to suspect involve illegal activity. SARs must generally be filed within 30 calendar days of detecting facts that constitute a basis for filing.",
  },
  {
    id: "corpus:bsa-ctr",
    text: "Under the Bank Secrecy Act, a Currency Transaction Report (CTR) must be filed for each transaction in currency of more than $10,000 conducted by, through, or to the institution on a single business day. Multiple currency transactions are aggregated when the institution has knowledge they are by or on behalf of the same person.",
  },
  {
    id: "corpus:cip-kyc",
    text: "The Customer Identification Program (CIP) rule requires institutions to verify the identity of each customer opening an account, collecting name, date of birth, address, and an identification number, and to maintain records of the information used to verify identity. Know Your Customer (KYC) procedures support ongoing customer due diligence.",
  },
  {
    id: "corpus:udaap",
    text: "The prohibition on Unfair, Deceptive, or Abusive Acts or Practices (UDAAP) under the Dodd-Frank Act prohibits conduct that causes or is likely to cause substantial injury to consumers that is not reasonably avoidable and not outweighed by countervailing benefits, as well as material misrepresentations and practices that take unreasonable advantage of a consumer.",
  },
  {
    id: "corpus:reg-e-liability-limits",
    text: "Regulation E limits a consumer's liability for unauthorized electronic fund transfers based on timely notice: liability is capped at $50 if the consumer notifies the institution within two business days of learning of the loss or theft, and up to $500 if notice is given after two business days but within 60 days of the statement.",
  },
  {
    id: "corpus:fcra-accuracy",
    text: "The Fair Credit Reporting Act (FCRA) requires furnishers of information to consumer reporting agencies to provide accurate information and to investigate disputes. Furnishers must correct and update inaccurate information and notify consumer reporting agencies of disputes.",
  },
  {
    id: "corpus:reg-cc-funds-availability",
    text: "Regulation CC (Expedited Funds Availability) requires institutions to make funds from deposits available within prescribed time frames and to disclose their funds-availability policy. Generally, the first $225 of a check deposit must be available the next business day, with longer holds permitted only under specific exception conditions that must be disclosed.",
  },
];

/** Reset and re-seed the shared regulatory corpus namespace. */
export async function seedCorpus(store: VectorStore): Promise<number> {
  await store.reset(CORPUS_NAMESPACE);
  await store.upsert(
    CORPUS_NAMESPACE,
    CORPUS_SNIPPETS.map((s, i) => ({
      id: s.id,
      text: s.text,
      metadata: { source: "corpus", chunkIndex: i },
    })),
  );
  return CORPUS_SNIPPETS.length;
}
