/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type {
  AccountPathProps,
  OrgPathProps,
  ProjectPathProps,
  PipelinePathProps,
  TriggerPathProps,
  ExecutionPathProps,
  ConnectorPathProps,
  SecretsPathProps,
  PipelineType,
  FeatureFlagPathProps,
  SegmentPathProps,
  CVDataSourceTypePathProps,
  BuildPathProps,
  EnvironmentPathProps,
  DelegatePathProps,
  DelegateConfigProps,
  InputSetPathProps,
  VerificationPathProps,
  TargetPathProps,
  ModulePathParams,
  RolePathProps,
  ResourceGroupPathProps,
  UserGroupPathProps,
  UserPathProps,
  ServiceAccountPathProps,
  ServicePathProps,
  TemplateStudioPathProps,
  EnvironmentGroupPathProps,
  VariablesPathProps
} from '@common/interfaces/RouteInterfaces'

export const accountPathProps: AccountPathProps = {
  accountId: ':accountId'
}

export const orgPathProps: OrgPathProps = {
  ...accountPathProps,
  orgIdentifier: ':orgIdentifier'
}

export const projectPathProps: ProjectPathProps = {
  ...orgPathProps,
  projectIdentifier: ':projectIdentifier'
}

export const pipelinePathProps: PipelinePathProps = {
  ...projectPathProps,
  pipelineIdentifier: ':pipelineIdentifier'
}

export const templatePathProps: TemplateStudioPathProps = {
  ...projectPathProps,
  templateIdentifier: ':templateIdentifier',
  templateType: ':templateType'
}

export const inputSetFormPathProps: InputSetPathProps = {
  ...pipelinePathProps,
  inputSetIdentifier: ':inputSetIdentifier'
}

export const triggerPathProps: TriggerPathProps = {
  ...pipelinePathProps,
  triggerIdentifier: ':triggerIdentifier'
}

export const executionPathProps: ExecutionPathProps = {
  ...pipelinePathProps,
  executionIdentifier: ':executionIdentifier',
  source: ':source(deployments|executions|builds)'
}

export const connectorPathProps: ConnectorPathProps = {
  connectorId: ':connectorId'
}
export const verificationPathProps: VerificationPathProps = {
  verificationId: ':verificationId'
}

export const secretPathProps: SecretsPathProps = {
  secretId: ':secretId'
}
export const variablePathProps: VariablesPathProps = {
  variableId: ':variableId'
}

export const rolePathProps: RolePathProps = {
  roleIdentifier: ':roleIdentifier'
}

export const userGroupPathProps: UserGroupPathProps = {
  userGroupIdentifier: ':userGroupIdentifier'
}

export const userPathProps: UserPathProps = {
  userIdentifier: ':userIdentifier'
}

export const serviceAccountProps: ServiceAccountPathProps = {
  serviceAccountIdentifier: ':serviceAccountIdentifier'
}

export const resourceGroupPathProps: ResourceGroupPathProps = {
  resourceGroupIdentifier: ':resourceGroupIdentifier'
}

export const delegatePathProps: DelegatePathProps = {
  delegateIdentifier: ':delegateIdentifier'
}

export const delegateConfigProps: DelegateConfigProps = {
  delegateConfigIdentifier: ':delegateConfigIdentifier'
}

export const modulePathProps: ModulePathParams = {
  module: ':module'
}

export const pipelineModuleParams: Record<keyof PipelineType<unknown>, 'ci' | 'cd' | 'cf' | ':module'> = {
  module: ':module'
}

export const featureFlagPathProps: FeatureFlagPathProps = {
  featureFlagIdentifier: ':featureFlagIdentifier'
}

export const cvDataSourceTypePathProps: CVDataSourceTypePathProps = {
  dataSourceType: ':dataSourceType'
}

export const buildPathProps: BuildPathProps = {
  ...projectPathProps,
  buildIdentifier: ':buildIdentifier'
}

export const environmentPathProps: EnvironmentPathProps = {
  environmentIdentifier: ':environmentIdentifier'
}

export const environmentGroupPathProps: EnvironmentGroupPathProps = {
  environmentGroupIdentifier: ':environmentGroupIdentifier'
}

export const segmentPathProps: SegmentPathProps = {
  segmentIdentifier: ':segmentIdentifier'
}

export const targetPathProps: TargetPathProps = {
  targetIdentifier: ':targetIdentifier'
}

export const servicePathProps: ServicePathProps = {
  serviceId: ':serviceId'
}

export function withAccountId<T>(fn: (args: T) => string) {
  return (params: T & { accountId: string }): string => {
    const path = fn(params)

    return `/account/${params.accountId}/${path.replace(/^\//, '')}`
  }
}

export function withOrgIdentifier<T>(fn: (args: T) => string) {
  return (params: T & { orgIdentifier: string }): string => {
    const path = fn(params)

    return `/orgs/${params.orgIdentifier}/${path.replace(/^\//, '')}`
  }
}

export function withProjectIdentifier<T>(fn: (args: T) => string) {
  return (params: T & { projectIdentifier: string }): string => {
    const path = fn(params)

    return `/projects/${params.projectIdentifier}/${path.replace(/^\//, '')}`
  }
}

export const getScopeBasedRoute = ({
  scope: { orgIdentifier, projectIdentifier, module },
  path
}: {
  scope: Partial<ProjectPathProps & ModulePathParams>
  path: string
}): string => {
  if (module && orgIdentifier && projectIdentifier) {
    return `/${module}/orgs/${orgIdentifier}/projects/${projectIdentifier}/setup/${path}`
  } else if (orgIdentifier && projectIdentifier) {
    return `/home/orgs/${orgIdentifier}/projects/${projectIdentifier}/setup/${path}`
  } else if (orgIdentifier) {
    return `/settings/organizations/${orgIdentifier}/setup/${path}`
  }
  return `/settings/${path}`
}

export const returnUrlParams = (url: string): string => `?returnUrl=${encodeURIComponent(url)}`

export const validateReturnUrl = (url: string): boolean => {
  const decodedUrl = decodeURIComponent(url)

  if (decodedUrl.startsWith('/')) {
    return true
  }

  try {
    const validUrl = new URL(decodedUrl)
    return window.location.hostname === validUrl.hostname
  } catch (_e) {
    return false
  }
}

export const returnLaunchUrl = (url: string): string => `${window.location.pathname.replace(/\/ng\//, '/')}${url}`
