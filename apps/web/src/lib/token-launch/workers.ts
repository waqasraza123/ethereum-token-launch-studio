import type { ProjectTokenLaunchRequestOverview } from "./requests";

export type ProjectTokenLaunchWorkerStatusOverview = Readonly<{
  heartbeatAt: string | null;
  isHeartbeatStale: boolean;
  registryLabel: string;
  requestId: string;
  status: string;
  tokenSymbol: string;
  workerId: string;
}>;

const readMostRecentTimestamp = (request: ProjectTokenLaunchRequestOverview): number => {
  const candidate =
    request.heartbeatAt ??
    request.startedAt ??
    request.claimedAt ??
    request.failedAt ??
    request.completedAt ??
    request.createdAt;

  return new Date(candidate).getTime();
};

export const deriveProjectTokenLaunchWorkerStatuses = (
  requests: readonly ProjectTokenLaunchRequestOverview[],
  staleAfterMs: number,
  nowMs = Date.now()
): readonly ProjectTokenLaunchWorkerStatusOverview[] => {
  const latestByWorkerId = new Map<string, ProjectTokenLaunchRequestOverview>();

  for (const request of requests) {
    if (!request.workerId) {
      continue;
    }

    const existing = latestByWorkerId.get(request.workerId);

    if (!existing || readMostRecentTimestamp(request) > readMostRecentTimestamp(existing)) {
      latestByWorkerId.set(request.workerId, request);
    }
  }

  return Array.from(latestByWorkerId.entries())
    .map(([workerId, request]) => {
      const heartbeatMs = request.heartbeatAt ? new Date(request.heartbeatAt).getTime() : null;
      const isTrackedActiveStatus =
        request.status === "claimed" || request.status === "deploying";

      return {
        heartbeatAt: request.heartbeatAt,
        isHeartbeatStale:
          isTrackedActiveStatus && heartbeatMs !== null
            ? nowMs - heartbeatMs > staleAfterMs
            : false,
        registryLabel: request.registryLabel,
        requestId: request.id,
        status: request.status,
        tokenSymbol: request.tokenSymbol,
        workerId
      };
    })
    .sort((left, right) => {
      const leftValue = left.heartbeatAt ? new Date(left.heartbeatAt).getTime() : 0;
      const rightValue = right.heartbeatAt ? new Date(right.heartbeatAt).getTime() : 0;
      return rightValue - leftValue;
    });
};
