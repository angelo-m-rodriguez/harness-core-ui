/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { get, isNumber } from 'lodash-es'
import { getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER } from '@connectors/constants'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import type { StringKeys } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import {
  buildBitbucketPayload,
  buildGithubPayload,
  buildGitlabPayload,
  buildGitPayload,
  buildAWSPayload
} from '@connectors/pages/connectors/utils/ConnectorUtils'
import StepGitAuthentication from '@connectors/components/CreateConnector/GitConnector/StepAuth/StepGitAuthentication'
import StepGitlabAuthentication from '@connectors/components/CreateConnector/GitlabConnector/StepAuth/StepGitlabAuthentication'
import StepGithubAuthentication from '@connectors/components/CreateConnector/GithubConnector/StepAuth/StepGithubAuthentication'
import StepBitbucketAuthentication from '@connectors/components/CreateConnector/BitbucketConnector/StepAuth/StepBitbucketAuthentication'
import StepAWSAuthentication from '@connectors/components/CreateConnector/AWSConnector/StepAuth/StepAWSAuthentication'
export const AllowedTypes = ['Git', 'Github', 'GitLab', 'Bitbucket', 'S3']
export type ConnectorTypes = 'Git' | 'Github' | 'GitLab' | 'Bitbucket' | 'S3'

export const ConnectorIcons: any = {
  Git: 'service-github',
  Github: 'github',
  GitLab: 'service-gotlab',
  Bitbucket: 'bitbucket',
  S3: 's3-step'
}

export const ConnectorMap: Record<string, ConnectorInfoDTO['type']> = {
  Git: Connectors.GIT,
  Github: Connectors.GITHUB,
  GitLab: Connectors.GITLAB,
  Bitbucket: Connectors.BITBUCKET,
  S3: Connectors.AWS
}

export const ConnectorLabelMap: Record<ConnectorTypes, StringKeys> = {
  Git: 'pipeline.manifestType.gitConnectorLabel',
  Github: 'common.repo_provider.githubLabel',
  GitLab: 'common.repo_provider.gitlabLabel',
  Bitbucket: 'pipeline.manifestType.bitBucketLabel',
  S3: 'pipelineSteps.awsConnectorLabel'
}

export const getBuildPayload = (type: ConnectorTypes) => {
  if (type === Connectors.GIT) {
    return buildGitPayload
  }
  if (type === Connectors.GITHUB) {
    return buildGithubPayload
  }
  if (type === Connectors.BITBUCKET) {
    return buildBitbucketPayload
  }
  if (type === Connectors.GITLAB) {
    return buildGitlabPayload
  }
  if (type === Connectors.AWS) {
    return buildAWSPayload
  }
  return () => ({})
}

export const GetNewConnector = (
  connectorType: string,
  isEditMode: boolean,
  setIsEditMode: (bool: boolean) => void,
  accountId: string,
  projectIdentifier: string,
  orgIdentifier: string,
  name: string
): JSX.Element | null => {
  switch (connectorType) {
    case Connectors.GIT:
      return (
        <StepGitAuthentication
          name={name}
          onConnectorCreated={() => {
            // Handle on success
          }}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          connectorInfo={undefined}
          accountId={accountId}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
        />
      )
    case Connectors.GITHUB:
      return (
        <StepGithubAuthentication
          name={name}
          onConnectorCreated={() => {
            // Handle on success
          }}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          connectorInfo={undefined}
          accountId={accountId}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
        />
      )
    case Connectors.GITLAB:
      return (
        <StepGitlabAuthentication
          name={name}
          identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
          onConnectorCreated={() => {
            // Handle on success
          }}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          connectorInfo={undefined}
          accountId={accountId}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
        />
      )
    case Connectors.BITBUCKET:
      return (
        <StepBitbucketAuthentication
          name={name}
          onConnectorCreated={() => {
            // Handle on success
          }}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          connectorInfo={undefined}
          accountId={accountId}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
        />
      )
    case Connectors.AWS:
      return (
        <StepAWSAuthentication
          name={name}
          accountId={accountId}
          orgIdentifier={orgIdentifier}
          projectIdentifier={projectIdentifier}
          connectorInfo={undefined}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />
      )
  }
  return null
}

