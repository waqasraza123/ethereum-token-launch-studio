# Phase 2 workspace and project flows

## Goal

Add server-side membership-aware workspace routes and the first protected project creation and read paths.

## What this step establishes

- root dashboard workspace selection behavior
- automatic redirect from `/dashboard` into the single authorized workspace
- server-side workspace membership guards by workspace slug
- first protected workspace dashboard route
- first protected project creation route
- first protected project detail route
- a role-aware database function for project creation
- replay validation for the project creation flow

## Assumptions

- `owner` and `ops_manager` can create projects
- `finance_manager` and `viewer` can read but cannot create
- workspace slugs are globally unique
- project slugs are unique within a workspace

## What is intentionally deferred

- RLS and policies
- project editing
- project deletion
- project settings beyond name, slug, and description
- project membership or assignees
- contract registry persistence
- project-level analytics

## Acceptance criteria for this step

- the root dashboard redirects into the single authorized workspace
- users with multiple workspaces see a workspace selector
- users without access cannot load another workspace’s route
- project creation is only available for owner and ops_manager roles
- project detail loads through a protected workspace-plus-project read path
- migration replay proves the `create_project` database function and its role checks

## Risks that remain

- RLS still does not enforce these rules inside the database for client-issued queries
- service-role-backed server reads still carry the authorization burden
- project editing and lifecycle management remain deferred
