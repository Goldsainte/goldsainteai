export default function HealthCheck() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div data-testid="health-check" className="text-lg font-semibold">
        OK
      </div>
    </main>
  );
}
