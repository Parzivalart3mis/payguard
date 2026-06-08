import { describe, expect, it } from "vitest";
import {
  canDecideReview,
  canReadDocument,
  canWriteDocument,
  isAdmin,
} from "@/lib/access";

const author = { id: "u1", role: "author" as const };
const other = { id: "u2", role: "author" as const };
const admin = { id: "u3", role: "admin" as const };
const docByAuthor = { ownerId: "u1" };

describe("access predicate", () => {
  it("isAdmin", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(author)).toBe(false);
  });

  it("owner can read and write their document", () => {
    expect(canReadDocument(author, docByAuthor, [])).toBe(true);
    expect(canWriteDocument(author, docByAuthor)).toBe(true);
  });

  it("a stranger cannot read or write", () => {
    expect(canReadDocument(other, docByAuthor, [])).toBe(false);
    expect(canWriteDocument(other, docByAuthor)).toBe(false);
  });

  it("an assigned reviewer can read but not write", () => {
    expect(canReadDocument(other, docByAuthor, ["u2"])).toBe(true);
    expect(canWriteDocument(other, docByAuthor)).toBe(false);
  });

  it("admin can read and write anything", () => {
    expect(canReadDocument(admin, docByAuthor, [])).toBe(true);
    expect(canWriteDocument(admin, docByAuthor)).toBe(true);
  });

  it("only the assigned reviewer or admin can decide a review", () => {
    expect(canDecideReview(other, { assignedReviewerId: "u2" })).toBe(true);
    expect(canDecideReview(other, { assignedReviewerId: "u9" })).toBe(false);
    expect(canDecideReview(other, { assignedReviewerId: null })).toBe(false);
    expect(canDecideReview(admin, { assignedReviewerId: null })).toBe(true);
  });
});
