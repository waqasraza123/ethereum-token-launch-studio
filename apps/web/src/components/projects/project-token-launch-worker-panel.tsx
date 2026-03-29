import type { ProjectTokenLaunchWorkerStatusOverview } from "@/lib/token-launch/workers";

type ProjectTokenLaunchWorkerPanelProps = Readonly<{
  workerStatuses: readonly ProjectTokenLaunchWorkerStatusOverview[];
}>;

export function ProjectTokenLaunchWorkerPanel({
  workerStatuses
}: ProjectTokenLaunchWorkerPanelProps) {
  return (
    <section className="placeholder-panel">
      <h2 className="placeholder-panel-title">Worker heartbeat</h2>
      <p className="placeholder-panel-description">
        This panel shows the latest project-scoped worker heartbeat and ownership state derived from launch requests.
      </p>
      {workerStatuses.length === 0 ? (
        <p className="placeholder-panel-description">
          No worker has touched a launch request for this project yet.
        </p>
      ) : (
        <ul className="dashboard-list">
          {workerStatuses.map((workerStatus) => (
            <li className="dashboard-list-item" key={workerStatus.workerId}>
              <h3 className="dashboard-list-title">{workerStatus.workerId}</h3>
              <p className="dashboard-list-meta">Request: {workerStatus.requestId}</p>
              <p className="dashboard-list-meta">
                Launch: {workerStatus.registryLabel} ({workerStatus.tokenSymbol})
              </p>
              <p className="dashboard-list-meta">Status: {workerStatus.status}</p>
              <p className="dashboard-list-meta">
                Heartbeat: {workerStatus.heartbeatAt ?? "No heartbeat yet"}
              </p>
              <p className="dashboard-list-meta">
                Heartbeat state: {workerStatus.isHeartbeatStale ? "stale" : "healthy"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
