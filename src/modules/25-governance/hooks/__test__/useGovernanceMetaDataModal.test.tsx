import React, { useState } from 'react'
import { Button } from '@harness/uicore'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import * as featureFlags from '@common/hooks/useFeatureFlag'
import mockImport from 'framework/utils/mockImport'
import { doesGovernanceHasErrorOrWarning } from '@governance/utils'
import { useGovernanceMetaDataModal } from '../useGovernanceMetaDataModal'
import governanceMetaData from './useGovernanceMetaDataModalData.json'
mockImport('@governance/EvaluationView', {
  EvaluationView: jest.fn().mockImplementation(() => <div>governance dialog</div>)
})
jest.spyOn(featureFlags, 'useFeatureFlag').mockImplementation(() => {
  return true
})
const Wrapped = (): React.ReactElement => {
  const [nextStep, setNextStep] = useState(false)
  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal({
    errorHeaderMsg: 'connectors.policyEvaluations.failedToSave',
    warningHeaderMsg: 'connectors.policyEvaluations.warning',
    considerWarningAsError: false
  })
  const { governanceMetaDataHasWarning } = doesGovernanceHasErrorOrWarning(governanceMetaData)
  const onBtnClick = () => {
    conditionallyOpenGovernanceErrorModal(governanceMetaData, () => {
      setNextStep(true)
    })
  }

  return (
    <>
      {nextStep && <span>next step</span>}
      {governanceMetaDataHasWarning && <span>has Error</span>}
      <Button className="governanceBtn" text="governanceBtn" onClick={onBtnClick} />
    </>
  )
}

describe('Governance Modal Test', () => {
  test('should work as expected', async () => {
    const { container, getByText, queryByText } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <Wrapped />
      </TestWrapper>
    )

    //Open dialog
    const btn = getByText('governanceBtn')
    const hasErrorSpan = getByText('has Error')
    await act(async () => {
      fireEvent.click(btn)
    })
    expect(container).toMatchSnapshot()
    const dialog = findDialogContainer()
    expect(dialog).toBeTruthy()
    expect(hasErrorSpan).toBeTruthy()
    expect(dialog).toMatchSnapshot()

    const nextStep = queryByText('next step')
    expect(nextStep).toBeFalsy()
    const closeBtn = dialog?.querySelector('.Dialog--close')
    if (closeBtn) {
      await act(async () => {
        fireEvent.click(closeBtn)
      })
    }
    const closeDialog = findDialogContainer()
    expect(closeDialog).toBeFalsy()
    await waitFor(() => expect(queryByText('next step')).toBeTruthy())
    const newNextStep = queryByText('next step')
    expect(newNextStep).toBeTruthy()
    expect(container).toMatchSnapshot()
  })
  test('doesGovernanceMetaData  warning working', () => {
    const { governanceMetaDataHasWarning } = doesGovernanceHasErrorOrWarning(governanceMetaData)
    expect(governanceMetaDataHasWarning).toBeTruthy()
  })
})
