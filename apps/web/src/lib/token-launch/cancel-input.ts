import { z } from "zod";

export const ProjectTokenLaunchCancelInputSchema = z.object({
  currentProjectSlug: z.string().trim().min(1),
  requestId: z.string().uuid(),
  workspaceSlug: z.string().trim().min(1)
});

export type ProjectTokenLaunchCancelInput = Readonly<
  z.infer<typeof ProjectTokenLaunchCancelInputSchema>
>;

export const parseProjectTokenLaunchCancelFormData = (
  formData: FormData
): ProjectTokenLaunchCancelInput =>
  ProjectTokenLaunchCancelInputSchema.parse({
    currentProjectSlug: formData.get("currentProjectSlug"),
    requestId: formData.get("requestId"),
    workspaceSlug: formData.get("workspaceSlug")
  });
