import { z } from "zod";
import { normalizeAppSlug } from "@/lib/slugs";

const projectSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizeProjectSlug = (rawValue: FormDataEntryValue | null): string =>
  normalizeAppSlug(rawValue);

export const ProjectCreateInputSchema = z.object({
  projectDescription: z
    .string()
    .trim()
    .max(5000)
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  projectName: z.string().trim().min(1).max(160),
  projectSlug: z.string().trim().min(3).max(63).regex(projectSlugPattern),
  workspaceSlug: z.string().trim().min(1),
});

export type ProjectCreateInput = Readonly<z.infer<typeof ProjectCreateInputSchema>>;

export const parseProjectCreateFormData = (formData: FormData): ProjectCreateInput =>
  ProjectCreateInputSchema.parse({
    projectDescription:
      typeof formData.get("projectDescription") === "string"
        ? formData.get("projectDescription")
        : "",
    projectName: formData.get("projectName"),
    projectSlug: normalizeProjectSlug(formData.get("projectSlug")),
    workspaceSlug: formData.get("workspaceSlug"),
  });
