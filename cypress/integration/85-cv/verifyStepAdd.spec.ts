import {
  applyTemplatesCall,
  applyTemplatesResponseForServiceRuntime,
  inputSetsCall,
  inputSetsTemplateCall,
  inputSetTemplateForRuntimeServiceCall,
  inputSetTemplateRuntimeServiceResponse,
  monitoresServices,
  monitoresServicesResponse,
  monitoresServicesResponseWithNoHealthSource,
  pipelineDetailsCall,
  pipelineDetailsWithRoutingIdCall,
  pipelineDetailsWithRoutingIDResponse,
  pipelineSaveServiceRuntimeResponse,
  pipelineSummaryCall,
  pipelineSummaryResponse,
  serviceEnvironmentNoMonitoredServicesResponse,
  serviceEnvironmentTest2Call,
  serviceEnvironmentTest3Call,
  servicesCallV2,
  servicesV2AccessResponse,
  inputSetTemplateNoInput,
  templateResolvedPipeline,
  templateResolvedPipelineResponse,
  savePipelineGetResponse,
  inputSetsTemplateServiceRunTimeInputResponse,
  inputSetsTemplateResponse2
} from '../../support/85-cv/verifyStep/constants'

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('Verify step add', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.login('test', 'test')

    cy.visitVerifyStepInPipeline()
    cy.fillName('testPipeline_Cypress')
    cy.get('[type="submit"]').click()
  })

  it.skip('should check verify step add inputs are correct as given', () => {
    cy.verifyStepInitialSetup()

    cy.intercept(
      'POST',
      '/pipeline/api/inputSets/template?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&pipelineIdentifier=testPipeline_Cypress&projectIdentifier=project1',
      inputSetTemplateNoInput
    ).as('inputSetsTemplateCall')

    cy.intercept(
      'GET',
      '/ng/api/environmentsV2?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
    ).as('environmentsV2')

    cy.intercept('POST', '/authz/api/acl?routingId=accountId').as('aclCall')

    // service definition
    cy.get('input[name="serviceRef"]').click({ force: true })
    cy.contains('p', 'testService').click({ force: true })

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.get('input[name="environmentRef"]').click({ force: true })
    cy.contains('p', 'testEnv').click({ force: true })

    cy.wait(1000)

    cy.verifyStepSelectConnector()

    cy.wait(1000)

    cy.verifyStepSelectStrategyAndVerifyStep()
    cy.wait('@monitoredServices')

    cy.get("input[name='spec.monitoredServiceRef']").should('have.value', 'appd_prod')
    cy.get("input[name='spec.monitoredServiceRef']").should('be.disabled')
    cy.findByText(/^Health Sources$/i).should('exist')
    cy.findByTestId(/healthSourceTable_appd-test/i).should('exist')

    cy.fillName('test_verify')

    cy.get('input[name="spec.type"]').click({ force: true })
    cy.contains('p', 'Rolling Update').click({ force: true })
    cy.get('input[name="spec.spec.sensitivity"]').click({ force: true })
    cy.contains('p', 'High').click({ force: true })
    cy.get('input[name="spec.spec.duration"]').click({ force: true })
    cy.contains('p', '5 min').click({ force: true })
    cy.intercept('GET', pipelineSummaryCall, pipelineSummaryResponse).as('pipelineSummaryCall')
    cy.intercept('GET', pipelineDetailsCall, pipelineSaveServiceRuntimeResponse).as('pipelineDetailsCall')

    cy.findByRole('button', { name: /Apply Changes/i }).click()

    cy.wait(2000)

    cy.findByRole('button', { name: /^Save$/i }).click({ force: true })

    cy.wait(500)

    cy.findByText('Pipeline published successfully').should('be.visible')

    cy.intercept('GET', templateResolvedPipeline, templateResolvedPipelineResponse).as('templateResolvedPipeline')

    cy.wait('@pipelineSave').then(interception => {
      expect(interception.request.body).includes('type: Verify')
      expect(interception.request.body).includes('sensitivity: HIGH')
      expect(interception.request.body).includes('duration: 5m')
      expect(interception.request.body).includes('deploymentTag: <+serviceConfig.artifacts.primary.tag>')
      expect(interception.request.body).includes('timeout: 2h')
    })

    cy.findByTestId('card-run-pipeline').click()

    cy.wait('@stagesExecutionList')
    cy.wait('@inputSetsTemplateCallResponse')
    cy.wait('@templateResolvedPipeline')

    cy.findByText('No runtime inputs are required for the execution of this Pipeline').should('exist')
  })

  it('should show button to create monitored serices, if no monitoired services is present', () => {
    cy.verifyStepInitialSetup()

    cy.intercept('GET', monitoresServices, serviceEnvironmentNoMonitoredServicesResponse).as('noMonitoredServices')

    // service definition
    cy.wait(1000)
    cy.get('input[name="serviceRef"]').click({ force: true })
    cy.contains('p', 'testService').click({ force: true })
    cy.contains('p', 'Kubernetes').click()

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.wait(1000)
    cy.get('input[name="environmentRef"]').click({ force: true })
    cy.contains('p', 'testEnv').click({ force: true })
    cy.wait(1000)

    cy.verifyStepSelectConnector()

    cy.fillField('namespace', 'verify-step')
    cy.wait(1000)

    cy.verifyStepSelectStrategyAndVerifyStep()
    cy.wait('@noMonitoredServices', { timeout: 10000 })

    cy.findByRole('button', { name: /Click to autocreate a monitored service/i }).should('exist')
    cy.findByText(/^Health Sources$/i).should('not.exist')
  })

  it('should show monitored service as runtime input, if service and environment is given as runtime', () => {
    cy.verifyStepInitialSetup()

    cy.intercept('GET', monitoresServices, serviceEnvironmentNoMonitoredServicesResponse).as('noMonitoredServices')

    // service definition
    cy.wait(1000)
    cy.verifyStepChooseRuntimeInput()
    cy.contains('p', 'Kubernetes').click()

    cy.wait(500)

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.wait(1000)
    cy.verifyStepChooseRuntimeInput()
    cy.wait(500)

    cy.verifyStepSelectConnector()
    cy.wait(1000)

    cy.verifyStepSelectStrategyAndVerifyStep()

    cy.findByRole('button', { name: /Click to autocreate a monitored service/i }).should('not.exist')
    cy.findByText(/^Health Sources$/i).should('not.exist')
    cy.get("input[name='spec.monitoredServiceRef']").should('have.value', '<+input>')
  })

  it('should show monitored service as runtime input, if service is runtime and environment is fixed value', () => {
    cy.verifyStepInitialSetup()

    cy.intercept('POST', inputSetsCall, inputSetsTemplateServiceRunTimeInputResponse).as(
      'inputSetsTemplateCallResponse'
    )

    cy.intercept('GET', pipelineDetailsCall, pipelineSaveServiceRuntimeResponse).as('pipelineDetailsCall')
    cy.intercept('GET', pipelineDetailsWithRoutingIdCall, pipelineDetailsWithRoutingIDResponse).as(
      'pipelineDetailsWithRoutingIdCall'
    )
    cy.intercept('GET', monitoresServices, serviceEnvironmentNoMonitoredServicesResponse).as('noMonitoredServices')
    cy.intercept('GET', pipelineSummaryCall, pipelineSummaryResponse).as('pipelineSummaryCall')
    cy.intercept('POST', inputSetsTemplateCall, inputSetsTemplateResponse2).as('inputSetsTemplateCall')
    cy.intercept('GET', servicesCallV2, servicesV2AccessResponse).as('servicesCallV2')
    cy.intercept('POST', inputSetTemplateForRuntimeServiceCall, inputSetTemplateRuntimeServiceResponse).as(
      'inputSetTemplateForRuntimeServiceCall'
    )

    cy.intercept(
      'GET',
      '/pipeline/api/pipelines/testPipeline_Cypress?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1&getTemplatesResolvedPipeline=true',
      savePipelineGetResponse
    ).as('savePipelineGetResponse')

    // service definition
    cy.wait(1000)
    cy.verifyStepChooseRuntimeInput()
    cy.contains('p', 'Kubernetes').click()
    cy.wait(500)

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.wait(1000)
    cy.get('input[name="environmentRef"]').click({ force: true })
    cy.contains('p', 'testEnv').click({ force: true })
    cy.wait(500)

    cy.verifyStepSelectConnector()

    cy.wait(1000)

    cy.verifyStepSelectStrategyAndVerifyStep()
    cy.wait('@noMonitoredServices', { timeout: 10000 })

    cy.findByRole('button', { name: /Click to autocreate a monitored service/i }).should('not.exist')
    cy.findByText(/^Health Sources$/i).should('not.exist')
    cy.get("input[name='spec.monitoredServiceRef']").should('have.value', '<+input>')

    cy.fillName('test_verify')

    cy.get('input[name="spec.type"]').click({ force: true })
    cy.contains('p', 'Rolling Update').click({ force: true })
    cy.get('input[name="spec.spec.sensitivity"]').click({ force: true })
    cy.contains('p', 'High').click({ force: true })
    cy.get('input[name="spec.spec.duration"]').click({ force: true })
    cy.contains('p', '5 min').click({ force: true })

    cy.intercept('POST', applyTemplatesCall, applyTemplatesResponseForServiceRuntime).as(
      'applyTemplatesCallForServiceRuntime'
    )

    cy.intercept('GET', serviceEnvironmentTest2Call, monitoresServicesResponse).as('withMonitoredServiceCall')
    cy.intercept('GET', serviceEnvironmentTest3Call, monitoresServicesResponseWithNoHealthSource).as(
      'MonitoredServiceCallWithNoHealthSource'
    )

    cy.findByRole('button', { name: /Apply Changes/i }).click()

    cy.wait(1000)

    cy.findByRole('button', { name: /^Save$/i }).click({ force: true })

    cy.wait('@pipelineDetailsCall')

    cy.findByTestId('card-run-pipeline').click()

    cy.wait('@inputSetsTemplateCallResponse')
    cy.wait('@savePipelineGetResponse')
    cy.wait('@stagesExecutionList')

    cy.findByText('Specify Service').should('exist')

    cy.get('.MultiTypeInput--fixedValueInput input').should('exist')

    cy.get('.MultiTypeInput--fixedValueInput input').click()

    cy.contains('p', 'testService').click({ force: true })

    cy.findByText(
      'No Monitored Service is present for selected service and environment. Verify step will be skipped.'
    ).should('exist')

    cy.get('.MultiTypeInput--fixedValueInput input').click()

    cy.contains('p', 'testService2').click({ force: true })

    cy.wait('@withMonitoredServiceCall')

    cy.findByText(
      'No Monitored Service is present for selected service and environment. Verify step will be skipped.'
    ).should('not.exist')

    cy.findByText(/appd_prod/).should('be.visible')
    cy.findByTestId(/healthSourceTable_appd-test/).should('be.visible')

    cy.get('.MultiTypeInput--fixedValueInput input').click()

    cy.contains('p', 'testService3').click({ force: true })

    cy.wait('@MonitoredServiceCallWithNoHealthSource')

    cy.findByText('No Health source is present . Verify step will be skipped.').should('be.visible')
  })

  it('should show monitored service as runtime input, if service is fixed and environment is runtime value', () => {
    cy.verifyStepInitialSetup()

    cy.intercept('GET', monitoresServices, serviceEnvironmentNoMonitoredServicesResponse).as('noMonitoredServices')

    // service definition
    cy.wait(1000)
    cy.get('input[name="serviceRef"]').click({ force: true })
    cy.contains('p', 'testService').click({ force: true })
    cy.contains('p', 'Kubernetes').click()
    cy.wait(500)

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.wait(1000)
    cy.verifyStepChooseRuntimeInput()
    cy.wait(500)

    cy.verifyStepSelectConnector()

    cy.wait(500)

    cy.verifyStepSelectStrategyAndVerifyStep()

    cy.findByRole('button', { name: /Click to autocreate a monitored service/i }).should('not.exist')
    cy.findByText(/^Health Sources$/i).should('not.exist')
    cy.get("input[name='spec.monitoredServiceRef']").should('have.value', '<+input>')
  })

  it('should show monitored service as <+service.identifier>_<+enviroment.identifier>, if service is fixed and environment is expression value', () => {
    cy.verifyStepInitialSetup()

    cy.intercept('GET', monitoresServices, serviceEnvironmentNoMonitoredServicesResponse).as('noMonitoredServices')

    // service definition
    cy.wait(1000)
    cy.get('input[name="serviceRef"]').click({ force: true })
    cy.contains('p', 'testService').click({ force: true })
    cy.contains('p', 'Kubernetes').click()
    cy.wait(500)

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.wait(1000)
    cy.get('.MultiTypeInput--FIXED').click()
    cy.findByText('Expression').click()
    cy.get('input[name="environmentRef"]').clear().type('<+pipeline>')
    cy.wait(500)

    cy.verifyStepSelectConnector()

    cy.wait(500)

    cy.verifyStepSelectStrategyAndVerifyStep()

    cy.findByRole('button', { name: /Click to autocreate a monitored service/i }).should('not.exist')
    cy.findByText(/^Health Sources$/i).should('not.exist')
    cy.get("input[name='spec.monitoredServiceRef']").should(
      'have.value',
      '<+service.identifier>_<+enviroment.identifier>'
    )
  })

  it.skip('should show monitored service as <+service.identifier>_<+enviroment.identifier>, if service is expression and environment is fixed value', () => {
    cy.verifyStepInitialSetup()

    cy.intercept('GET', monitoresServices, serviceEnvironmentNoMonitoredServicesResponse).as('noMonitoredServices')

    // service definition
    cy.wait(1000)
    cy.get('.MultiTypeInput--FIXED').click()
    cy.findByText('Expression').click()
    cy.get('input[name="serviceRef"]').clear().type('<+pipeline>')
    cy.contains('p', 'Kubernetes').click()

    cy.wait(500)

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.wait(1000)
    cy.get('input[name="environmentRef"]').click({ force: true })
    cy.contains('p', 'testEnv').click({ force: true })
    cy.wait(500)

    cy.verifyStepSelectConnector()

    cy.wait(500)

    cy.verifyStepSelectStrategyAndVerifyStep()

    cy.findByRole('button', { name: /Click to autocreate a monitored service/i }).should('not.exist')
    cy.findByText(/^Health Sources$/i).should('not.exist')
    cy.get("input[name='spec.monitoredServiceRef']").should(
      'have.value',
      '<+service.identifier>_<+enviroment.identifier>'
    )
  })

  it('should show monitored service as <+service.identifier>_<+enviroment.identifier>, if service and environment are expression', () => {
    cy.verifyStepInitialSetup()

    cy.intercept('GET', monitoresServices, serviceEnvironmentNoMonitoredServicesResponse).as('noMonitoredServices')

    // service definition
    cy.wait(1000)
    cy.get('.MultiTypeInput--FIXED').click()
    cy.findByText('Expression').click()
    cy.get('input[name="serviceRef"]').clear().type('<+pipeline>')
    cy.contains('p', 'Kubernetes').click()

    cy.wait(500)

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.wait(1000)
    cy.get('.MultiTypeInput--FIXED').click()
    cy.findByText('Expression').click()
    cy.get('input[name="environmentRef"]').clear().type('<+pipeline>')
    cy.wait(500)

    cy.verifyStepSelectConnector()

    cy.wait(500)

    cy.verifyStepSelectStrategyAndVerifyStep()

    cy.findByRole('button', { name: /Click to autocreate a monitored service/i }).should('not.exist')
    cy.findByText(/^Health Sources$/i).should('not.exist')
    cy.get("input[name='spec.monitoredServiceRef']").should(
      'have.value',
      '<+service.identifier>_<+enviroment.identifier>'
    )
  })

  it('should show required fields message, if service and environment values are not filled', () => {
    cy.verifyStepInitialSetup()
    cy.contains('p', 'Kubernetes').click()

    // service definition
    cy.wait(1000)

    cy.contains('span', 'Infrastructure').click({ force: true })

    cy.findByText('Service is required').should('exist')

    cy.get('input[name="serviceRef"]').click({ force: true })
    cy.contains('p', 'testService').click({ force: true })

    cy.findByText('Service is required').should('not.exist')

    cy.wait(500)

    // Infrastructure definition
    cy.contains('span', 'Infrastructure').click({ force: true })
    cy.wait(500)
    cy.findByTestId('execution').click()

    cy.findByText('Environment is required').should('exist')

    cy.get('input[name="environmentRef"]').click({ force: true })
    cy.contains('p', 'testEnv').click({ force: true })

    cy.findByText('Environment is required').should('not.exist')
  })
})
