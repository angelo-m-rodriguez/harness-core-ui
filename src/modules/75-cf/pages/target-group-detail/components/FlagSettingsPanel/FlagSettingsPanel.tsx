/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { PageError, useToaster } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { Feature, Segment, usePatchSegment } from 'services/cf'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { getErrorMessage } from '@cf/utils/CFUtils'
import { PERCENTAGE_ROLLOUT_VALUE } from '@cf/constants'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '@cf/components/TargetManagementFlagConfigurationPanel/types'
import TargetManagementFlagConfigurationPanel from '@cf/components/TargetManagementFlagConfigurationPanel/TargetManagementFlagConfigurationPanel'
import useGetTargetGroupFlags from '../../hooks/useGetTargetGroupFlags'
import { getFlagSettingsInstructions } from './flagSettingsInstructions'

export interface FlagSettingsPanelProps {
  targetGroup: Segment
}

const FlagSettingsPanel: FC<FlagSettingsPanelProps> = ({ targetGroup }) => {
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const { accountId: accountIdentifier, orgIdentifier, projectIdentifier } = useParams<Record<string, string>>()

  const {
    data: flags,
    loading,
    error,
    refetch
  } = useGetTargetGroupFlags({
    targetGroup,
    accountIdentifier,
    orgIdentifier,
    projectIdentifier
  })

  const initialValues = useMemo<FormValues>(
    () => ({
      flags: (flags || []).reduce((values, flag) => {
        const serve = flag.envProperties?.rules?.find(({ clauses }) =>
          clauses.some(
            ({ op, values: segmentIds }) => op === 'segmentMatch' && segmentIds.includes(targetGroup.identifier)
          )
        )?.serve

        if (serve?.variation) {
          return { ...values, [flag.identifier]: { variation: serve.variation } }
        } else {
          return {
            ...values,
            [flag.identifier]: {
              variation: PERCENTAGE_ROLLOUT_VALUE,
              percentageRollout: serve?.distribution
            }
          }
        }
      }, {})
    }),
    [flags, targetGroup.identifier]
  )

  const { mutate: patchTargetGroup } = usePatchSegment({
    identifier: targetGroup.identifier,
    queryParams: {
      environmentIdentifier: targetGroup.environment as string,
      projectIdentifier,
      accountIdentifier,
      orgIdentifier
    }
  })

  const onChange = useCallback(
    async (values: FormValues) => {
      const instructions = getFlagSettingsInstructions(
        targetGroup.identifier,
        values,
        initialValues,
        flags as Feature[]
      )

      try {
        await patchTargetGroup({ instructions })
        showSuccess(getString('cf.segmentDetail.updateSuccessful'))
        refetch()
      } catch (e) {
        showError(getRBACErrorMessage(e))
      }
    },
    [
      targetGroup.identifier,
      initialValues,
      flags,
      patchTargetGroup,
      showSuccess,
      refetch,
      showError,
      getRBACErrorMessage
    ]
  )

  if (error) {
    return <PageError message={getErrorMessage(error)} onClick={() => refetch()} />
  }

  if (loading) {
    return <ContainerSpinner height="100%" flex={{ align: 'center-center' }} />
  }

  return (
    <TargetManagementFlagConfigurationPanel
      includePercentageRollout
      item={targetGroup}
      flags={flags as Feature[]}
      onChange={onChange}
      initialValues={initialValues}
      noFlagsMessage={getString('cf.segmentDetail.noFlags')}
    />
  )
}

export default FlagSettingsPanel
