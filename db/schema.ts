import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type {
  DocumentStatus,
  DraftStatus,
  ReviewDecision,
  SourceType,
  UserRole,
} from "@/lib/constants";
import type { Citation, Faithfulness, Obligation } from "@/lib/types";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId());

const createdAt = () => timestamp("created_at").defaultNow().notNull();

export const users = pgTable("users", {
  id: id(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role").$type<UserRole>().notNull().default("author"),
  createdAt: createdAt(),
});

export const documents = pgTable(
  "documents",
  {
    id: id(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    sourceType: text("source_type").$type<SourceType>().notNull(),
    blobUrl: text("blob_url"),
    rawText: text("raw_text").notNull(),
    status: text("status")
      .$type<DocumentStatus>()
      .notNull()
      .default("uploaded"),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("documents_owner_idx").on(t.ownerId),
    index("documents_status_idx").on(t.status),
  ],
);

export const analyses = pgTable(
  "analyses",
  {
    id: id(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    obligations: jsonb("obligations")
      .$type<Obligation[]>()
      .notNull()
      .default([]),
    model: text("model").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("analyses_document_idx").on(t.documentId)],
);

export const drafts = pgTable(
  "drafts",
  {
    id: id(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations").$type<Citation[]>().notNull().default([]),
    faithfulness: jsonb("faithfulness").$type<Faithfulness>(),
    status: text("status").$type<DraftStatus>().notNull().default("generating"),
    assignedReviewerId: text("assigned_reviewer_id").references(() => users.id),
    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    index("drafts_document_idx").on(t.documentId),
    index("drafts_status_idx").on(t.status),
    index("drafts_reviewer_idx").on(t.assignedReviewerId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    draftId: text("draft_id")
      .notNull()
      .references(() => drafts.id, { onDelete: "cascade" }),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => users.id),
    decision: text("decision").$type<ReviewDecision>().notNull(),
    comments: text("comments"),
    createdAt: createdAt(),
  },
  (t) => [
    index("reviews_draft_idx").on(t.draftId),
    index("reviews_reviewer_idx").on(t.reviewerId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  owner: one(users, { fields: [documents.ownerId], references: [users.id] }),
  analyses: many(analyses),
  drafts: many(drafts),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  document: one(documents, {
    fields: [analyses.documentId],
    references: [documents.id],
  }),
}));

export const draftsRelations = relations(drafts, ({ one, many }) => ({
  document: one(documents, {
    fields: [drafts.documentId],
    references: [documents.id],
  }),
  assignedReviewer: one(users, {
    fields: [drafts.assignedReviewerId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [drafts.createdById],
    references: [users.id],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  draft: one(drafts, { fields: [reviews.draftId], references: [drafts.id] }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Analysis = typeof analyses.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
export type Review = typeof reviews.$inferSelect;
