/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Spinner } from '@blueprintjs/core'
import { Button, ButtonVariation, Dialog, Formik, FormikForm, Layout, SelectOption, useToaster } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { Clause, Segment, usePatchSegment } from 'services/cf'
import targetToSelectOption from '@cf/utils/targetToSelectOption'
import patch, { Instruction } from '@cf/utils/instructions'
import { getErrorMessage } from '@cf/utils/CFUtils'
import SpecifyIndividualTargets from './SpecifyIndividualTargets'
import TargetBasedOnConditions from './TargetBasedOnConditions'
import { getRulesInstructions, getTargetInstructions } from './getInstructions'

import css from './EditTargetGroupCriteriaDialog.module.scss'

export interface EditTargetGroupCriteriaDialogProps {
  hideModal: () => void
  targetGroup: Segment
  onUpdate: () => void
}

export interface EditTargetGroupCriteriaFormValues {
  included: SelectOption[]
  excluded: SelectOption[]
  rules: Clause[]
}

const EditTargetGroupCriteriaDialog: FC<EditTargetGroupCriteriaDialogProps> = ({
  hideModal,
  targetGroup,
  onUpdate
}) => {
  const { getString } = useStrings()
  const { accountId: accountIdentifier, orgIdentifier, projectIdentifier } = useParams<Record<string, string>>()
  const { showError, showSuccess } = useToaster()

  const { mutate: sendPatch, loading } = usePatchSegment({
    identifier: targetGroup.identifier,
    queryParams: {
      environmentIdentifier: targetGroup.environment as string,
      accountIdentifier,
      orgIdentifier,
      projectIdentifier
    }
  })

  const onSubmit = useCallback(
    (values: EditTargetGroupCriteriaFormValues) => {
      patch.segment.reset()

      const instructions: Instruction[] = [
        ...getTargetInstructions(
          targetGroup?.included || [],
          values.included,
          patch.creators.addToIncludeList,
          patch.creators.removeFromIncludeList
        ),
        ...getTargetInstructions(
          targetGroup?.excluded || [],
          values.excluded,
          patch.creators.addToExcludeList,
          patch.creators.removeFromExcludeList
        ),
        ...getRulesInstructions(targetGroup?.rules || [], values.rules)
      ]

      patch.segment.addAllInstructions(instructions)

      patch.segment
        .onPatchAvailable(async patchData => {
          try {
            await sendPatch(patchData)
            showSuccess(getString('cf.segmentDetail.updated'))
            hideModal()
            onUpdate()
          } catch (e) {
            showError(getErrorMessage(e), undefined, 'cf.send.patch.error')
          }
        })
        .onEmptyPatch(hideModal)
    },
    [
      getString,
      hideModal,
      onUpdate,
      sendPatch,
      showError,
      showSuccess,
      targetGroup?.excluded,
      targetGroup?.included,
      targetGroup?.rules
    ]
  )

  return (
    <Formik<EditTargetGroupCriteriaFormValues>
      formName="TargetGroupCriteria"
      onSubmit={onSubmit}
      initialValues={{
        included: (targetGroup.included || []).map(targetToSelectOption),
        excluded: (targetGroup.excluded || []).map(targetToSelectOption),
        rules: targetGroup.rules || []
      }}
    >
      {({ submitForm, values }) => (
        <Dialog
          className={css.dialog}
          isOpen
          enforceFocus={false}
          title={getString('cf.segmentDetail.targetGroupCriteria')}
          onClose={hideModal}
          footer={
            <Layout.Horizontal spacing="small">
              <Button variation={ButtonVariation.PRIMARY} type="submit" intent="primary" onClick={submitForm}>
                {getString('save')}
              </Button>
              <Button variation={ButtonVariation.TERTIARY} onClick={hideModal}>
                {getString('cancel')}
              </Button>
              {loading && (
                <span data-testid="saving-spinner">
                  <Spinner size={24} />
                </span>
              )}
            </Layout.Horizontal>
          }
        >
          <FormikForm>
            <Layout.Vertical spacing="small" className={css.body} padding="xsmall">
              <SpecifyIndividualTargets targetGroup={targetGroup} />
              <TargetBasedOnConditions targetGroup={targetGroup} values={values} />
            </Layout.Vertical>
          </FormikForm>
        </Dialog>
      )}
    </Formik>
  )
}

export default EditTargetGroupCriteriaDialog
