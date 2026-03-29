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
  const nextRetryAt = readText(activity.metadata.nextRetryAt);
  const staleWorkerId = readText(activity.metadata.staleWorkerId);
  const workerId = readText(activity.metadata.workerId);

  switch (activity.activityKind) {
    case "project_token_launch_requested":
      return `Token launch requested for ${label ?? "project token"}${tokenSymbol ? ` (${tokenSymbol})` : ""}.`;
    case "project_token_launch_claimed":
      return `Worker claimed the token launch request${workerId ? ` as ${workerId}` : ""}.`;
    case "project_token_launch_started":
      return "Worker started the token deployment run.";
    case "project_token_deployed":
      return `Token deployment completed${address ? ` at ${address}` : ""}${txHash ? ` with tx ${txHash}` : ""}.`;
    case "project_token_launch_retry_scheduled":
      return `Token launch failed and a retry was scheduled${nextRetryAt ? ` for ${nextRetryAt}` : ""}${failureMessage ? `: ${failureMessage}` : "."}`;
    case "project_token_launch_recovered":
      return `Stale launch request recovered${staleWorkerId ? ` from ${staleWorkerId}` : ""}${nextRetryAt ? ` and rescheduled for ${nextRetryAt}` : "."}`;
    case "project_token_launch_retry_requested":
      return "Operator manually retried a failed token launch request.";
    case "project_token_launch_failed":
      return `Token launch failed${failureMessage ? `: ${failureMessage}` : "."}`;
    case "project_token_launch_cancelled":
      return "Operator cancelled the launch request.";
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
              {activity.workerId ? (
                <p className="dashboard-list-meta">Worker: {activity.workerId}</p>
              ) : null}
              <p className="dashboard-list-meta">Created at: {activity.createdAt}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
