describe("ChainOps incident console", () => {
  it("shows MTTR and incident queue", () => {
    cy.visit("/");
    cy.contains("ChainOps deployment and MTTR console").should("be.visible");
    cy.contains("Average MTTR").should("be.visible");
    cy.contains("Incident queue").should("be.visible");
  });

  it("shows deploy history and toggles rollback checklist", () => {
    const incidentId = "44444444-4444-4444-8444-444444444444";
    const checkId = "77777777-7777-4777-8777-777777777772";

    cy.intercept("GET", "**/api/incidents", [
      {
        id: incidentId,
        title: "Verifier API latency after deploy",
        severity: "SEV2",
        status: "MITIGATING",
        mttrMinutes: 18,
      },
    ]);
    cy.intercept("GET", "**/api/deploy-targets", [
      {
        id: "88888888-8888-4888-8888-888888888881",
        serviceName: "idwallet-be",
        repositoryUrl: "https://github.com/idwallet-labs/idwallet-be",
        healthUrl: "http://localhost:8080/actuator/health",
        namespace: "idwallet-local",
        environment: "local",
        runtimeStatus: "UP",
        createdAt: "2026-07-08T09:50:00Z",
      },
    ]);
    cy.intercept("GET", "**/api/deploy-events", [
      {
        id: "55555555-5555-4555-8555-555555555555",
        serviceName: "idwallet-be",
        commitSha: "8f3a2c1",
        imageTag: "idwallet-be:8f3a2c1",
        status: "RUNNING",
        deployedAt: "2026-07-08T10:18:00Z",
      },
    ]);
    cy.intercept("GET", "**/api/metrics/mttr", { averageMinutes: 18, sampleSize: 1 });
    cy.intercept("GET", `**/api/incidents/${incidentId}/rollback-checks`, [
      {
        id: checkId,
        incidentId,
        item: "Argo CD sync 상태 확인",
        checked: false,
      },
    ]);
    cy.intercept("PATCH", `**/api/rollback-checks/${checkId}`, {
      id: checkId,
      incidentId,
      item: "Argo CD sync 상태 확인",
      checked: true,
    });

    cy.visit("/");
    cy.contains("18m 0s").should("be.visible");
    cy.contains("Deploy history").should("be.visible");
    cy.contains("idwallet-be:8f3a2c1").should("be.visible");
    cy.contains("Rollback checklist").should("be.visible");
    cy.contains("Argo CD sync 상태 확인").click();
    cy.contains("Rollback checklist").contains("1/1").should("be.visible");
  });

  it("registers and removes deploy targets", () => {
    const targetId = "99999999-9999-4999-8999-999999999999";

    cy.intercept("GET", "**/api/incidents", []);
    cy.intercept("GET", "**/api/deploy-events", [
      {
        id: targetId,
        serviceName: "audit-api",
        commitSha: "abc1234",
        imageTag: "audit-api:abc1234",
        status: "RUNNING",
        deployedAt: "2026-07-09T00:00:05Z",
      },
    ]);
    cy.intercept("GET", "**/api/metrics/mttr", { averageMinutes: 0, sampleSize: 0 });
    cy.intercept("GET", "**/api/deploy-targets", []);
    cy.intercept("POST", "**/api/deploy-targets", {
      id: targetId,
      serviceName: "audit-api",
      repositoryUrl: "https://github.com/cyjoon68/audit-api",
      healthUrl: "http://localhost:18080/actuator/health",
      namespace: "chainops-prod",
      environment: "production",
      runtimeStatus: "DOWN",
      createdAt: "2026-07-09T00:00:00Z",
    });
    cy.intercept("DELETE", `**/api/deploy-targets/${targetId}`, { statusCode: 204 });

    cy.visit("/");
    cy.get('input[placeholder="service name"]').type("audit-api");
    cy.get('input[placeholder="repository url"]').type("https://github.com/cyjoon68/audit-api");
    cy.get('input[placeholder="health url"]').type("http://localhost:18080/actuator/health");
    cy.contains("button", "등록").click();
    cy.contains("audit-api").should("be.visible");
    cy.contains("audit-api:abc1234").should("be.visible");
    cy.contains("button", "삭제").click();
    cy.contains("Deploy targets")
      .parents("section")
      .within(() => {
        cy.contains("audit-api").should("not.exist");
      });
  });
});
