"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, Input, Label, Textarea } from "@kostas/ui";
import { workOrderSpecificationsSchema, type WorkOrderSpecifications } from "@kostas/shared/schemas";
import { useWorkOrderWizard } from "../../hooks/use-work-order-wizard";

export function StepSpecifications() {
  const { specifications, setSpecifications, next, back } = useWorkOrderWizard();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkOrderSpecifications>({
    resolver: zodResolver(workOrderSpecificationsSchema),
    defaultValues: {
      ...specifications,
      furniturePieces: specifications.furniturePieces ?? [],
    },
  });

  function onSubmit(values: WorkOrderSpecifications) {
    setSpecifications(values);
    next();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="furniturePieces">Furniture pieces (comma-separated)</Label>
            <Input
              id="furniturePieces"
              placeholder="Sofa, Loveseat, Ottoman"
              defaultValue={specifications.furniturePieces?.join(", ")}
              onChange={(e) => {
                const pieces = e.target.value
                  .split(",")
                  .map((p) => p.trim())
                  .filter(Boolean);
                setSpecifications({ ...specifications, furniturePieces: pieces });
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="constructionNotes">Construction notes</Label>
            <Textarea id="constructionNotes" rows={4} {...register("constructionNotes")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="specialInstructions">Special instructions</Label>
            <Textarea id="specialInstructions" rows={3} {...register("specialInstructions")} />
            {errors.specialInstructions ? (
              <p className="text-xs text-destructive">{errors.specialInstructions.message}</p>
            ) : null}
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={back}>
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
