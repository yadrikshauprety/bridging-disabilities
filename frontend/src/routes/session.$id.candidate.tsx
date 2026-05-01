import { createFileRoute } from "@tanstack/react-router";
import { CandidateWidget } from "@/features/interview-bridge/pages/CandidateWidget";

export const Route = createFileRoute("/session/$id/candidate")({
  component: CandidateRoute,
});

function CandidateRoute() {
  const { id } = Route.useParams();
  return <CandidateWidget sessionId={id} />;
}
