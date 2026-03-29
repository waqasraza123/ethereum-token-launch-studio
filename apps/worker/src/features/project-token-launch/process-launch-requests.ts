import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { hostname, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { WorkerEnvironment } from "../../config/env.js";
import { createWorkerAdminSupabaseClient } from "../../lib/supabase/admin.js";

const ClaimedLaunchRequestSchema = z.object({
  request_id: z.string().uuid(),
  workspace_slug: z.string().min(1),
  project_slug: z.string().min(1),
  project_id: z.string().uuid(),
  registry_label: z.string().min(1),
  token_name: z.string().min(1),
  token_symbol: z.string().min(1),
  cap: z.string().regex(/^\d+$/),
  initial_supply: z.string().regex(/^\d+$/),
  admin_address: z.string().regex(/^0x[a-f0-9]{40}$/),
  initial_recipient: z.string().regex(/^0x[a-f0-9]{40}$/),
  mint_authority: z.union([z.string().regex(/^0x[a-f0-9]{40}$/), z.null()]),
  notes: z.union([z.string(), z.null()])
});

const DeploymentScriptResultSchema = z.object({
  address: z.string().regex(/^0x[a-f0-9]{40}$/),
  deploymentTxHash: z.string().regex(/^0x[a-f0-9]{64}$/),
  projectContractId: z.string().uuid(),
  projectId: z.string().uuid(),
  tokenName: z.string().min(1),
  tokenSymbol: z.string().min(1),
  verificationUrl: z.string().url()
});

const FailureOutcomeSchema = z.object({
  next_retry_at: z.union([z.string(), z.null()]),
  retry_count: z.number(),
  status: z.string()
});

const RecoveryOutcomeSchema = z.object({
  next_retry_at: z.union([z.string(), z.null()]),
  request_id: z.string().uuid(),
  retry_count: z.number(),
  status: z.string()
});

const StartedOutcomeSchema = z.object({
  project_id: z.string().uuid(),
  start_status: z.enum(["started", "cancelled"])
});

type ClaimedLaunchRequest = Readonly<z.infer<typeof ClaimedLaunchRequestSchema>>;
type DeploymentScriptResult = Readonly<z.infer<typeof DeploymentScriptResultSchema>>;
type FailureOutcome = Readonly<z.infer<typeof FailureOutcomeSchema>>;
type RecoveryOutcome = Readonly<z.infer<typeof RecoveryOutcomeSchema>>;
type StartedOutcome = Readonly<z.infer<typeof StartedOutcomeSchema>>;

const repoRoot = resolve(fileURLToPath(new URL("../../../../../", import.meta.url)));

const runDeploymentCommand = async (
  request: ClaimedLaunchRequest
): Promise<DeploymentScriptResult> => {
  const workingDirectory = await mkdtemp(join(tmpdir(), "project-token-launch-"));
  const configPath = join(workingDirectory, "deployment.json");
  const resultPath = join(workingDirectory, "deployment-result.json");

  try {
    await writeFile(
      configPath,
      JSON.stringify(
        {
          workspaceSlug: request.workspace_slug,
          projectSlug: request.project_slug,
          registryLabel: request.registry_label,
          tokenName: request.token_name,
          tokenSymbol: request.token_symbol,
          cap: request.cap,
          initialSupply: request.initial_supply,
          adminAddress: request.admin_address,
          initialRecipient: request.initial_recipient,
          mintAuthority: request.mint_authority,
          notes: request.notes
        },
        null,
        2
      ),
      "utf8"
    );

    const executable = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const commandArguments = [
      "--filter",
      "@token-launch-studio/contracts",
      "deploy:project-token",
      "--",
      "--config",
      configPath,
      "--result-file",
      resultPath
    ];

    await new Promise<void>((resolvePromise, rejectPromise) => {
      const child = spawn(executable, commandArguments, {
        cwd: repoRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });

      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });

      child.on("error", rejectPromise);

      child.on("close", (exitCode) => {
        if (exitCode === 0) {
          resolvePromise();
          return;
        }

        rejectPromise(
          new Error(
            `Project token deployment command failed with exit code ${String(exitCode)}.\n${[
              stdout.trim(),
              stderr.trim()
            ]
              .filter((value) => value !== "")
              .join("\n")}`
          )
        );
      });
    });

    const rawResult = await readFile(resultPath, "utf8");
    return DeploymentScriptResultSchema.parse(JSON.parse(rawResult) as unknown);
  } finally {
    await rm(workingDirectory, { force: true, recursive: true });
  }
};

