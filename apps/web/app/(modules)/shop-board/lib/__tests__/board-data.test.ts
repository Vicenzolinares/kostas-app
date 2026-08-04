import { describe, expect, it } from "vitest";
import type { DepartmentSnapshot } from "@/app/(modules)/department-status/types";
import { deriveNotifications, toDepartmentBoard } from "../board-data";

type Stage = DepartmentSnapshot["stages"][number];

function stage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: "stage-1",
    projectId: "project-1",
    departmentId: "dept-1",
    status: "queued",
    assignedTo: null,
    notes: null,
    tasks: [],
    blockedReason: null,
    isRush: false,
    dueDate: null,
    startedAt: null,
    completedAt: null,
    updatedAt: new Date("2026-08-01T10:00:00Z"),
    projectName: "Test Project",
    clientName: "Test Client",
    ...overrides,
  } as Stage;
}

function snapshot(stages: Stage[]): DepartmentSnapshot {
  return {
    department: {
      id: "dept-1",
      key: "upholstery",
      name: "Upholstery Room",
      sortOrder: 2,
      capacityPerDay: 6,
      createdAt: new Date("2026-01-01T00:00:00Z"),
    },
    stages,
    counts: { queued: 0, in_progress: 0, blocked: 0, done: 0 },
    utilizationPct: 0,
  };
}

describe("toDepartmentBoard", () => {
  it("splits stages into the three board columns by status", () => {
    const board = toDepartmentBoard(
      snapshot([
        stage({ id: "a", status: "in_progress" }),
        stage({ id: "b", status: "queued" }),
        stage({ id: "c", status: "blocked" }),
        stage({ id: "d", status: "done" }),
      ]),
    );

    expect(board.workingNow.map((s) => s.id)).toEqual(["a"]);
    expect(board.upNext.map((s) => s.id)).toEqual(["b"]);
    expect(board.needsAttention.map((s) => s.id)).toEqual(["c"]);
    // Completed work is intentionally not a column on the TV.
    expect([
      ...board.workingNow,
      ...board.upNext,
      ...board.needsAttention,
    ]).toHaveLength(3);
  });

  it("puts rush jobs first, then orders by due date", () => {
    const board = toDepartmentBoard(
      snapshot([
        stage({
          id: "later",
          status: "in_progress",
          dueDate: new Date("2026-08-10"),
        }),
        stage({
          id: "rush",
          status: "in_progress",
          isRush: true,
          dueDate: new Date("2026-08-20"),
        }),
        stage({
          id: "sooner",
          status: "in_progress",
          dueDate: new Date("2026-08-02"),
        }),
      ]),
    );

    expect(board.workingNow.map((s) => s.id)).toEqual([
      "rush",
      "sooner",
      "later",
    ]);
  });

  it("sorts undated queued work last", () => {
    const board = toDepartmentBoard(
      snapshot([
        stage({ id: "undated", status: "queued", dueDate: null }),
        stage({
          id: "dated",
          status: "queued",
          dueDate: new Date("2026-08-05"),
        }),
      ]),
    );

    expect(board.upNext.map((s) => s.id)).toEqual(["dated", "undated"]);
  });

  it("computes per-card progress from its checklist", () => {
    const board = toDepartmentBoard(
      snapshot([
        stage({
          status: "in_progress",
          tasks: [
            { id: "1", en: "a", es: "a", done: true },
            { id: "2", en: "b", es: "b", done: true },
            { id: "3", en: "c", es: "c", done: false },
            { id: "4", en: "d", es: "d", done: false },
          ],
        }),
      ]),
    );

    expect(board.workingNow[0]?.progressPct).toBe(50);
  });

  it("counts department progress across in-progress work only", () => {
    const board = toDepartmentBoard(
      snapshot([
        stage({
          id: "working",
          status: "in_progress",
          tasks: [
            { id: "1", en: "a", es: "a", done: true },
            { id: "2", en: "b", es: "b", done: false },
          ],
        }),
        // Queued work has a checklist but hasn't started; including it would
        // drag every department's gauge toward zero.
        stage({
          id: "queued",
          status: "queued",
          tasks: [{ id: "3", en: "c", es: "c", done: false }],
        }),
      ]),
    );

    expect(board.tasksDone).toBe(1);
    expect(board.tasksTotal).toBe(2);
    expect(board.progressPct).toBe(50);
  });

  it("reports zero progress rather than NaN when nothing has a checklist", () => {
    const board = toDepartmentBoard(
      snapshot([stage({ status: "in_progress", tasks: [] })]),
    );

    expect(board.tasksTotal).toBe(0);
    expect(board.progressPct).toBe(0);
  });
});

describe("deriveNotifications", () => {
  it("returns newest activity first and respects the limit", () => {
    const board = {
      departments: [
        snapshot([
          stage({
            id: "old",
            status: "done",
            updatedAt: new Date("2026-08-01T09:00:00Z"),
          }),
          stage({
            id: "new",
            status: "blocked",
            updatedAt: new Date("2026-08-01T12:00:00Z"),
          }),
          stage({
            id: "mid",
            status: "queued",
            updatedAt: new Date("2026-08-01T10:00:00Z"),
          }),
        ]),
      ],
      generatedAt: "2026-08-01T12:00:00Z",
    };

    const notes = deriveNotifications(board, 2);
    expect(notes).toHaveLength(2);
    expect(notes[0]?.kind).toBe("blocked");
    expect(notes[1]?.kind).toBe("moved");
    // Room is carried as a key so the feed can render in either language.
    expect(notes[0]?.departmentKey).toBe("upholstery");
  });

  it("returns nothing when the board hasn't loaded", () => {
    expect(deriveNotifications(undefined)).toEqual([]);
  });
});
