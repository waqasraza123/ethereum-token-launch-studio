import { z } from "zod";

export const ContractKindSchema = z.enum([
  "project_token",
  "token_sale",
  "claim_campaign_manager",
  "vesting_factory",
  "safe_treasury",
  "other"
]);

export const ContractDeploymentEnvironmentSchema = z.enum([
  "local",
  "testnet",
  "mainnet",
  "custom"
]);

const OptionalUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .transform((value) => (value === "" ? null : value))
  .refine((value) => value === null || /^https?:\/\//.test(value), {
    message: "Explorer URL must be a valid http or https URL."
  });

const OptionalNotesSchema = z
  .string()
  .trim()
  .max(5000)
  .transform((value) => (value === "" ? null : value));

export const normalizeContractAddress = (rawValue: FormDataEntryValue | null): string => {
  if (typeof rawValue !== "string") {
    return "";
  }

  return rawValue.trim().toLowerCase();
};

export const ContractAttachInputSchema = z.object({
  address: z.string().regex(/^0x[a-f0-9]{40}$/),
  chainId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  contractKind: ContractKindSchema,
  currentProjectSlug: z.string().trim().min(1),
  deploymentEnvironment: ContractDeploymentEnvironmentSchema,
  explorerUrl: OptionalUrlSchema,
  label: z.string().trim().min(1).max(120),
  notes: OptionalNotesSchema,
  workspaceSlug: z.string().trim().min(1)
});

export const ContractDetachInputSchema = z.object({
  currentProjectSlug: z.string().trim().min(1),
  projectContractId: z.string().uuid(),
  workspaceSlug: z.string().trim().min(1)
});

export type ContractAttachInput = Readonly<z.infer<typeof ContractAttachInputSchema>>;
export type ContractDetachInput = Readonly<z.infer<typeof ContractDetachInputSchema>>;

export const parseContractAttachFormData = (formData: FormData): ContractAttachInput =>
  ContractAttachInputSchema.parse({
    address: normalizeContractAddress(formData.get("address")),
    chainId: formData.get("chainId"),
    contractKind: formData.get("contractKind"),
    currentProjectSlug: formData.get("currentProjectSlug"),
    deploymentEnvironment: formData.get("deploymentEnvironment"),
    explorerUrl:
      typeof formData.get("explorerUrl") === "string" ? formData.get("explorerUrl") : "",
    label: formData.get("label"),
    notes: typeof formData.get("notes") === "string" ? formData.get("notes") : "",
    workspaceSlug: formData.get("workspaceSlug")
  });

export const parseContractDetachFormData = (formData: FormData): ContractDetachInput =>
  ContractDetachInputSchema.parse({
    currentProjectSlug: formData.get("currentProjectSlug"),
    projectContractId: formData.get("projectContractId"),
    workspaceSlug: formData.get("workspaceSlug")
  });
