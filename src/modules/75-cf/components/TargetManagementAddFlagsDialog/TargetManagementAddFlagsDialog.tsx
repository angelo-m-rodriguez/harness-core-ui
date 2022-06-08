/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Form, Formik } from 'formik'
import { Container, ExpandingSearchInput, ModalDialog, Page } from '@harness/uicore'
import type { ObjectSchema } from 'yup'
import * as yup from 'yup'
import { Feature, Features, Segment, Target, useGetAllFeatures } from 'services/cf'
import { useStrings } from 'framework/strings'
import { CF_DEFAULT_PAGE_SIZE, getErrorMessage } from '@cf/utils/CFUtils'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import imageUrl from '@cf/images/Feature_Flags_Teepee.svg'
import usePercentageRolloutValidationSchema from '@cf/hooks/usePercentageRolloutValidationSchema'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '../TargetManagementFlagConfigurationPanel/types'
import TargetManagementFlagsListing from '../TargetManagementFlagsListing/TargetManagementFlagsListing'
import { NoData } from '../NoData/NoData'
import NoSearchResults from '../NoData/NoSearchResults'
import DialogFooter from './DialogFooter'
import { STATUS } from './types'

import css from './TargetManagementAddFlagsDialog.module.scss'

export interface TargetManagementAddFlagsDialogProps {
  item: Target | Segment
  title: string
  hideModal: () => void
  onAdd: (values: FormValues) => Promise<void>
  existingFlagIds: string[]
  includePercentageRollout: boolean
}

const TargetManagementAddFlagsDialog: FC<TargetManagementAddFlagsDialogProps> = ({
  item,
  hideModal,
  onAdd,
  title,
  existingFlagIds,
  includePercentageRollout
}) => {
  const { getString } = useStrings()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [pageNumber, setPageNumber] = useState<number>(0)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const { accountId: accountIdentifier, orgIdentifier, projectIdentifier } = useParams<Record<string, string>>()

  const {
    data: flags,
    loading: loadingFlags,
    error: flagsError,
    refetch: refetchFlags
  } = useGetAllFeatures({
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier: item.environment,
      name: searchTerm,
      pageNumber,
      pageSize: CF_DEFAULT_PAGE_SIZE,
      excludedFeatures: existingFlagIds.join(',')
    }
  })

  const state = useMemo<STATUS>(() => {
    if (flagsError) {
      return STATUS.error
    } else if (submitting) {
      return STATUS.submitting
    } else if (loadingFlags) {
      return !searchTerm && !flags ? STATUS.initialLoading : STATUS.loading
    } else if (flags?.itemCount === 0) {
      return searchTerm ? STATUS.noSearchResults : STATUS.noFlags
    }

    return STATUS.ok
  }, [flagsError, submitting, loadingFlags, flags, searchTerm])

  const onSubmit = useCallback(
    async (values: FormValues) => {
      setSubmitting(true)

      await onAdd(values)

      setSubmitting(false)
    },
    [onAdd]
  )

  const percentageRolloutValidationSchema = usePercentageRolloutValidationSchema()

  const validationSchema = useMemo(
    () =>
      yup.object({
        flags: yup.lazy(obj =>
          yup.object(
            Object.keys(obj as FormValues['flags']).reduce<Record<string, ObjectSchema>>(
              (objShape, key) => ({
                ...objShape,
                [key]: yup.object({
                  variation: yup.string().when('added', {
                    is: true,
                    then: yup.string().required(getString('cf.segmentDetail.variationIsRequired'))
                  }),
                  percentageRollout: includePercentageRollout
                    ? percentageRolloutValidationSchema
                    : yup.string().optional()
                })
              }),
              {}
            )
          )
        )
      }),
    [includePercentageRollout, percentageRolloutValidationSchema]
  )

  const displayForm = [STATUS.ok, STATUS.loading, STATUS.noSearchResults, STATUS.submitting].includes(state)

  return (
    <Formik<FormValues> initialValues={{ flags: {} }} onSubmit={onSubmit} validationSchema={validationSchema}>
      <ModalDialog
        width={740}
        height={720}
        enforceFocus={false}
        isOpen={true}
        onClose={hideModal}
        title={title}
        toolbar={
          displayForm && (
            <ExpandingSearchInput alwaysExpanded onChange={newSearchTerm => setSearchTerm(newSearchTerm.trim())} />
          )
        }
        footer={
          <DialogFooter flags={flags as Features} state={state} setPageNumber={setPageNumber} onCancel={hideModal} />
        }
      >
        <>
          {state === STATUS.error && (
            <Page.Error message={getErrorMessage(flagsError)} onClick={() => refetchFlags()} />
          )}

          {state === STATUS.initialLoading && <ContainerSpinner height="100%" flex={{ align: 'center-center' }} />}

          {state === STATUS.noFlags && (
            <Container height="100%" flex={{ align: 'center-center' }}>
              <NoData
                imageURL={imageUrl}
                message={getString('cf.targetManagementFlagConfiguration.noFlagsAvailable')}
              />
            </Container>
          )}

          {displayForm && (
            <>
              {state === STATUS.loading && <ContainerSpinner flex={{ align: 'center-center' }} />}

              {state === STATUS.noSearchResults && <NoSearchResults />}

              {[STATUS.submitting, STATUS.ok].includes(state) && (
                <Form>
                  <fieldset className={css.fieldset} disabled={state === STATUS.submitting}>
                    <TargetManagementFlagsListing
                      flags={flags?.features as Feature[]}
                      includeAddFlagCheckbox
                      includePercentageRollout={includePercentageRollout}
                    />
                  </fieldset>
                </Form>
              )}
            </>
          )}
        </>
      </ModalDialog>
    </Formik>
  )
}

export default TargetManagementAddFlagsDialog
