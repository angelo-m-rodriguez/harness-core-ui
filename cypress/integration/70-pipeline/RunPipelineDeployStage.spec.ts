/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  cdFailureStrategiesYaml,
  invalidYAMLErrorMsgOnEmptyStageSave,
  pipelineSaveCall
} from '../../support/70-pipeline/constants'

describe('RUN PIPELINE MODAL - deploy stage', () => {
  const gitSyncCall =
    '/ng/api/git-sync/git-sync-enabled?accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const resolvedPipelineDetailsCall =
    '/template/api/templates/applyTemplates?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&pipelineIdentifier=testPipeline_Cypress&projectIdentifier=project1&getDefaultFromOtherRepo=true'
  const pipelineVariablesCall =
    '/pipeline/api/pipelines/v2/variables?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const servicesCall =
    '/ng/api/servicesV2?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const environmentsCall =
    '/ng/api/environmentsV2?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const connectorsCall =
    '/ng/api/connectors?accountIdentifier=accountId&type=K8sCluster&searchTerm=&projectIdentifier=project1&orgIdentifier=default'

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

    switch (Cypress.currentTest.title) {
      case 'error validations on pipeline save from API':
        break
      default:
        cy.createDeploymentStage()
        break
    }

    cy.intercept('GET', cdFailureStrategiesYaml, { fixture: 'pipeline/api/pipelines/failureStrategiesYaml' }).as(
      'cdFailureStrategiesYaml'
    )
  })

  it('should display the delete pipeline stage modal', () => {
    cy.wait(2000)
    cy.get('[icon="play"]').click({ force: true })
    cy.wait(2000)
    cy.contains('p', 'testStage_Cypress').trigger('mouseover')
    cy.get('[icon="cross"]').click({ force: true })
    cy.contains('p', 'Delete Pipeline Stage').should('be.visible')
    cy.contains('span', 'Delete').click({ force: true })
    cy.contains('span', 'Pipeline Stage Successfully removed.').should('be.visible')
  })

  it('error validations on pipeline save from API', () => {
    cy.intercept('POST', pipelineSaveCall, { fixture: 'pipeline/api/pipelines.post.emptyPipeline' }).as('pipelineSave')
    cy.wait(1000)
    cy.contains('div', 'Unsaved changes').should('be.visible')
    cy.contains('span', 'Save').click({ force: true })
    cy.wait('@pipelineSave')

    cy.contains('span', 'Invalid request: Field for key [stages] does not exist').should('be.visible')
    cy.intercept('POST', pipelineSaveCall, { fixture: 'pipeline/api/pipelines.post.emptyStage' }).as(
      'pipelineSaveStage'
    )
    cy.createDeploymentStage()
    cy.wait(1000)
    cy.contains('span', 'Save').click({ force: true })
    cy.wait('@pipelineSaveStage')

    cy.contains('span', 'Invalid yaml: $.pipeline.stages[0].stage.spec.execution: is missing but it is required')
      .should('be.visible')
      .invoke('text')
      .then(text => {
        expect(text).equal(invalidYAMLErrorMsgOnEmptyStageSave)
      })
  })

  describe('Checks visual to YAML and visual to variable view parity', () => {
    beforeEach(() => {
      cy.intercept('GET', cdFailureStrategiesYaml, { fixture: 'pipeline/api/pipelines/failureStrategiesYaml' })
      cy.intercept('GET', servicesCall, { fixture: 'ng/api/servicesV2' })
      cy.intercept('GET', environmentsCall, { fixture: 'ng/api/environmentsV2' })
      cy.intercept('GET', connectorsCall, { fixture: 'ng/api/connectors' })
      cy.intercept('POST', pipelineVariablesCall, { fixture: 'pipeline/api/runpipeline/pipelines.variables' })
      cy.intercept('POST', resolvedPipelineDetailsCall, req => {
        req.continue(res => {
          res.send({
            status: 'SUCCESS',
            data: {
              mergedPipelineYaml: req.body.originalEntityYaml,
              templateReferenceSummaries: []
            },
            metaData: null,
            correlationId: 'fa9edc77-c155-42f5-b0af-93c1f0546911'
          })
        })
      })

      cy.wait(1000)

      // Service tab config
      cy.get('input[name="serviceRef"]').click({ force: true })
      cy.contains('p', 'testService').click({ force: true })
      cy.contains('p', 'Kubernetes').should('be.visible').click()
      cy.wait(1000)

      // Infrastructure tab config
      cy.contains('span', 'Infrastructure').click({ force: true })
      cy.wait(1000)
      cy.get('input[name="environmentRef"]').click({ force: true })
      cy.contains('p', 'testEnv').click({ force: true })
      cy.wait(1000)

      cy.contains('p', /^Kubernetes$/).click()
      cy.wait(1000)

      cy.contains('span', 'Select Connector').click({ force: true })
      cy.contains('p', 'test1111').click({ force: true })
      cy.contains('span', 'Apply Selected').click({ force: true })

      cy.fillField('namespace', 'cypress')
      cy.wait(1000)
    })

    it.skip('visual to YAML conversion for stage configuration', () => {
      // Toggle to YAML view

      cy.get('[data-name="toggle-option-two"]').click({ force: true })
      cy.wait(1000)

      cy.contains('div', 'Unsaved changes').should('be.visible')
      //Verify all details in YAML view
      cy.contains('span', 'testPipeline_Cypress').should('be.visible')
      cy.contains('span', 'testStage_Cypress').should('be.visible')
      cy.contains('span', 'Deployment').should('be.visible')

      cy.contains('span', 'serviceRef').should('be.visible')
      cy.contains('span', 'testService').should('be.visible')

      cy.contains('span', 'environmentRef').should('be.visible')
      cy.contains('span', 'testEnv').should('be.visible')

      cy.contains('span', 'KubernetesDirect').should('be.visible')

      cy.contains('span', 'connectorRef').should('be.visible')
      cy.contains('span', 'test1111').should('be.visible')

      cy.contains('span', 'namespace').should('be.visible')
      cy.contains('span', 'cypress').should('be.visible')
    })

    it('visual to variable view for stage configuration', () => {
      // Toggle to variable view
      cy.contains('span', 'Variables').click()
      cy.wait(2000)

      cy.get('#pipeline-panel').contains('span', 'testPipeline_Cypress').should('be.visible')
      cy.get('#pipeline-panel').contains('span', 'testStage_Cypress').should('be.visible')

      cy.get('#pipeline-panel').contains('span', 'connectorRef').should('be.visible')
      cy.get('#pipeline-panel').contains('span', 'test1111').should('be.visible')

      cy.get('#pipeline-panel').contains('span', 'namespace').should('be.visible')
      cy.get('#pipeline-panel').contains('span', 'cypress').should('be.visible')
    })
  })
})
