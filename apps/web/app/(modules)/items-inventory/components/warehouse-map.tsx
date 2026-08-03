"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ItemInventory } from "../types";

const COLUMNS = 5;
const NODE_WIDTH = 140;
const NODE_HEIGHT = 70;

/**
 * A simple warehouse visualization: each distinct bin location present
 * on items becomes a node laid out in a grid, labeled with how many
 * SKUs and total units live there. This is a lightweight stand-in for
 * a real shelf/zone layout editor — good enough to see where stock is
 * concentrated at a glance.
 */
export function WarehouseMap({ items }: { items: ItemInventory[] }) {
  const { nodes, edges } = useMemo(() => {
    const byBin = new Map<string, ItemInventory[]>();
    for (const item of items) {
      const bin = item.binLocation ?? "Unassigned";
      const list = byBin.get(bin) ?? [];
      list.push(item);
      byBin.set(bin, list);
    }

    const bins = Array.from(byBin.keys()).sort();
    const flowNodes: Node[] = bins.map((bin, index) => {
      const binItems = byBin.get(bin) ?? [];
      const totalUnits = binItems.reduce((sum, item) => sum + item.quantity, 0);
      return {
        id: bin,
        position: {
          x: (index % COLUMNS) * (NODE_WIDTH + 24),
          y: Math.floor(index / COLUMNS) * (NODE_HEIGHT + 24),
        },
        data: { label: `${bin}\n${binItems.length} SKU · ${totalUnits} units` },
        style: {
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          whiteSpace: "pre-line" as const,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center" as const,
          fontSize: 12,
          borderRadius: 8,
        },
      };
    });

    return { nodes: flowNodes, edges: [] as Edge[] };
  }, [items]);

  return (
    <div
      className="h-[420px] w-full rounded-md border border-border"
      data-testid="warehouse-map"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
