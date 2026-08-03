import { describe, expect, it } from "vitest";
import {
  createDesignSubmissionSchema,
  transitionDesignSubmissionSchema,
  designCommentBodySchema,
} from "../design-submission";

describe("createDesignSubmissionSchema", () => {
  it("accepts a minimal valid submission", () => {
    const result = createDesignSubmissionSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Living room sofa design",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fileKeys).toEqual([]);
    }
  });

  it("rejects an empty title", () => {
    const result = createDesignSubmissionSchema.safeParse({
      projectId: "123e4567-e89b-12d3-a456-426614174000",
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid projectId", () => {
    const result = createDesignSubmissionSchema.safeParse({
      projectId: "not-a-uuid",
      title: "Design",
    });
    expect(result.success).toBe(false);
  });
});

describe("transitionDesignSubmissionSchema", () => {
  it("accepts a known event name", () => {
    const result = transitionDesignSubmissionSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      event: "SUBMIT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown event name", () => {
    const result = transitionDesignSubmissionSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      event: "SKIP_TO_END",
    });
    expect(result.success).toBe(false);
  });
});

describe("designCommentBodySchema", () => {
  it("accepts a ProseMirror-shaped doc", () => {
    const result = designCommentBodySchema.safeParse({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Looks great" }] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-doc type", () => {
    const result = designCommentBodySchema.safeParse({
      type: "paragraph",
      content: [],
    });
    expect(result.success).toBe(false);
  });
});
