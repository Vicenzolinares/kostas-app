"use client";

import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kostas/ui";
import { workOrderStatusValues, type WorkOrderStatus } from "@kostas/shared/schemas";
import { updateWorkOrderStatusAction } from "../api/actions";
import { WORK_ORDER_STATUS_LABEL } from "./status-badge";

export function StatusControl({ id, status }: { id: string; status: WorkOrderStatus }) {
  const [pending, startTransition] = useTransition();

  function handleChange(value: string) {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", value);
    startTransition(async () => {
      await updateWorkOrderStatusAction({ success: false }, formData);
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {workOrderStatusValues.map((value) => (
          <SelectItem key={value} value={value}>
            {WORK_ORDER_STATUS_LABEL[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
