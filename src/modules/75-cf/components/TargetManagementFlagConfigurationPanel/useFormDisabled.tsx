/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { FC, ReactNode, useMemo } from 'react'
import { Utils } from '@harness/uicore'
import type { Segment, Target } from 'services/cf'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { useFeature } from '@common/hooks/useFeatures'
import type { ButtonProps } from '@rbac/components/Button/Button'
import { usePermission } from '@rbac/hooks/usePermission'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import usePlanEnforcement from '@cf/hooks/usePlanEnforcement'
import RBACTooltip from '@rbac/components/RBACTooltip/RBACTooltip'
import { FeatureWarningTooltip } from '@common/components/FeatureWarning/FeatureWarningWithTooltip'

export interface UseFormDisabledPayload {
  disabled: boolean
  planEnforcementProps: Partial<ButtonProps>
  ReasonTooltip: FC
}

export default function useFormDisabled(item: Target | Segment): UseFormDisabledPayload {
  const { isPlanEnforcementEnabled, isFreePlan } = usePlanEnforcement()
  const { enabled } = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.MAUS
    }
  })

  const planEnforcementProps: Partial<ButtonProps> = isPlanEnforcementEnabled
    ? {
        featuresProps: {
          featuresRequest: {
            featureNames: [FeatureIdentifier.MAUS]
          }
        }
      }
    : {}

  const planEnforcementFormDisabled = isPlanEnforcementEnabled && isFreePlan && !enabled
  const [hasPermission] = usePermission(
    {
      permissions: [PermissionIdentifier.EDIT_FF_TARGETGROUP],
      resource: {
        resourceType: ResourceType.ENVIRONMENT,
        resourceIdentifier: item.environment
      }
    },
    [item.environment]
  )

  const formDisabled = useMemo<boolean>(
    () => planEnforcementFormDisabled || !hasPermission,
    [hasPermission, planEnforcementFormDisabled]
  )

  const ReasonTooltip = useMemo<FC>(() => {
    let tooltip

    if (!hasPermission) {
      tooltip = (
        <RBACTooltip permission={PermissionIdentifier.EDIT_FF_TARGETGROUP} resourceType={ResourceType.ENVIRONMENT} />
      )
    } else if (planEnforcementFormDisabled) {
      tooltip = <FeatureWarningTooltip featureName={FeatureIdentifier.MAUS} />
    }

    return getDisabledReasonTooltip(tooltip)
  }, [hasPermission, planEnforcementFormDisabled])

  return {
    disabled: formDisabled,
    planEnforcementProps,
    ReasonTooltip
  }
}

function getDisabledReasonTooltip(tooltip: ReactNode): FC {
  return function DisabledReasonTooltip({ children }) {
    return (
      <Utils.WrapOptionalTooltip
        tooltip={tooltip as JSX.Element}
        tooltipProps={{ wrapperTagName: 'div', targetTagName: 'div', hoverCloseDelay: 50 }}
      >
        {children as JSX.Element}
      </Utils.WrapOptionalTooltip>
    )
  }
}
