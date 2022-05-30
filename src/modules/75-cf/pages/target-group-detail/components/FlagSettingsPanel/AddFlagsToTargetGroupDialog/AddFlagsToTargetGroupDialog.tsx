/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Spinner } from '@blueprintjs/core'
import {
  Button,
  ButtonVariation,
  Container,
  Dialog,
  Formik,
  FormikForm,
  getErrorInfoFromErrorObject,
  Layout,
  Page,
  useToaster
} from '@harness/uicore'
import type { ObjectSchema } from 'yup'
import * as yup from 'yup'
import { useStrings } from 'framework/strings'
import { Features, Segment, useGetAllFeatures, usePatchSegment } from 'services/cf'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { CF_DEFAULT_PAGE_SIZE, getErrorMessage } from '@cf/utils/CFUtils'
import { NoData } from '@cf/components/NoData/NoData'
import imageUrl from '@cf/images/Feature_Flags_Teepee.svg'
import { AddFlagsToTargetGroupDialogStatus as STATUS, FlagSettingsFormRow } from '../../../TargetGroupDetailPage.types'
import usePercentageRolloutValidationSchema from '../../../hooks/usePercentageRolloutValidationSchema'
import { getAddFlagsInstruction } from '../flagSettingsInstructions'
import ListingWithSearchAndPagination from './ListingWithSearchAndPagination'

import css from './AddFlagsToTargetGroupDialog.module.scss'

export interface AddFlagToTargetGroupFormRow extends FlagSettingsFormRow {
  added?: boolean
}

export interface AddFlagsToTargetGroupFormValues {
  flags: Record<string, AddFlagToTargetGroupFormRow>
}

export interface AddFlagsToTargetGroupDialogProps {
  hideModal: () => void
  onChange: () => void
  targetGroup: Segment
  existingFlagIds: string[]
}

const AddFlagsToTargetGroupDialog: FC<AddFlagsToTargetGroupDialogProps> = ({
  targetGroup,
  hideModal,
  onChange,
  existingFlagIds
}) => {
  const { getString } = useStrings()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [pageNumber, setPageNumber] = useState<number>(0)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const { showError } = useToaster()

  const { accountId: accountIdentifier, orgIdentifier, projectIdentifier } = useParams<Record<string, string>>()

  const {
    data: flags,
    loading: loadingFlags,
    error: flagsError,
    refetch: refetchFlags
  } = useGetAllFeatures({
    queryParams: {
      accountIdentifier,
      projectIdentifier,
      orgIdentifier,
      environmentIdentifier: targetGroup.environment,
      sortByField: 'name',
      sortOrder: 'ASCENDING',
      pageNumber,
      pageSize: CF_DEFAULT_PAGE_SIZE,
      excludedFeatures: existingFlagIds.join(','),
      name: searchTerm
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

  const onSearch = useCallback((str: string) => {
    setSearchTerm(str.trim().toLocaleLowerCase())
    setPageNumber(0)
  }, [])

  const { mutate: patchTargetGroup } = usePatchSegment({
    identifier: targetGroup.identifier,
    queryParams: {
      environmentIdentifier: targetGroup.environment as string,
      projectIdentifier,
      accountIdentifier,
      orgIdentifier
    }
  })

  const onSubmit = useCallback(
    async (values: AddFlagsToTargetGroupFormValues) => {
      if (state !== STATUS.submitting) {
        setSubmitting(true)

        const instructions = [
          getAddFlagsInstruction(
            // extract identifier/variation pairings from the submitted form values
            Object.entries(values.flags).map(([identifier, { variation, percentageRollout }]) => ({
              identifier,
              variation,
              percentageRollout
            }))
          )
        ]

        try {
          await patchTargetGroup({ instructions })
          onChange()
          hideModal()
        } catch (e) {
          showError(getErrorInfoFromErrorObject(e))
        }

        setSubmitting(false)
      }
    },
    [state, patchTargetGroup, onChange, hideModal, showError]
  )

  const percentageRolloutValidationSchema = usePercentageRolloutValidationSchema()

  const validationSchema = useMemo(
    () =>
      yup.object({
        flags: yup.lazy(obj =>
          yup.object(
            Object.keys(obj as AddFlagsToTargetGroupFormValues['flags']).reduce<Record<string, ObjectSchema>>(
              (objShape, key) => ({
                ...objShape,
                [key]: yup.object({
                  variation: yup.string().when('added', {
                    is: true,
                    then: yup.string().required(getString('cf.segmentDetail.variationIsRequired'))
                  }),
                  percentageRollout: percentageRolloutValidationSchema
                })
              }),
              {}
            )
          )
        )
      }),
    []
  )

  return (
    <Formik<AddFlagsToTargetGroupFormValues>
      formName="AddFlagsToTargetGroup"
      onSubmit={values => {
        onSubmit(values)
      }}
      initialValues={{ flags: {} }}
      validationSchema={validationSchema}
    >
      {({ submitForm, values }) => {
        const flagCount = Object.values(values.flags).filter(({ added }) => added).length

        return (
          <Dialog
            className={css.dialog}
            isOpen
            enforceFocus={false}
            title={getString('cf.segmentDetail.addFlagToTargetGroup')}
            onClose={hideModal}
            footer={
              <Layout.Horizontal spacing="small" flex={{ alignItems: 'center' }}>
                <Button
                  variation={ButtonVariation.PRIMARY}
                  type="submit"
                  intent="primary"
                  onClick={submitForm}
                  disabled={!flagCount || submitting}
                >
                  {getString('cf.segmentDetail.addFlags', { flagCount })}
                </Button>
                <Button variation={ButtonVariation.SECONDARY} onClick={hideModal}>
                  {getString('cancel')}
                </Button>
                {submitting && (
                  <span data-testid="saving-spinner">
                    <Spinner size={24} />
                  </span>
                )}
              </Layout.Horizontal>
            }
          >
            <FormikForm disabled={submitting}>
              <Layout.Vertical className={css.body} spacing="small">
                {state === STATUS.error && (
                  <Page.Error message={getErrorMessage(flagsError)} onClick={() => refetchFlags()} />
                )}

                {state === STATUS.initialLoading && <ContainerSpinner flex={{ align: 'center-center' }} />}

                {state === STATUS.noFlags && (
                  <Container height="100%" flex={{ align: 'center-center' }}>
                    <NoData imageURL={imageUrl} message={getString('cf.segmentDetail.noFlagsAvailable')} />
                  </Container>
                )}

                {[STATUS.ok, STATUS.loading, STATUS.noSearchResults, STATUS.submitting].includes(state) && (
                  <ListingWithSearchAndPagination
                    state={state}
                    onSearch={onSearch}
                    flags={flags as Features}
                    setPageNumber={setPageNumber}
                    isFlagAdded={identifier => !!values.flags[identifier]?.added}
                  />
                )}
              </Layout.Vertical>
            </FormikForm>
          </Dialog>
        )
      }}
    </Formik>
  )
}

export default AddFlagsToTargetGroupDialog
