import { z } from "zod";
import { normalizeAppSlug } from "@/lib/slugs";

const projectSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ProjectNameSchema = z.string().trim().min(1).max(160);
const ProjectSlugSchema = z.string().trim().min(3).max(63).regex(projectSlugPattern);
const ProjectDescriptionSchema = z
  .string()
  .trim()
  .max(5000)
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const normalizeProjectSlug = (rawValue: FormDataEntryValue | null): string =>
  normalizeAppSlug(rawValue);

export const ProjectCreateInputSchema = z.object({
  projectDescription: ProjectDescriptionSchema,
  projectName: ProjectNameSchema,
  projectSlug: ProjectSlugSchema,
  workspaceSlug: z.string().trim().min(1)
});

export const ProjectUpdateInputSchema = z.object({
  currentProjectSlug: z.string().trim().min(1),
  projectDescription: ProjectDescriptionSchema,
  projectName: ProjectNameSchema,
  projectSlug: ProjectSlugSchema,
  workspaceSlug: z.string().trim().min(1)
});

export const ProjectDeleteInputSchema = z.object({
  currentProjectSlug: z.string().trim().min(1),
  workspaceSlug: z.string().trim().min(1)
});

export type ProjectCreateInput = Readonly<z.infer<typeof ProjectCreateInputSchema>>;
export type ProjectUpdateInput = Readonly<z.infer<typeof ProjectUpdateInputSchema>>;
export type ProjectDeleteInput = Readonly<z.infer<typeof ProjectDeleteInputSchema>>;

export const parseProjectCreateFormData = (formData: FormData): ProjectCreateInput =>
  ProjectCreateInputSchema.parse({
    projectDescription:
      typeof formData.get("projectDescription") === "string"
        ? formData.get("projectDescription")
        : "",
    projectName: formData.get("projectName"),
    projectSlug: normalizeProjectSlug(formData.get("projectSlug")),
    workspaceSlug: formData.get("workspaceSlug")
  });

export const parseProjectUpdateFormData = (formData: FormData): ProjectUpdateInput =>
  ProjectUpdateInputSchema.parse({
    currentProjectSlug: formData.get("currentProjectSlug"),
    projectDescription:
      typeof formData.get("projectDescription") === "string"
        ? formData.get("projectDescription")
        : "",
    projectName: formData.get("projectName"),
    projectSlug: normalizeProjectSlug(formData.get("projectSlug")),
    workspaceSlug: formData.get("workspaceSlug")
  });

export const parseProjectDeleteFormData = (formData: FormData): ProjectDeleteInput =>
  ProjectDeleteInputSchema.parse({
    currentProjectSlug: formData.get("currentProjectSlug"),
    workspaceSlug: formData.get("workspaceSlug")
  });
