import { z } from "zod";
import { normalizeAppSlug } from "@/lib/slugs";

const workspaceSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizeWorkspaceSlug = (rawValue: FormDataEntryValue | null): string =>
  normalizeAppSlug(rawValue);

export const WorkspaceBootstrapInputSchema = z.object({
  workspaceName: z.string().trim().min(1).max(120),
  workspaceSlug: z.string().trim().min(3).max(63).regex(workspaceSlugPattern),
});

export type WorkspaceBootstrapInput = Readonly<z.infer<typeof WorkspaceBootstrapInputSchema>>;

export const parseWorkspaceBootstrapFormData = (formData: FormData): WorkspaceBootstrapInput =>
  WorkspaceBootstrapInputSchema.parse({
    workspaceName: formData.get("workspaceName"),
    workspaceSlug: normalizeWorkspaceSlug(formData.get("workspaceSlug")),
  });
