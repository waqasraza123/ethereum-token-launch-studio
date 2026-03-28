const encodePathSegment = (value: string): string => encodeURIComponent(value);

export const routePaths = {
  dashboard: "/dashboard",
  home: "/",
  signIn: "/sign-in",
} as const;

export const getWorkspaceDashboardPath = (workspaceSlug: string): string =>
  `${routePaths.dashboard}/${encodePathSegment(workspaceSlug)}`;

export const getWorkspaceProjectNewPath = (workspaceSlug: string): string =>
  `${getWorkspaceDashboardPath(workspaceSlug)}/projects/new`;

export const getWorkspaceProjectPath = (workspaceSlug: string, projectSlug: string): string =>
  `${getWorkspaceDashboardPath(workspaceSlug)}/projects/${encodePathSegment(projectSlug)}`;

export type AppRouteKey = keyof typeof routePaths;
