describe("ChainOps incident console", () => {
  it("shows MTTR and incident queue", () => {
    cy.visit("/");
    cy.contains("ChainOps deployment and MTTR console").should("be.visible");
    cy.contains("Average MTTR").should("be.visible");
    cy.contains("Incident queue").should("be.visible");
  });
});
