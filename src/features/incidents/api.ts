import ky from "ky";

export type Incident = {
  id: string;
  title: string;
  severity: "SEV1" | "SEV2" | "SEV3";
  status: "OPEN" | "MITIGATING" | "RESOLVED";
  mttrMinutes: number;
};

export type MttrMetric = {
  averageMinutes: number;
  sampleSize: number;
};

export type DeployEvent = {
  id: string;
  serviceName: string;
  commitSha: string;
  imageTag: string;
  status: string;
  deployedAt: string;
};

export type DeployTarget = {
  id: string;
  serviceName: string;
  repositoryUrl: string;
  healthUrl: string;
  namespace: string;
  environment: string;
  runtimeStatus: "UP" | "DOWN" | "UNKNOWN";
  createdAt: string;
};

export type CreateDeployTarget = Omit<DeployTarget, "id" | "createdAt" | "runtimeStatus">;

export type RollbackCheck = {
  id: string;
  incidentId: string;
  item: string;
  checked: boolean;
};

const api = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  timeout: 8000,
});

export const incidentApi = {
  list: () => api.get("incidents").json<Incident[]>(),
  deployTargets: () => api.get("deploy-targets").json<DeployTarget[]>(),
  createDeployTarget: (target: CreateDeployTarget) =>
    api.post("deploy-targets", { json: target }).json<DeployTarget>(),
  deleteDeployTarget: (id: string) => api.delete(`deploy-targets/${id}`),
  deployEvents: () => api.get("deploy-events").json<DeployEvent[]>(),
  mttr: () => api.get("metrics/mttr").json<MttrMetric>(),
  rollbackChecks: (incidentId: string) => api.get(`incidents/${incidentId}/rollback-checks`).json<RollbackCheck[]>(),
  updateRollbackCheck: (id: string, checked: boolean) =>
    api.patch(`rollback-checks/${id}`, { json: { checked } }).json<RollbackCheck>(),
};
