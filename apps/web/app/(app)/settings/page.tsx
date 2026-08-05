import { Suspense } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { authProvider } from "@/lib/auth";
import {
  emailDemoMode,
  paymentsDemoMode,
  aiVisionDemoMode,
  DEMO_MODE_LABELS,
} from "@/lib/demo-mode";
import { NAV_ITEMS, navSectionsForRole } from "@/lib/nav";

/**
 * The deck lists Settings in the sidebar, so the entry needs somewhere real
 * to land. This shows only things the app actually knows: who is signed in,
 * what that role can reach, and which integrations are running against
 * stand-ins. No preference toggles — there are no stored preferences yet,
 * and switches that don't persist would be worse than none.
 */
async function SettingsSections() {
  const session = await authProvider.getSession();
  if (!session) return null;

  const modules = navSectionsForRole(session.user.role).flatMap((s) => s.items);
  const integrations = [
    {
      name: "Yahoo Mail",
      demo: emailDemoMode,
      label: DEMO_MODE_LABELS.email,
      live: "Connected — sending and syncing real mail",
    },
    {
      name: "Stripe",
      demo: paymentsDemoMode,
      label: DEMO_MODE_LABELS.payments,
      live: "Connected — collecting real payments",
    },
    {
      name: "AI Photo Search",
      demo: aiVisionDemoMode,
      label: DEMO_MODE_LABELS.aiVision,
      live: "Connected — embeddings and similarity search",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{session.user.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{session.user.email}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline" className="capitalize">
              {session.user.role.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Modules available</span>
            <span className="font-medium">
              {modules.length} of {NAV_ITEMS.length}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{integration.name}</span>
                <Badge
                  variant="outline"
                  className={
                    integration.demo
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  }
                >
                  {integration.demo ? "Demo" : "Live"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {integration.demo ? integration.label : integration.live}
              </p>
            </div>
          ))}
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Demo mode is derived from each provider&apos;s own credentials, not
            a toggle — supply the keys and these switch to live automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your account, and how this installation is wired up.
        </p>
      </div>
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading settings…</p>
        }
      >
        <SettingsSections />
      </Suspense>
    </div>
  );
}
