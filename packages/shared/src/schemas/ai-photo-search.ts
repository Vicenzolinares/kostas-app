import { z } from "zod";

export const photoSearchStatusValues = [
  "pending",
  "matched",
  "no_match",
  "confirmed",
  "rejected",
] as const;
export const photoSearchStatusSchema = z.enum(photoSearchStatusValues);
export type PhotoSearchStatus = z.infer<typeof photoSearchStatusSchema>;

// A single ranked candidate returned by the pgvector similarity search,
// shown to the user in the manual-review step.
export const photoMatchCandidateSchema = z.object({
  referenceId: z.string().uuid(),
  label: z.string().nullable(),
  storageKey: z.string(),
  itemId: z.string().uuid().nullable(),
  fabricId: z.string().uuid().nullable(),
  similarity: z.number().min(0).max(1),
});
export type PhotoMatchCandidate = z.infer<typeof photoMatchCandidateSchema>;

// Submitted by the upload dropzone. The actual file goes through the
// StorageProvider first; this schema just carries the resulting key plus
// content-type so the server action can validate before calling the
// AIVisionProvider.
export const uploadPhotoSearchSchema = z.object({
  storageKey: z.string().min(1),
  contentType: z.string().min(1),
});
export type UploadPhotoSearchInput = z.infer<typeof uploadPhotoSearchSchema>;

export const confirmPhotoMatchSchema = z.object({
  searchId: z.string().uuid(),
  referenceId: z.string().uuid().nullable(), // null = "no match, reject"
});
export type ConfirmPhotoMatchInput = z.infer<typeof confirmPhotoMatchSchema>;

export const createPhotoReferenceSchema = z
  .object({
    storageKey: z.string().min(1),
    itemId: z.string().uuid().optional().nullable(),
    fabricId: z.string().uuid().optional().nullable(),
    label: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .refine((data) => Boolean(data.itemId) || Boolean(data.fabricId), {
    message: "Link the reference photo to an item or a fabric",
    path: ["itemId"],
  });
export type CreatePhotoReferenceInput = z.infer<typeof createPhotoReferenceSchema>;
