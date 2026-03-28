import type { ProjectActivityOverview } from "@/lib/activity";

type ProjectActivityFeedProps = Readonly<{
  activities: readonly ProjectActivityOverview[];
}>;

const readText = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const describeActivity = (activity: ProjectActivityOverview): string => {
  const label = readText(activity.metadata.label);
  const tokenSymbol = readText(activity.metadata.tokenSymbol);
  const address = readText(activity.metadata.address);
  const txHash = readText(activity.metadata.deploymentTxHash);
  const failureMessage = readText(activity.metadata.failureMessage);

  switch (activity.activityKind) {
    case "project_token_launch_requested":
      return `Token launch requested for ${label ?? "project token"}${tokenSymbol ? ` (${tokenSymbol})` : ""}.`;
    case "project_token_launch_claimed":
      return "Worker claimed the token launch request.";
    case "project_token_launch_started":
      return "Worker started the token deployment run.";
    case "project_token_deployed":
      return `Token deployment completed${address ? ` at ${address}` : ""}${txHash ? ` with tx ${txHash}` : ""}.`;
    case "project_token_launch_failed":
      return `Token launch failed${failureMessage ? `: ${failureMessage}` : "."}`;
    default:
      return activity.activityKind;
  }
};

export function ProjectActivityFeed({ activities }: ProjectActivityFeedProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Project activity</h2>
      <p className="placeholder-panel-description">
        This is the normalized project feed for launch workflow activity.
      </p>
      {activities.length === 0 ? (
        <p className="placeholder-panel-description">No project activity exists yet.</p>
      ) : (
        <ul className="dashboard-list">
          {activities.map((activity) => (
            <li className="dashboard-list-item" key={activity.id}>
              <h3 className="dashboard-list-title">{describeActivity(activity)}</h3>
              <p className="dashboard-list-meta">Actor type: {activity.actorType}</p>
              <p className="dashboard-list-meta">Created at: {activity.createdAt}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
