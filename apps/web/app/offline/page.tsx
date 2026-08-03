export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        This page isn&apos;t cached yet. Actions you take in the Employee Portal are queued and
        will sync automatically once you&apos;re back online.
      </p>
    </div>
  );
}
