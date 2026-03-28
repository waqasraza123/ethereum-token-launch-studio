import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
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

export const ProjectTokenDeploymentConfigSchema = z
  .object({
    adminAddress: addressSchema,
    cap: uint256StringSchema,
    initialRecipient: addressSchema,
    initialSupply: uint256StringSchema,
    mintAuthority: z
      .union([addressSchema, z.null()])
      .optional()
      .transform((value) => value ?? null),
    notes: z
      .string()
      .trim()
      .max(5000)
      .optional()
      .transform((value) => (value && value !== "" ? value : null)),
    projectSlug: z.string().trim().min(1).max(63),
    registryLabel: z.string().trim().min(1).max(120),
    tokenName: z.string().trim().min(1).max(120),
    tokenSymbol: z.string().trim().min(1).max(12).regex(/^[A-Z0-9]+$/),
    workspaceSlug: z.string().trim().min(1).max(63)
  })
  .superRefine((value, context) => {
    if (BigInt(value.initialSupply) > BigInt(value.cap)) {
      context.addIssue({
        code: "custom",
        message: "initialSupply cannot exceed cap.",
        path: ["initialSupply"]
      });
    }
  });

export type ProjectTokenDeploymentConfig = Readonly<
  z.infer<typeof ProjectTokenDeploymentConfigSchema>
>;

const readFlagValue = (flagName: string, argv: readonly string[] = process.argv): string | null => {
  const flagIndex = argv.indexOf(flagName);

  if (flagIndex === -1) {
    return null;
  }

  const nextValue = argv[flagIndex + 1];

  if (!nextValue) {
    throw new Error(`Missing value for ${flagName}.`);
  }

  return nextValue;
};

export const getProjectTokenDeploymentConfigPathFromArgv = (
  argv: readonly string[] = process.argv
): string => {
  const configPath = readFlagValue("--config", argv);

  if (!configPath) {
    throw new Error("Missing required --config <path> argument.");
  }

  return configPath;
};

export const getOptionalProjectTokenDeploymentResultPathFromArgv = (
  argv: readonly string[] = process.argv
): string | null => readFlagValue("--result-file", argv);

export const readProjectTokenDeploymentConfig = async (
  configPath: string
): Promise<ProjectTokenDeploymentConfig> => {
  const rawContent = await readFile(resolve(configPath), "utf8");
  const parsedContent = JSON.parse(rawContent) as unknown;
  return ProjectTokenDeploymentConfigSchema.parse(parsedContent);
};
