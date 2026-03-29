import { z } from "zod";

export const ProjectTokenLaunchRetryInputSchema = z.object({
  currentProjectSlug: z.string().trim().min(1),
  requestId: z.string().uuid(),
  workspaceSlug: z.string().trim().min(1)
});

export type ProjectTokenLaunchRetryInput = Readonly<
  z.infer<typeof ProjectTokenLaunchRetryInputSchema>
>;

export const parseProjectTokenLaunchRetryFormData = (
  formData: FormData
): ProjectTokenLaunchRetryInput =>
  ProjectTokenLaunchRetryInputSchema.parse({
    currentProjectSlug: formData.get("currentProjectSlug"),
    requestId: formData.get("requestId"),
    workspaceSlug: formData.get("workspaceSlug")
  });
