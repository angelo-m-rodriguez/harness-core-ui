/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { getErrorInfoFromErrorObject, useToaster } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { Feature, Target, useGetAllFeatures, usePatchTarget } from 'services/cf'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { Page } from '@common/exports'
import { getErrorMessage } from '@cf/utils/CFUtils'
import type { TargetManagementFlagConfigurationPanelFormValues as FormValues } from '@cf/components/TargetManagementFlagConfigurationPanel/types'
import TargetManagementFlagConfigurationPanel from '@cf/components/TargetManagementFlagConfigurationPanel/TargetManagementFlagConfigurationPanel'
import buildInstructions from './buildInstructions'

export interface FlagSettingsProps {
  target: Target
}

const FlagSettings: FC<FlagSettingsProps> = ({ target }) => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { accountId: accountIdentifier, projectIdentifier, orgIdentifier } = useParams<Record<string, string>>()

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
      environmentIdentifier: target.environment,
      targetIdentifierFilter: target.identifier,
      pageSize: 10000 // bring back everything
    }
  })

  const initialValues = useMemo<FormValues>(
    () => ({
      flags: (flags?.features || []).reduce(
        (values, { identifier: flagIdentifier, envProperties }) => ({
          ...values,
          [flagIdentifier]: {
            variation: /* istanbul ignore else */ envProperties?.variationMap?.find(({ targets }) =>
              targets?.find(({ identifier }) => identifier === target.identifier)
            )?.variation
          }
        }),
        {}
      )
    }),
    [flags?.features, target.identifier]
  )

  const { mutate: patchTarget } = usePatchTarget({
    identifier: target.identifier,
    queryParams: {
      orgIdentifier,
      projectIdentifier,
      accountIdentifier,
      environmentIdentifier: target.environment
    }
  })

  const onChange = useCallback(
    async (values: FormValues) => {
      const instructions = buildInstructions(values, initialValues)

      /* istanbul ignore else */
      if (instructions.length) {
        try {
          await patchTarget({ instructions })
          refetchFlags()
        } catch (e) {
          showError(getErrorInfoFromErrorObject(e))
        }
      }
    },
    [initialValues, patchTarget, refetchFlags, showError]
  )

  const onAdd = useCallback(
    async (values: FormValues) => {
      const instructions = buildInstructions(values, { flags: {} })

      /* istanbul ignore else */
      if (instructions.length) {
        try {
          await patchTarget({ instructions })
          refetchFlags()
        } catch (e) {
          showError(getErrorInfoFromErrorObject(e))
        }
      }
    },
    [patchTarget, refetchFlags, showError]
  )

  if (loadingFlags) {
    return <ContainerSpinner flex={{ align: 'center-center' }} />
  }

  if (flagsError) {
    return <Page.Error message={getErrorMessage(flagsError)} onClick={() => refetchFlags()} />
  }

  return (
    <TargetManagementFlagConfigurationPanel
      item={target}
      flags={flags?.features as Feature[]}
      onChange={onChange}
      onAdd={onAdd}
      initialValues={initialValues}
      noFlagsMessage={getString('cf.targetDetail.noFlagConfigured')}
      addFlagsDialogTitle={getString('cf.targetDetail.addFlagToTarget')}
    />
  )
}

export default FlagSettings
