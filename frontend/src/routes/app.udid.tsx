import { createFileRoute } from "@tanstack/react-router";
import { UDIDWizard } from "@/components/udid-wizard";

export const Route = createFileRoute("/app/udid")({
  head: () => ({ meta: [{ title: "UDID Navigator — Udaan" }] }),
  component: UDIDPage,
});

function UDIDPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl md:text-4xl font-black">🆔 UDID Application Wizard</h1>
        <p className="text-muted-foreground">A guided, voice-friendly walk through your Unique Disability ID application.</p>
      </header>

      <UDIDWizard />
    </div>
  );
}
