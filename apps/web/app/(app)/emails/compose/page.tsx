import { ComposeForm } from "@/app/(modules)/emails/components/compose-form";

export default function ComposeEmailPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Compose email</h1>
        <p className="text-sm text-muted-foreground">Send a message via your connected mailbox.</p>
      </div>
      <ComposeForm />
    </div>
  );
}
