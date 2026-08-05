"use client";

import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@kostas/ui";
import { SubmissionStatusBadge } from "./submission-status-badge";
import type { DesignSubmissionListItem } from "../types";

export function SubmissionsTable({
  submissions,
}: {
  submissions: DesignSubmissionListItem[];
}) {
  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No design submissions yet.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Client / Designer</TableHead>
            <TableHead>Submission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id} data-testid="submission-row">
              <TableCell>
                <Link
                  href={`/designer-portal/${submission.id}`}
                  className="font-medium hover:underline"
                >
                  {submission.projectName}
                </Link>
              </TableCell>
              <TableCell>
                <span className="block">{submission.clientName ?? "—"}</span>
                <span className="block text-xs text-muted-foreground">
                  {submission.designerName ?? "Unassigned"}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {submission.title}
              </TableCell>
              <TableCell>
                <SubmissionStatusBadge status={submission.status} />
              </TableCell>
              <TableCell>
                {new Date(submission.updatedAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