export const FormatFilePaths = (values: any, prevStepData: any, index?: number) => {
  // checking for number as index 0 produces false
  if (isNumber(index)) {
    const param = get(values, `spec.configuration.parameters[${index}]`)
    const paramConnectorRef = prevStepData?.spec?.configuration?.parameters?.store?.spec?.connectorRef
    const paramConnectorRefValue = paramConnectorRef?.value || paramConnectorRef
    const region = prevStepData?.spec?.configuration?.parameters?.store?.spec?.region
    // changed connector so reset form values
    if (param?.store?.spec?.connectorRef !== paramConnectorRefValue) {
      return {
        spec: {
          configuration: {
            parameters: {
              identifier: '',
              store: {
                type: prevStepData?.selectedConnector === 'S3' ? 'S3Url' : prevStepData?.selectedConnector,
                spec: {
                  connectorRef: paramConnectorRef,
                  ...(region && { region: region }),
                  paths: ['']
                }
              }
            }
          }
        }
      }
    }
    return {
      spec: {
        configuration: {
          parameters: {
            identifier: param?.identifier,
            store: {
              type: prevStepData?.selectedConnector === 'S3' ? 'S3Url' : prevStepData?.selectedConnector,
              spec: {
                ...param?.store?.spec,
                connectorRef: paramConnectorRef,
                ...(region && { region: region }),
                paths: param?.store?.spec?.paths || param?.store?.spec?.urls
              }
            }
          }
        }
      }
    }
  }
  const filePath = get(values, 'spec.configuration.templateFile.spec.store.spec.paths')
  let initialConnectorRef = get(values?.spec?.configuration?.templateFile?.spec?.store?.spec, 'connectorRef')
  initialConnectorRef = initialConnectorRef?.value || initialConnectorRef
  const connectorRef = prevStepData?.spec?.configuration?.templateFile?.spec?.store?.spec?.connectorRef
  const connectorRefValue = connectorRef?.value || connectorRef
  if (connectorRefValue !== initialConnectorRef) {
    return {
      spec: {
        configuration: {
          templateFile: {
            spec: {
              store: {
                type: prevStepData?.selectedConnector,
                spec: {
                  paths: [''],
                  connectorRef: connectorRef
                }
              }
            }
          }
        }
      }
    }
  }
  return {
    spec: {
      configuration: {
        templateFile: {
          spec: {
            store: {
              type: prevStepData?.selectedConnector,
              ...values?.spec?.configuration?.templateFile?.spec?.store,
              spec: {
                ...values?.spec?.configuration?.templateFile?.spec?.store?.spec,
                paths: isRuntime(filePath) ? [filePath] : filePath,
                connectorRef: connectorRef
              }
            }
          }
        }
      }
    }
  }
}

export const ConnectorStepTitle = (isParam: boolean): keyof StringsMap => {
  if (isParam) {
    return 'cd.cloudFormation.paramFileConnector'
  }
  return 'cd.cloudFormation.templateFileConnector'
}
const parameterFileDetails = 'cd.cloudFormation.parameterFileDetails'
export const FileStoreTitle = (isParam: boolean): keyof StringsMap => {
  if (isParam) {
    return parameterFileDetails
  }
  return 'cd.cloudFormation.templateFileStore'
}

export const StepTwoTitle = (isParam: boolean): keyof StringsMap => {
  if (isParam) {
    return parameterFileDetails
  }
  return 'cd.cloudFormation.templateFileStore'
}

export const FormatRemoteValues = (initialValues: any, paramIndex?: number) => {
  if (isNumber(paramIndex)) {
    return {
      spec: {
        configuration: {
          parameters: initialValues.spec.configuration?.parameters
            ? initialValues.spec.configuration?.parameters[paramIndex]
            : null
        }
      }
    }
  }
  return {
    spec: {
      configuration: {
        templateFile: {
          ...initialValues?.spec?.configuration?.templateFile
        }
      }
    }
  }
}

export const RemoteFileStorePath = (isParam: boolean, isS3: boolean): keyof StringsMap => {
  if (isParam && isS3) {
    return 'cd.cloudFormation.urls'
  } else if (isParam) {
    return parameterFileDetails
  }
  return 'pipeline.manifestType.osTemplatePath'
}

/* istanbul ignore next */
export const isRuntime = (value: string): boolean => getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME

export const FormatRemoteTagsData = (initialValues: any, prevStepData: any) => {
  const region = prevStepData?.spec?.store?.spec?.region
  const connectorRef = prevStepData?.spec?.store?.spec?.connectorRef
  const connectorRefValue = connectorRef?.value || connectorRef

  const initialConnectorRef = initialValues?.spec?.configuration?.tags?.spec?.store?.spec?.connectorRef
  const initialConnectorRefValue = initialConnectorRef?.value || initialConnectorRef

  const tags = {
    types: 'Remote',
    spec: {
      store: {
        type: prevStepData?.selectedConnector,
        spec: {
          connectorRef,
          ...(prevStepData?.selectedConnector == 'S3' && region && { region })
        }
      }
    }
  }

  // if we change the connector reset the initial form data
  if (connectorRefValue !== initialConnectorRefValue) {
    return tags
  }

  const filePath = initialValues?.spec?.configuration?.tags?.spec?.store?.spec?.paths
  const paths = isRuntime(filePath) ? [filePath] : filePath
  const initialTags = initialValues?.spec?.configuration?.tags?.spec?.store?.spec
  tags.spec.store.spec.paths = paths
  if (prevStepData?.selectedConnector !== 'S3') {
    const gitDetails = {
      ...tags?.spec?.store?.spec,
      ...(initialTags?.repoName && { repoName: initialTags?.repoName }),
      ...(initialTags?.gitFetchType && { gitFetchType: initialTags?.gitFetchType }),
      ...(initialTags?.branch && { branch: initialTags?.branch }),
      ...(initialTags?.commitId && { commitId: initialTags?.commitId })
    }
    tags.spec.store.spec = gitDetails
  }

  return tags
}
