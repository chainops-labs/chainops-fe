import ky from "ky";

export type Incident = {
  id: string;
  title: string;
  severity: "SEV1" | "SEV2" | "SEV3";
  status: "OPEN" | "MITIGATING" | "RESOLVED";
  mttrMinutes: number;
};

const api = ky.create({
  prefix: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  timeout: 8000,
});

export const incidentApi = {
  list: () => api.get("incidents").json<Incident[]>(),
};
