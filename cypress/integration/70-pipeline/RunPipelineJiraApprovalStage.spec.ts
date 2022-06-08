/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

describe('RUN PIPELINE MODAL - Jira Approval Stage', () => {
  const gitSyncCall =
    '/ng/api/git-sync/git-sync-enabled?accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const stepsCall = '/pipeline/api/pipelines/v2/steps?routingId=accountId&accountId=accountId'
  const jirayamlSnippetCall = '/pipeline/api/approvals/stage-yaml-snippet?routingId=accountId&approvalType=JiraApproval'
  const jiraConnectorsCall =
    '/ng/api/connectors?accountIdentifier=accountId&type=Jira&searchTerm=&pageIndex=0&pageSize=10&projectIdentifier=project1&orgIdentifier=default'
  const jiraProjectsCall =
    '/ng/api/jira/projects?routingId=accountId&accountIdentifier=accountId&projectIdentifier=project1&orgIdentifier=default&connectorRef=Jira_cloud'
  const jiraIssueTypesCall =
    'ng/api/jira/createMetadata?routingId=accountId&accountIdentifier=accountId&projectIdentifier=project1&orgIdentifier=default&connectorRef=Jira_cloud&projectKey=ART'
  const jiraStatusesCall =
    '/ng/api/jira/statuses?routingId=accountId&accountIdentifier=accountId&projectIdentifier=project1&orgIdentifier=default&connectorRef=Jira_cloud'
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.intercept('GET', gitSyncCall, { connectivityMode: null, gitSyncEnabled: false })
    cy.login('test', 'test')

    cy.visitCreatePipeline()

    cy.fillName('testPipeline_Cypress')

    cy.clickSubmit()
    cy.get('[icon="plus"]').click()
    cy.findByTestId('stage-Approval').click()
    cy.fillName('JiraStageTest')
    cy.contains('p', 'Jira').click({ multiple: true })
    cy.clickSubmit()
    cy.intercept('GET', jirayamlSnippetCall, { fixture: 'pipeline/api/jiraStage/stageYamlSnippet' }).as('stageYaml')
    cy.intercept('POST', stepsCall, { fixture: 'pipeline/api/approvals/steps' })
  })

  //After adding Approval stage, add Jira
  it('should display the delete pipeline stage modal', () => {
    cy.wait('@stageYaml')
    cy.wait(1000)
    cy.get('[icon="play"]').click({ force: true, multiple: true })
    cy.wait(2000)
    cy.contains('p', 'JiraStageTest').trigger('mouseover')
    cy.get('[icon="cross"]').click({ force: true })
    cy.contains('p', 'Delete Pipeline Stage').should('be.visible')
    cy.contains('span', 'Delete').click({ force: true })
    cy.contains('span', 'Pipeline Stage Successfully removed.').should('be.visible')
  })

  describe('Jira Create Form Test', () => {
    it('Submit empty form Validations', () => {
      cy.wait('@stageYaml')
      cy.contains('span', 'Advanced').click({ force: true })
      cy.wait(1000)
      cy.contains('span', 'Execution').click({ force: true })
      cy.wait(3000)
      cy.contains('p', 'Jira Create').click()
      cy.visitPageAssertion('[class^=StepCommands]') //assert right-drawer opening
      cy.contains('span', 'Apply Changes').click({ force: true })
      cy.contains('span', 'Jira Connector is required').should('be.visible').should('have.class', 'FormError--error')
      cy.contains('span', 'Project is required').should('be.visible').should('have.class', 'FormError--error')
      cy.contains('span', 'Issue Type is required').should('be.visible').should('have.class', 'FormError--error')
    })

    it('Submit form with empty required fields validations', () => {
      cy.intercept('GET', jiraConnectorsCall, { fixture: 'ng/api/jiraConnectors' })
      cy.intercept('GET', jiraProjectsCall, { fixture: 'ng/api/jiraProjects' })
      cy.intercept('GET', jiraIssueTypesCall, { fixture: 'ng/api/jiraIssueTypes' })
      cy.wait(2000)
      cy.contains('span', 'Execution').click({ force: true })
      cy.wait(4000)
      cy.contains('p', 'Jira Create').click()
      cy.visitPageAssertion('[class^=StepCommands]') //assert right-drawer opening
      cy.contains('span', 'Select Connector').click({ force: true })
      cy.contains('p', 'Jira cloudJira cloudJira cloudJira cloudJira cloudJira cloud').click({ force: true })
      cy.contains('span', 'Apply Selected').click({ force: true })
      cy.wait(1000)
      cy.get('input[name="spec.projectKey"]').click({ force: true })
      cy.contains('p', 'ART').click({ force: true })
      cy.wait(1000)
      cy.get('input[name="spec.issueType"]').click({ force: true })
      cy.contains('p', 'Bug').click({ force: true })
      cy.wait(1000)
      cy.contains('span', 'Apply Changes').click({ force: true })
      cy.contains('span', 'This is a required field').should('be.visible').should('have.class', 'FormError--error')
      cy.wait(1000)
    })

    it('Submit form after filling details', () => {
      cy.intercept('GET', jiraConnectorsCall, { fixture: 'ng/api/jiraConnectors' })
      cy.intercept('GET', jiraProjectsCall, { fixture: 'ng/api/jiraProjects' })
      cy.intercept('GET', jiraIssueTypesCall, { fixture: 'ng/api/jiraIssueTypes' })
      cy.wait(2000)
      cy.contains('span', 'Execution').click({ force: true })
      cy.wait(3000)
      cy.contains('p', 'Jira Create').click()
      cy.visitPageAssertion('[class^=StepCommands]') //assert right-drawer opening
      cy.contains('span', 'Select Connector').click({ force: true })
      cy.contains('p', 'Jira cloudJira cloudJira cloudJira cloudJira cloudJira cloud').click({ force: true })
      cy.contains('span', 'Apply Selected').click({ force: true })
      cy.wait(1000)
      cy.get('input[name="spec.projectKey"]').click({ force: true })
      cy.contains('p', 'ART').click({ force: true })
      cy.wait(1000)
      cy.get('input[name="spec.issueType"]').click({ force: true })
      cy.contains('p', 'Bug').click({ force: true })
      cy.wait(1000)
      cy.fillField('spec.selectedRequiredFields[0].value', 'Test_Description')
      cy.wait(1000)
      cy.fillField('spec.selectedRequiredFields[1].value', 'Test_Summary')
      cy.wait(1000)
      cy.contains('span', 'Apply Changes').click({ force: true })
    })
  })

  describe('Jira Approval Form Test', () => {
    it('Submit empty form Validations', () => {
      cy.wait('@stageYaml')
      cy.contains('span', 'Advanced').click({ force: true })
      cy.wait(1000)
      cy.contains('span', 'Execution').click({ force: true })
      cy.wait(3000)
      cy.contains('p', 'Jira Approval').click()
      cy.visitPageAssertion('[class^=StepCommands]') //assert right-drawer opening
      cy.contains('span', 'Apply Changes').click({ force: true })
      cy.contains('span', 'Jira Connector is required').should('be.visible').should('have.class', 'FormError--error')
      cy.contains('span', 'Issue Key is required').should('be.visible').should('have.class', 'FormError--error')
      cy.contains('p', 'At least one condition is required').should('be.visible')
    })

    it('Submit form after filling details', () => {
      cy.intercept('GET', jiraConnectorsCall, { fixture: 'ng/api/jiraConnectors' })
      cy.intercept('GET', jiraProjectsCall, { fixture: 'ng/api/jiraProjects' })
      cy.intercept('GET', jiraIssueTypesCall, { fixture: 'ng/api/jiraIssueTypes' })
      cy.wait(2000)
      cy.contains('span', 'Execution').click({ force: true })
      cy.wait(3000)
      cy.contains('p', 'Jira Approval').click()
      cy.visitPageAssertion('[class^=StepCommands]') //assert right-drawer opening
      cy.get('button[data-testid="cr-field-spec.connectorRef"]').click({ force: true })
      cy.contains('p', 'Jira cloudJira cloudJira cloudJira cloudJira cloudJira cloud').click({ force: true })
      cy.contains('span', 'Apply Selected').click({ force: true })
      cy.wait(1000)
      cy.fillField('spec.issueKey', 'TK101')
      cy.wait(1000)
      cy.contains('span', 'Add').click({ force: true })
      cy.wait(1000)
      cy.fillField('spec.approvalCriteria.spec.conditions[0].value', 'To Do')
      cy.wait(1000)
      cy.contains('span', 'Apply Changes').click({ force: true })
    })
  })

  describe('Jira Update Form Test', () => {
    it('Submit empty form Validations', () => {
      cy.wait('@stageYaml')
      cy.contains('span', 'Advanced').click({ force: true })
      cy.wait(1000)
      cy.contains('span', 'Execution').click({ force: true })
      cy.wait(3000)
      cy.contains('p', 'Jira Update').click()
      cy.visitPageAssertion('[class^=StepCommands]') //assert right-drawer opening
      cy.contains('span', 'Apply Changes').click({ force: true })
      cy.contains('span', 'Jira Connector is required').should('be.visible').should('have.class', 'FormError--error')
      cy.contains('span', 'Issue Key is required').should('be.visible').should('have.class', 'FormError--error')
    })

    it('Submit form after filling details', () => {
      cy.intercept('GET', jiraConnectorsCall, { fixture: 'ng/api/jiraConnectors' })
      cy.intercept('GET', jiraProjectsCall, { fixture: 'ng/api/jiraProjects' })
      cy.intercept('GET', jiraStatusesCall, { fixture: 'ng/api/jiraStatuses' })
      cy.wait(2000)
      cy.contains('span', 'Execution').click({ force: true })
      cy.wait(3000)
      cy.contains('p', 'Jira Update').click()
      cy.visitPageAssertion('[class^=StepCommands]') //assert right-drawer opening
      cy.contains('span', 'Select Connector').click({ force: true })
      cy.contains('p', 'Jira cloudJira cloudJira cloudJira cloudJira cloudJira cloud').click({ force: true })
      cy.contains('span', 'Apply Selected').click({ force: true })
      cy.wait(1000)
      cy.fillField('spec.issueKey', 'TP102')
      cy.wait(1000)
      cy.contains('span', 'Apply Changes').click({ force: true })
    })
  })
})
