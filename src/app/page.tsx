"use client";

import { useEffect, useMemo, useState } from "react";

import { DeployEvent, Incident, incidentApi, RollbackCheck } from "@/features/incidents";

const fallbackIncidents: Incident[] = [
  {
    id: "7b5d3f71-6b51-4cc8-a4db-cc8aa6210031",
    title: "Verifier API latency after deploy",
    severity: "SEV2",
    status: "MITIGATING",
    mttrMinutes: 18,
  },
  {
    id: "4fc14c36-c4b1-4499-8a1b-a1bb10e31241",
    title: "Argo CD sync drift",
    severity: "SEV3",
    status: "RESOLVED",
    mttrMinutes: 9,
  },
];

const fallbackDeployEvents: DeployEvent[] = [
  {
    id: "deploy-42",
    serviceName: "verifier-api",
    commitSha: "8f3a2c1",
    imageTag: "verifier-api:2026.07.08",
    status: "SYNCED",
    deployedAt: "2026-07-08T09:58:00Z",
  },
];

const fallbackRollbackChecks: RollbackCheck[] = [
  {
    id: "rb-local-1",
    incidentId: fallbackIncidents[0].id,
    item: "직전 정상 image tag 확인",
    checked: true,
  },
  {
    id: "rb-local-2",
    incidentId: fallbackIncidents[0].id,
    item: "Argo CD sync 상태 확인",
    checked: false,
  },
  {
    id: "rb-local-3",
    incidentId: fallbackIncidents[0].id,
    item: "ELK trace link로 에러 범위 확인",
    checked: false,
  },
];

const Home = () => {
  const [incidents, setIncidents] = useState<Incident[]>(fallbackIncidents);
  const [deployEvents, setDeployEvents] = useState<DeployEvent[]>(fallbackDeployEvents);
  const [rollbackChecks, setRollbackChecks] = useState<RollbackCheck[]>(fallbackRollbackChecks);
  const [averageMttr, setAverageMttr] = useState(14);

  const activeIncident = incidents[0];
  const completion = useMemo(() => {
    const checked = rollbackChecks.filter((item) => item.checked).length;
    return `${checked}/${rollbackChecks.length}`;
  }, [rollbackChecks]);

  useEffect(() => {
    const load = async () => {
      const loadedIncidents = await incidentApi.list().catch(() => fallbackIncidents);
      setIncidents(loadedIncidents);
      setDeployEvents(await incidentApi.deployEvents().catch(() => fallbackDeployEvents));
      const metric = await incidentApi.mttr().catch(() => ({ averageMinutes: 14, sampleSize: 2 }));
      setAverageMttr(Math.round(metric.averageMinutes));
      const incidentId = loadedIncidents[0]?.id ?? fallbackIncidents[0].id;
      setRollbackChecks(await incidentApi.rollbackChecks(incidentId).catch(() => fallbackRollbackChecks));
    };

    void load();
  }, []);

  const toggleRollbackCheck = async (check: RollbackCheck) => {
    const updated = await incidentApi.updateRollbackCheck(check.id, !check.checked).catch(() => ({
      ...check,
      checked: !check.checked,
    }));

    setRollbackChecks((items) => items.map((item) => item.id === updated.id ? updated : item));
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">GitOps incident operations</p>
        <h1 className="text-4xl font-semibold">ChainOps deployment and MTTR console</h1>
        <p className="max-w-2xl text-zinc-700">
          배포 이력, 장애 상태, rollback checklist, MTTR 지표를 연결해 운영자가 복구 판단을 이어갈 수 있게 한다.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border p-5">
          <p className="text-sm text-zinc-600">Average MTTR</p>
          <strong className="text-3xl">{averageMttr}m</strong>
        </article>
        <article className="rounded-lg border p-5">
          <p className="text-sm text-zinc-600">Latest deploy</p>
          <strong className="text-3xl">{deployEvents[0]?.status ?? "UNKNOWN"}</strong>
        </article>
        <article className="rounded-lg border p-5">
          <p className="text-sm text-zinc-600">Rollback checks</p>
          <strong className="text-3xl">{completion}</strong>
        </article>
      </div>

      <section className="rounded-lg border">
        <div className="border-b bg-zinc-50 px-5 py-3 font-medium">Deploy history</div>
        <div className="divide-y">
          {deployEvents.map((event) => (
            <article className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto]" key={event.id}>
              <div>
                <h2 className="font-semibold">{event.serviceName}</h2>
                <p className="text-sm text-zinc-600">{event.imageTag} · {event.commitSha} · {event.deployedAt}</p>
              </div>
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-white">{event.status}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border">
        <div className="border-b bg-zinc-50 px-5 py-3 font-medium">Incident queue</div>
        <div className="divide-y">
          {incidents.map((incident) => (
            <article className="grid gap-2 px-5 py-4 md:grid-cols-[1fr_auto]" key={incident.id}>
              <div>
                <h2 className="font-semibold">{incident.title}</h2>
                <p className="text-sm text-zinc-600">{incident.status} · MTTR {incident.mttrMinutes}m</p>
              </div>
              <span className="rounded-full bg-zinc-900 px-3 py-1 text-sm text-white">{incident.severity}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border">
        <div className="border-b bg-zinc-50 px-5 py-3 font-medium">Rollback checklist</div>
        <div className="divide-y">
          {rollbackChecks.map((check) => (
            <label className="flex items-center gap-3 px-5 py-4 text-sm" key={check.id}>
              <input
                checked={check.checked}
                onChange={() => toggleRollbackCheck(check)}
                type="checkbox"
              />
              <span>{check.item}</span>
            </label>
          ))}
        </div>
        <p className="border-t px-5 py-3 text-sm text-zinc-600">Active incident: {activeIncident?.title}</p>
      </section>
    </main>
  );
};

export default Home;
