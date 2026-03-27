import { z } from "zod";

const workspaceSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizeWorkspaceSlug = (rawValue: FormDataEntryValue | null): string => {
  if (typeof rawValue !== "string") {
    return "";
  }

  return rawValue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
};

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
