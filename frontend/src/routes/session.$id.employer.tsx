import { createFileRoute } from "@tanstack/react-router";
import { EmployerCaptionView } from "@/features/interview-bridge/pages/EmployerCaptionView";

export const Route = createFileRoute("/session/$id/employer")({
  component: EmployerRoute,
});

function EmployerRoute() {
  const { id } = Route.useParams();
  return <EmployerCaptionView sessionId={id} />;
}
