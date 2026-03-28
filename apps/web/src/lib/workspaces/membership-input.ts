import { z } from "zod";
import { WorkspaceRoleSchema } from "./access";

const UuidSchema = z.string().uuid();

export const WorkspaceMemberInviteInputSchema = z.object({
  memberEmail: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: WorkspaceRoleSchema,
  workspaceSlug: z.string().trim().min(1)
});

export const WorkspaceMemberRoleUpdateInputSchema = z.object({
  role: WorkspaceRoleSchema,
  workspaceMemberId: UuidSchema,
  workspaceSlug: z.string().trim().min(1)
});

export const WorkspaceMemberRemovalInputSchema = z.object({
  targetAuthUserId: UuidSchema,
  workspaceMemberId: UuidSchema,
  workspaceSlug: z.string().trim().min(1)
});

export type WorkspaceMemberInviteInput = Readonly<
  z.infer<typeof WorkspaceMemberInviteInputSchema>
>;

export type WorkspaceMemberRoleUpdateInput = Readonly<
  z.infer<typeof WorkspaceMemberRoleUpdateInputSchema>
>;

export type WorkspaceMemberRemovalInput = Readonly<
  z.infer<typeof WorkspaceMemberRemovalInputSchema>
>;

export const parseWorkspaceMemberInviteFormData = (
  formData: FormData
): WorkspaceMemberInviteInput =>
  WorkspaceMemberInviteInputSchema.parse({
    memberEmail: formData.get("memberEmail"),
    role: formData.get("role"),
    workspaceSlug: formData.get("workspaceSlug")
  });

export const parseWorkspaceMemberRoleUpdateFormData = (
  formData: FormData
): WorkspaceMemberRoleUpdateInput =>
  WorkspaceMemberRoleUpdateInputSchema.parse({
    role: formData.get("role"),
    workspaceMemberId: formData.get("workspaceMemberId"),
    workspaceSlug: formData.get("workspaceSlug")
  });

export const parseWorkspaceMemberRemovalFormData = (
  formData: FormData
): WorkspaceMemberRemovalInput =>
  WorkspaceMemberRemovalInputSchema.parse({
    targetAuthUserId: formData.get("targetAuthUserId"),
    workspaceMemberId: formData.get("workspaceMemberId"),
    workspaceSlug: formData.get("workspaceSlug")
  });
