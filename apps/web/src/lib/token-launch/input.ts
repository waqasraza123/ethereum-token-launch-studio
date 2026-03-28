import { z } from "zod";

const maxUint256 = (1n << 256n) - 1n;

const addressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/)
  .transform((value) => value.toLowerCase());

const uint256StringSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .refine((value) => BigInt(value) <= maxUint256);

export const ProjectTokenLaunchRequestInputSchema = z
  .object({
    adminAddress: addressSchema,
    cap: uint256StringSchema,
    currentProjectSlug: z.string().trim().min(1),
    initialRecipient: addressSchema,
    initialSupply: uint256StringSchema,
    mintAuthority: z
      .union([addressSchema, z.literal("")])
      .transform((value) => (value === "" ? null : value)),
    notes: z
      .string()
      .trim()
      .max(5000)
      .transform((value) => (value === "" ? null : value)),
    registryLabel: z.string().trim().min(1).max(120),
    tokenName: z.string().trim().min(1).max(120),
    tokenSymbol: z
      .string()
      .trim()
      .min(1)
      .max(12)
      .regex(/^[A-Z0-9]+$/),
    workspaceSlug: z.string().trim().min(1)
  })
  .superRefine((value, context) => {
    if (BigInt(value.initialSupply) > BigInt(value.cap)) {
      context.addIssue({
        code: "custom",
        message: "Initial supply cannot exceed cap.",
        path: ["initialSupply"]
      });
    }
  });

export type ProjectTokenLaunchRequestInput = Readonly<
  z.infer<typeof ProjectTokenLaunchRequestInputSchema>
>;

export const parseProjectTokenLaunchRequestFormData = (
  formData: FormData
): ProjectTokenLaunchRequestInput =>
  ProjectTokenLaunchRequestInputSchema.parse({
    adminAddress: formData.get("adminAddress"),
    cap: formData.get("cap"),
    currentProjectSlug: formData.get("currentProjectSlug"),
    initialRecipient: formData.get("initialRecipient"),
    initialSupply: formData.get("initialSupply"),
    mintAuthority:
      typeof formData.get("mintAuthority") === "string" ? formData.get("mintAuthority") : "",
    notes: typeof formData.get("notes") === "string" ? formData.get("notes") : "",
    registryLabel: formData.get("registryLabel"),
    tokenName: formData.get("tokenName"),
    tokenSymbol: formData.get("tokenSymbol"),
    workspaceSlug: formData.get("workspaceSlug")
  });
