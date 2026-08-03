"use client";

import { useState } from "react";
import { Button, Card, CardContent, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kostas/ui";
import { useWorkOrderWizard, type WizardFabricLine } from "../../hooks/use-work-order-wizard";
import type { FabricOption } from "../../types";

export function StepFabric({ fabrics }: { fabrics: FabricOption[] }) {
  const { fabrics: selected, setFabrics, next, back } = useWorkOrderWizard();
  const [fabricId, setFabricId] = useState("");
  const [yards, setYards] = useState("");

  function addLine() {
    if (!fabricId || !yards) return;
    const line: WizardFabricLine = { fabricId, yardsAllocated: Number(yards) };
    setFabrics([...selected, line]);
    setFabricId("");
    setYards("");
  }

  function removeLine(index: number) {
    setFabrics(selected.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <p className="text-sm text-muted-foreground">
          Select fabrics required for this work order (optional).
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fabricId">Fabric</Label>
            <Select value={fabricId} onValueChange={setFabricId}>
              <SelectTrigger id="fabricId" className="w-64">
                <SelectValue placeholder="Select a fabric" />
              </SelectTrigger>
              <SelectContent>
                {fabrics.map((fabric) => (
                  <SelectItem key={fabric.id} value={fabric.id}>
                    {fabric.name} ({fabric.fabricCode}) — {fabric.yardsInStock} yd in stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="yards">Yards</Label>
            <Input
              id="yards"
              type="number"
              step="0.1"
              className="w-28"
              value={yards}
              onChange={(e) => setYards(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" onClick={addLine} disabled={!fabricId || !yards}>
            Add fabric
          </Button>
        </div>

        {selected.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {selected.map((line, index) => {
              const fabric = fabrics.find((f) => f.id === line.fabricId);
              return (
                <li
                  key={`${line.fabricId}-${index}`}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {fabric?.name ?? "Unknown fabric"} — {line.yardsAllocated} yd
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(index)}>
                    Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={back}>
            Back
          </Button>
          <Button type="button" onClick={next}>
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
