/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  getSLOMetrics,
  getUserJourneysCall,
  listMonitoredServices,
  listMonitoredServicesCallResponse,
  listSLOMetricsCallResponse,
  listSLOsCall,
  listSLOsCallResponse,
  listUserJourneysCallResponse,
  updatedListSLOsCallResponse,
  getSLORiskCount,
  saveSLO,
  listRiskCountDataEmptyResponse,
  getMonitoredService,
  getMonitoredServiceResponse,
  createNotification,
  createNotificationResponse
} from '../../../support/85-cv/slos/constants'

describe('Create SLO with Notifications', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.login('test', 'test')

    cy.visitChangeIntelligence()
  })

  it('should be able to create Notifications with SLO', () => {
    cy.intercept('GET', listSLOsCall, listSLOsCallResponse)
    cy.intercept('GET', getUserJourneysCall, listUserJourneysCallResponse)
    cy.intercept('GET', listMonitoredServices, listMonitoredServicesCallResponse)
    cy.intercept('GET', getMonitoredService, getMonitoredServiceResponse)
    cy.intercept('GET', getSLOMetrics, listSLOMetricsCallResponse)
    cy.intercept('GET', getSLORiskCount, listRiskCountDataEmptyResponse)
    cy.intercept('POST', createNotification, createNotificationResponse)

    // Verifying NO SLOs state.
    cy.contains('p', 'SLOs').click()
    cy.contains('h2', 'You don’t have any SLO created yet').should('be.visible')

    cy.contains('span', 'Create SLO').click()

    // Filling details Under Name tab for SLO creation
    cy.fillName('SLO-1')

    // selecting monitored service
    cy.get('input[name="monitoredServiceRef"]').click()
    cy.contains('p', 'cvng_prod').click({ force: true })

    // selecting user journey
    cy.get('input[name="User Journey"]').click()
    cy.contains('p', 'new-one').click({ force: true })

    cy.contains('span', 'Continue').click({ force: true })

    // selecting health source
    cy.get('input[name="healthSourceRef"]').click()
    cy.contains('p', 'appd_cvng_prod').click({ force: true })

    // selecting event type
    cy.get('input[name="eventType"]').click()
    cy.contains('p', 'Bad').click({ force: true })

    // selecting Metric for Good requests
    cy.get('input[name="goodRequestMetric"]').click()
    cy.contains('p', 'number_of_slow_calls').click({ force: true })

    // selecting Metric for Good requests
    cy.wait(1000)
    cy.get('input[name="validRequestMetric"]').click()
    cy.contains('p', 'https_errors_per_min').click({ force: true })

    // Filling objective value
    cy.get('input[name="objectiveValue"]').type('2')

    // selecting condition for SLI value
    cy.get('input[name="objectiveComparator"]').click({ force: true })
    cy.contains('p', '<').click({ force: true })

    cy.contains('span', 'Continue').click({ force: true })

    // selecting condition for SLI value
    cy.get('input[name="periodLength"]').click()
    cy.contains('p', '7').click({ force: true })

    cy.intercept('POST', saveSLO, { statusCode: 200 }).as('saveSLO')
    cy.intercept('GET', listSLOsCall, updatedListSLOsCallResponse).as('updatedListSLOsCallResponse')

    // Adding Notification
    cy.contains('span', 'New Notification Rule').click({ force: true })

    cy.get('input[name="name"]').type('slo-notification')
    cy.contains('span', 'Continue').click({ force: true })

    cy.get('input[name="condition"]').click({ force: true })
    cy.contains('p', 'Error Budget Burn Rate is above').click({ force: true })

    cy.get('input[placeholder="%"]').type('5')
    cy.get('input[placeholder="min"]').type('60')
    cy.contains('span', 'Continue').click({ force: true })

    cy.get('[data-testid="notificationType"]').click({ force: true })
    cy.contains('p', 'Slack').click({ force: true })

    cy.get('input[name="webhookUrl"]').type(
      'https://hooks.slack.com/services/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'
    )

    cy.contains('span', 'Finish').click({ force: true })

    cy.contains('p', 'slo-notification').should('be.visible')
    cy.contains('p', 'SLO').should('be.visible')
    cy.contains('p', 'Slack').should('be.visible')
    cy.contains('span', 'Notification slo-notification has been successfully created').should('be.visible')

    cy.contains('span', 'Save').click({ force: true })

    cy.wait('@saveSLO')
    cy.contains('span', 'SLO created successfully').should('be.visible')
  })
})
