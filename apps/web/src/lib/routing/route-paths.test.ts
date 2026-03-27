import assert from "node:assert/strict";
import test from "node:test";
import { routePaths } from "./route-paths.js";

test("route paths are unique and stable", () => {
  const routeValues = Object.values(routePaths);

  assert.deepEqual(routePaths, {
    home: "/",
    signIn: "/sign-in",
    dashboard: "/dashboard",
  });
  assert.equal(new Set(routeValues).size, routeValues.length);
});

test("route paths always start with a slash", () => {
  for (const routeValue of Object.values(routePaths)) {
    assert.equal(routeValue.startsWith("/"), true);
  }
});
