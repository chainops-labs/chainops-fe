describe("ChainOps incident console", () => {
  it("shows MTTR and incident queue", () => {
    cy.visit("/");
    cy.contains("ChainOps deployment and MTTR console").should("be.visible");
    cy.contains("Average MTTR").should("be.visible");
    cy.contains("Incident queue").should("be.visible");
  });

  it("shows deploy history and toggles rollback checklist", () => {
    const incidentId = "7b5d3f71-6b51-4cc8-a4db-cc8aa6210031";

    cy.intercept("GET", "**/api/incidents", [
      {
        id: incidentId,
        title: "Verifier API latency after deploy",
        severity: "SEV2",
        status: "MITIGATING",
        mttrMinutes: 18,
      },
    ]);
    cy.intercept("GET", "**/api/deploy-events", [
      {
        id: "deploy-42",
        serviceName: "verifier-api",
        commitSha: "8f3a2c1",
        imageTag: "verifier-api:2026.07.08",
        status: "DEGRADED",
        deployedAt: "2026-07-08T10:18:00Z",
      },
    ]);
    cy.intercept("GET", "**/api/metrics/mttr", { averageMinutes: 18, sampleSize: 1 });
    cy.intercept("GET", `**/api/incidents/${incidentId}/rollback-checks`, [
      {
        id: "rb-1",
        incidentId,
        item: "Argo CD sync 상태 확인",
        checked: false,
      },
    ]);
    cy.intercept("PATCH", "**/api/rollback-checks/rb-1", {
      id: "rb-1",
      incidentId,
      item: "Argo CD sync 상태 확인",
      checked: true,
    });

    cy.visit("/");
    cy.contains("Deploy history").should("be.visible");
    cy.contains("DEGRADED").should("be.visible");
    cy.contains("Rollback checklist").should("be.visible");
    cy.contains("Argo CD sync 상태 확인").click();
    cy.contains("Rollback checks").parent().contains("1/1").should("be.visible");
  });
});
