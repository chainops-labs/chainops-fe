"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { DeployEvent, DeployTarget, Incident, incidentApi, RollbackCheck } from "@/features/incidents";

const emptyTargetForm = {
  serviceName: "",
  repositoryUrl: "",
  healthUrl: "",
  namespace: "chainops-prod",
  environment: "production",
};

const formatDuration = (minutes: number) => {
  const totalSeconds = Math.round(minutes * 60);
  const displayMinutes = Math.floor(totalSeconds / 60);
  const displaySeconds = totalSeconds % 60;

  return `${displayMinutes}m ${displaySeconds}s`;
};

const panelClassName = "overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm";
const panelHeaderClassName = "border-b border-zinc-200 bg-zinc-50 px-5 py-3 font-medium";
const rowClassName = "grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start";
const badgeClassName = "inline-flex h-6 items-center rounded-md bg-zinc-900 px-2 text-xs font-medium text-white";
const secondaryButtonClassName = "inline-flex h-8 items-center rounded-md border border-zinc-300 px-3 text-sm hover:bg-zinc-50";
const mutedTextClassName = "break-all text-sm leading-6 text-zinc-600";

const Home = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [deployTargets, setDeployTargets] = useState<DeployTarget[]>([]);
  const [deployEvents, setDeployEvents] = useState<DeployEvent[]>([]);
  const [rollbackChecks, setRollbackChecks] = useState<RollbackCheck[]>([]);
  const [averageMttr, setAverageMttr] = useState(0);
  const [error, setError] = useState("");
  const [deployStatusFilter, setDeployStatusFilter] = useState("ALL");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("ALL");
  const [targetForm, setTargetForm] = useState(emptyTargetForm);

  const activeIncident = incidents[0];
  const completion = useMemo(() => {
    const checked = rollbackChecks.filter((item) => item.checked).length;
    return `${checked}/${rollbackChecks.length}`;
  }, [rollbackChecks]);
  const runningTargetCount = useMemo(
    () => deployTargets.filter((target) => target.runtimeStatus === "UP").length,
    [deployTargets],
  );
  const filteredDeployEvents = useMemo(() => deployEvents.filter((event) => (
    deployStatusFilter === "ALL" || event.status === deployStatusFilter
  )), [deployEvents, deployStatusFilter]);
  const filteredIncidents = useMemo(() => incidents.filter((incident) => (
    incidentStatusFilter === "ALL" || incident.status === incidentStatusFilter
  )), [incidents, incidentStatusFilter]);

  useEffect(() => {
    const load = async () => {
      try {
        const [loadedIncidents, loadedDeployTargets, loadedDeployEvents, metric] = await Promise.all([
          incidentApi.list(),
          incidentApi.deployTargets(),
          incidentApi.deployEvents(),
          incidentApi.mttr(),
        ]);

        setIncidents(loadedIncidents);
        setDeployTargets(loadedDeployTargets);
        setDeployEvents(loadedDeployEvents);
        setAverageMttr(metric.averageMinutes);
        setRollbackChecks(loadedIncidents[0] ? await incidentApi.rollbackChecks(loadedIncidents[0].id) : []);
        setError("");
      } catch {
        setError("운영 API 연결 실패");
      }
    };

    void load();
  }, []);

  const registerDeployTarget = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const created = await incidentApi.createDeployTarget(targetForm);
      setDeployTargets((items) => [created, ...items]);
      setTargetForm(emptyTargetForm);
      setError("");
    } catch {
      setError("배포 대상 등록 실패");
    }
  };

  const removeDeployTarget = async (id: string) => {
    try {
      await incidentApi.deleteDeployTarget(id);
      setDeployTargets((items) => items.filter((item) => item.id !== id));
      setError("");
    } catch {
      setError("배포 대상 삭제 실패");
    }
  };

  const toggleRollbackCheck = async (check: RollbackCheck) => {
    try {
      const updated = await incidentApi.updateRollbackCheck(check.id, !check.checked);
      setRollbackChecks((items) => items.map((item) => item.id === updated.id ? updated : item));
      setError("");
    } catch {
      setError("rollback checklist 저장 실패");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">GitOps incident operations</p>
        <h1 className="text-4xl font-semibold">ChainOps deployment and MTTR console</h1>
        <p className="max-w-2xl text-zinc-700">
          배포 대상의 현재 상태, 최근 배포 이력, 장애 감지와 복구 진행도를 한 화면에서 판단하는 운영 콘솔 UI다.
        </p>
        {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">Average MTTR</p>
          <strong className="text-3xl">{formatDuration(averageMttr)}</strong>
        </article>
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">Running targets</p>
          <strong className="text-3xl">{runningTargetCount}/{deployTargets.length}</strong>
        </article>
        <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-600">Latest deploy state</p>
          <strong className="text-3xl">{deployEvents[0]?.status ?? "UNKNOWN"}</strong>
        </article>
      </div>

      <section className={panelClassName}>
        <div className={panelHeaderClassName}>Deploy targets</div>
        <form className="grid gap-3 border-b border-zinc-200 p-5 md:grid-cols-6" onSubmit={registerDeployTarget}>
          <input
            aria-label="Service name"
            className="rounded-md border px-3 py-2 text-sm"
            onChange={(event) => setTargetForm((form) => ({ ...form, serviceName: event.target.value }))}
            placeholder="service name"
            required
            value={targetForm.serviceName}
          />
          <input
            aria-label="Repository URL"
            className="rounded-md border px-3 py-2 text-sm md:col-span-2"
            onChange={(event) => setTargetForm((form) => ({ ...form, repositoryUrl: event.target.value }))}
            placeholder="repository url"
            required
            value={targetForm.repositoryUrl}
          />
          <input
            aria-label="Health URL"
            className="rounded-md border px-3 py-2 text-sm md:col-span-2"
            onChange={(event) => setTargetForm((form) => ({ ...form, healthUrl: event.target.value }))}
            placeholder="health url"
            required
            value={targetForm.healthUrl}
          />
          <input
            aria-label="Namespace"
            className="rounded-md border px-3 py-2 text-sm"
            onChange={(event) => setTargetForm((form) => ({ ...form, namespace: event.target.value }))}
            placeholder="namespace"
            required
            value={targetForm.namespace}
          />
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white" type="submit">
            등록
          </button>
        </form>
        <div className="divide-y divide-zinc-100">
          {deployTargets.map((target) => (
            <article className={rowClassName} key={target.id}>
              <div className="min-w-0">
                <h2 className="font-semibold">{target.serviceName}</h2>
                <p className={mutedTextClassName}>{target.namespace} · {target.environment}</p>
                <p className={mutedTextClassName}>{target.repositoryUrl}</p>
                <p className={mutedTextClassName}>{target.healthUrl}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className={badgeClassName}>{target.runtimeStatus}</span>
                <button
                  className={secondaryButtonClassName}
                  onClick={() => removeDeployTarget(target.id)}
                  type="button"
                >
                  삭제
                </button>
              </div>
            </article>
          ))}
          {deployTargets.length === 0 ? <p className="px-5 py-4 text-sm text-zinc-600">등록된 배포 대상 없음</p> : null}
        </div>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="font-medium">Deploy history</div>
          <select
            aria-label="Deploy history status filter"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            onChange={(event) => setDeployStatusFilter(event.target.value)}
            value={deployStatusFilter}
          >
            <option value="ALL">전체 상태</option>
            <option value="SYNCED">SYNCED</option>
            <option value="RUNNING">RUNNING</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
        <div className="divide-y divide-zinc-100">
          {filteredDeployEvents.map((event) => (
            <article className={rowClassName} key={event.id}>
              <div className="min-w-0">
                <h2 className="font-semibold">{event.serviceName}</h2>
                <p className={mutedTextClassName}>{event.imageTag} · {event.commitSha} · {event.deployedAt}</p>
              </div>
              <span className={badgeClassName}>{event.status}</span>
            </article>
          ))}
          {filteredDeployEvents.length === 0 ? <p className="px-5 py-4 text-sm text-zinc-600">현재 조건에 맞는 배포 이벤트 없음</p> : null}
        </div>
      </section>

      <section className={panelClassName}>
        <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="font-medium">Incident queue</div>
          <select
            aria-label="Incident status filter"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            onChange={(event) => setIncidentStatusFilter(event.target.value)}
            value={incidentStatusFilter}
          >
            <option value="ALL">전체 상태</option>
            <option value="OPEN">OPEN</option>
            <option value="ACKED">ACKED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>
        </div>
        <div className="divide-y divide-zinc-100">
          {filteredIncidents.map((incident) => (
            <article className={rowClassName} key={incident.id}>
              <div className="min-w-0">
                <h2 className="font-semibold">{incident.title}</h2>
                <p className={mutedTextClassName}>{incident.status} · MTTR {formatDuration(incident.mttrMinutes)}</p>
              </div>
              <span className={badgeClassName}>{incident.severity}</span>
            </article>
          ))}
          {filteredIncidents.length === 0 ? <p className="px-5 py-4 text-sm text-zinc-600">현재 조건에 맞는 장애 이벤트 없음</p> : null}
        </div>
      </section>

      <section className={panelClassName}>
        <div className={panelHeaderClassName}>Rollback checklist · {completion}</div>
        <div className="divide-y divide-zinc-100">
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
          {rollbackChecks.length === 0 ? <p className="px-5 py-4 text-sm text-zinc-600">rollback checklist 없음</p> : null}
        </div>
        <p className="border-t border-zinc-200 px-5 py-3 text-sm text-zinc-600">Active incident: {activeIncident?.title ?? "없음"}</p>
      </section>
    </main>
  );
};

export default Home;
