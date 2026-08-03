"use client";

import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import type { DesignSubmissionWithComments } from "../types";

/** Renders stored ProseMirror JSON (TipTap's document format) back to read-only HTML. */
export function CommentList({
  comments,
}: {
  comments: DesignSubmissionWithComments["comments"];
}) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-md border border-border p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{comment.authorName ?? "Unknown"}</span>
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          <div
            className="prose prose-sm max-w-none"
            // eslint-disable-next-line react/no-danger -- server-validated ProseMirror JSON rendered via TipTap's own generateHTML
            dangerouslySetInnerHTML={{
              __html: generateHTML(comment.bodyJson as object, [StarterKit]),
            }}
          />
        </li>
      ))}
    </ul>
  );
}
