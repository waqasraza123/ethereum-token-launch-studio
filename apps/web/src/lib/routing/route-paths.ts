export const routePaths = {
  home: "/",
  signIn: "/sign-in",
  dashboard: "/dashboard",
} as const;

export type AppRouteKey = keyof typeof routePaths;
