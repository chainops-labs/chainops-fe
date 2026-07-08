import { incidentApi } from "@/features/incidents";

const fallbackIncidents = [
  { id: "inc-42", title: "Verifier API latency after deploy", severity: "SEV2", status: "MITIGATING", mttrMinutes: 18 },
  { id: "inc-41", title: "Argo CD sync drift", severity: "SEV3", status: "RESOLVED", mttrMinutes: 9 },
] as const;

const loadIncidents = async () => {
  try {
    return await incidentApi.list();
  } catch {
    return fallbackIncidents;
  }
};

const Home = async () => {
  const incidents = await loadIncidents();
  const averageMttr = Math.round(incidents.reduce((sum, item) => sum + item.mttrMinutes, 0) / incidents.length);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">GitOps incident operations</p>
        <h1 className="text-4xl font-semibold">ChainOps deployment and MTTR console</h1>
        <p className="max-w-2xl text-zinc-700">
          배포 이력, 장애 상태, rollback checklist, MTTR 지표를 연결해 인프라 운영 증거를 만든다.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border p-5">
          <p className="text-sm text-zinc-600">Average MTTR</p>
          <strong className="text-3xl">{averageMttr}m</strong>
        </article>
        <article className="rounded-lg border p-5">
          <p className="text-sm text-zinc-600">GitOps status</p>
          <strong className="text-3xl">Synced</strong>
        </article>
        <article className="rounded-lg border p-5">
          <p className="text-sm text-zinc-600">Compiler</p>
          <strong className="text-3xl">React</strong>
        </article>
      </div>

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
    </main>
  );
};

export default Home;