export const startProjectTokenLaunchProcessor = async (
  environment: WorkerEnvironment
) => {
  const supabase = createWorkerAdminSupabaseClient(environment);
  const workerId = `${hostname()}:${process.pid}`;
  let running = false;

  const claimNextRequest = async (): Promise<ClaimedLaunchRequest | null> => {
    const { data, error } = await supabase.rpc("claim_next_project_token_launch_request", {
      p_worker_id: workerId
    });

    if (error) {
      throw new Error(`Could not claim the next project token launch request: ${error.message}`);
    }

    const row = (data as readonly unknown[] | null)?.[0];

    if (!row) {
      return null;
    }

    return ClaimedLaunchRequestSchema.parse(row);
  };

  const markStarted = async (requestId: string): Promise<StartedOutcome> => {
    const { data, error } = await supabase.rpc("mark_project_token_launch_request_started", {
      p_request_id: requestId,
      p_worker_id: workerId
    });

    if (error) {
      throw new Error(`Could not mark the launch request as started: ${error.message}`);
    }

    const row = (data as readonly unknown[] | null)?.[0];

    if (!row) {
      throw new Error("Launch request start outcome was not returned.");
    }

    return StartedOutcomeSchema.parse(row);
  };

  const touchHeartbeat = async (requestId: string) => {
    const { error } = await supabase.rpc("touch_project_token_launch_request_heartbeat", {
      p_request_id: requestId,
      p_worker_id: workerId
    });

    if (error) {
      throw new Error(`Could not update the launch request heartbeat: ${error.message}`);
    }
  };

  const markSucceeded = async (
    requestId: string,
    result: DeploymentScriptResult
  ) => {
    const { error } = await supabase.rpc("mark_project_token_launch_request_succeeded", {
      p_request_id: requestId,
      p_worker_id: workerId,
      p_project_contract_id: result.projectContractId,
      p_deployed_address: result.address,
      p_deployment_tx_hash: result.deploymentTxHash,
      p_verification_url: result.verificationUrl
    });

    if (error) {
      throw new Error(`Could not mark the launch request as succeeded: ${error.message}`);
    }
  };

  const markFailed = async (
    requestId: string,
    failureMessage: string
  ): Promise<FailureOutcome> => {
    const { data, error } = await supabase.rpc("mark_project_token_launch_request_failed", {
      p_request_id: requestId,
      p_worker_id: workerId,
      p_failure_message: failureMessage
    });

    if (error) {
      throw new Error(`Could not mark the launch request as failed: ${error.message}`);
    }

    const row = (data as readonly unknown[] | null)?.[0];

    if (!row) {
      throw new Error("Launch failure outcome was not returned.");
    }

    return FailureOutcomeSchema.parse(row);
  };

  const recoverStaleRequests = async (): Promise<readonly RecoveryOutcome[]> => {
    const staleBefore = new Date(Date.now() - environment.TOKEN_LAUNCH_STALE_AFTER_MS).toISOString();

    const { data, error } = await supabase.rpc("recover_stale_project_token_launch_requests", {
      p_recovered_by_worker_id: workerId,
      p_stale_before: staleBefore
    });

    if (error) {
      throw new Error(`Could not recover stale project token launch requests: ${error.message}`);
    }

    return ((data ?? []) as readonly unknown[]).map((row) =>
      RecoveryOutcomeSchema.parse(row)
    );
  };

  const withHeartbeat = async <T,>(
    requestId: string,
    task: () => Promise<T>
  ): Promise<T> => {
    await touchHeartbeat(requestId);

    const heartbeat = setInterval(() => {
      void touchHeartbeat(requestId).catch((error) => {
        console.error("project_token_launch_request.heartbeat_failed", {
          error: error instanceof Error ? error.message : String(error),
          requestId,
          workerId
        });
      });
    }, environment.TOKEN_LAUNCH_HEARTBEAT_INTERVAL_MS);

    try {
      return await task();
    } finally {
      clearInterval(heartbeat);
    }
  };

  const processOne = async (): Promise<boolean> => {
    const request = await claimNextRequest();

    if (!request) {
      return false;
    }

    try {
      const startedOutcome = await markStarted(request.request_id);

      if (startedOutcome.start_status === "cancelled") {
        console.info("project_token_launch_request.cancelled_before_start", {
          requestId: request.request_id,
          workerId
        });

        return true;
      }

      const result = await withHeartbeat(request.request_id, async () =>
        await runDeploymentCommand(request)
      );

      await markSucceeded(request.request_id, result);

      console.info("project_token_launch_request.succeeded", {
        address: result.address,
        projectContractId: result.projectContractId,
        requestId: request.request_id,
        workerId
      });
    } catch (error) {
      const failureMessage =
        error instanceof Error ? error.message : "Project token launch failed.";

      const failureOutcome = await markFailed(request.request_id, failureMessage);

      console.error("project_token_launch_request.failed", {
        failureMessage,
        nextRetryAt: failureOutcome.next_retry_at,
        requestId: request.request_id,
        retryCount: failureOutcome.retry_count,
        status: failureOutcome.status,
        workerId
      });
    }

    return true;
  };

  const tick = async () => {
    if (running) {
      return;
    }

    running = true;

    try {
      const recoveredRequests = await recoverStaleRequests();

      if (recoveredRequests.length > 0) {
        console.warn("project_token_launch_request.recovered", {
          recoveredRequests,
          workerId
        });
      }

      while (true) {
        const processed = await processOne();

        if (!processed) {
          break;
        }
      }
    } finally {
      running = false;
    }
  };

  const interval = setInterval(() => {
    void tick();
  }, environment.TOKEN_LAUNCH_POLL_INTERVAL_MS);

  await tick();

  return {
    stop: async () => {
      clearInterval(interval);
    },
    workerId
  };
};
