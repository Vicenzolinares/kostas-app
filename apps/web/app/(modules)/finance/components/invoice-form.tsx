"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, Input, Label, Textarea } from "@kostas/ui";
import { createInvoiceSchema, type CreateInvoiceInput } from "@kostas/shared/schemas";
import { createInvoiceAction } from "../api/actions";

export function InvoiceForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      clientName: "",
      taxRate: 0,
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const lineItems = watch("lineItems");
  const taxRate = watch("taxRate") ?? 0;

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const taxAmount = subtotal * (taxRate || 0);
  const total = subtotal + taxAmount;

  function onSubmit(values: CreateInvoiceInput) {
    setError(null);
    startTransition(async () => {
      const result = await createInvoiceAction(values);
      if (result.success && result.invoiceId) {
        router.push(`/finance/invoices/${result.invoiceId}`);
      } else {
        setError(result.error ?? "Please check the form for errors.");
      }
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientName">Client name</Label>
              <Input id="clientName" {...register("clientName")} />
              {errors.clientName ? (
                <p className="text-xs text-destructive">{errors.clientName.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="clientEmail">Client email</Label>
              <Input id="clientEmail" type="email" {...register("clientEmail")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="taxRate">Tax rate (e.g. 0.0825 for 8.25%)</Label>
              <Input id="taxRate" type="number" step="0.0001" {...register("taxRate")} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Line items</Label>
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_100px_120px_auto] items-end gap-2">
                  <div>
                    {index === 0 ? <Label className="text-xs">Description</Label> : null}
                    <Input {...register(`lineItems.${index}.description`)} />
                  </div>
                  <div>
                    {index === 0 ? <Label className="text-xs">Qty</Label> : null}
                    <Input type="number" step="0.01" {...register(`lineItems.${index}.quantity`)} />
                  </div>
                  <div>
                    {index === 0 ? <Label className="text-xs">Unit price</Label> : null}
                    <Input type="number" step="0.01" {...register(`lineItems.${index}.unitPrice`)} />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            {errors.lineItems?.message ? (
              <p className="text-xs text-destructive">{errors.lineItems.message}</p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
            >
              Add line item
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <div className="flex flex-col items-end gap-1 text-sm">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>Tax: ${taxAmount.toFixed(2)}</p>
            <p className="font-medium">Total: ${total.toFixed(2)}</p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create invoice"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
