"use client";

import { useState, useTransition } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@kostas/ui";
import { createDesignCommentAction } from "../api/actions";

export function CommentEditor({ submissionId }: { submissionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none",
      },
    },
  });

  function handleSubmit() {
    if (!editor || editor.isEmpty) return;
    setError(null);
    const bodyJson = editor.getJSON() as JSONContent & { type: "doc" };

    startTransition(async () => {
      const result = await createDesignCommentAction({
        submissionId,
        bodyJson,
      });
      if (!result.success) {
        setError(result.error ?? "Failed to post comment.");
      } else {
        editor.commands.clearContent();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <EditorContent editor={editor} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div>
        <Button
          type="button"
          size="sm"
          disabled={pending || !editor}
          onClick={handleSubmit}
        >
          Post comment
        </Button>
      </div>
    </div>
  );
}
