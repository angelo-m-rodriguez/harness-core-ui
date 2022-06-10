/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@harness/uicore'
import { Connectors } from '@connectors/constants'
import type { StringKeys } from 'framework/strings'
import type { ConnectorInfoDTO } from 'services/cd-ng'
import {
  buildBitbucketPayload,
  buildGithubPayload,
  buildGitlabPayload,
  buildGitPayload
} from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { K8sManifestStores, K8sManifestTypes } from './K8sInterface'
export const K8sManifestDataType: Record<K8sManifestTypes, K8sManifestTypes> = {
  Values: 'Values',
  OpenshiftParam: 'OpenshiftParam',
  KustomizePatches: 'KustomizePatches'
}
export const allowedManifestTypes: Record<string, Array<K8sManifestTypes>> = {
  Kubernetes: [K8sManifestDataType.Values, K8sManifestDataType.OpenshiftParam, K8sManifestDataType.KustomizePatches],
  NativeHelm: [K8sManifestDataType.Values]
}

export const K8sManifestStoreMap: { [key: string]: K8sManifestStores } = {
  Git: 'Git',
  Github: 'Github',
  GitLab: 'GitLab',
  Bitbucket: 'Bitbucket',
  Inline: 'Inline'
}

export const K8smanifestTypeIcons: Record<K8sManifestTypes, IconName> = {
  Values: 'functions',
  OpenshiftParam: 'openshift-params',
  KustomizePatches: 'kustomizeparam'
}

export const K8smanifestTypeLabels: Record<K8sManifestTypes, StringKeys> = {
  Values: 'pipeline.manifestTypeLabels.ValuesYaml',
  OpenshiftParam: 'pipeline.manifestTypeLabels.OpenshiftParam',
  KustomizePatches: 'pipeline.manifestTypeLabels.KustomizePatches'
}

export const K8sManifestToConnectorMap: Record<K8sManifestStores | string, ConnectorInfoDTO['type']> = {
  Git: Connectors.GIT,
  Github: Connectors.GITHUB,
  GitLab: Connectors.GITLAB,
  Bitbucket: Connectors.BITBUCKET
}

export const K8smanifestStoreTypes: Array<K8sManifestStores> = [
  K8sManifestStoreMap.Git,
  K8sManifestStoreMap.Github,
  K8sManifestStoreMap.GitLab,
  K8sManifestStoreMap.Bitbucket,
  K8sManifestStoreMap.Inline
]
export const K8sManifestTypetoStoreMap: Record<K8sManifestTypes, K8sManifestStores[]> = {
  Values: K8smanifestStoreTypes,
  OpenshiftParam: K8smanifestStoreTypes,
  KustomizePatches: K8smanifestStoreTypes
}

export const getBuildPayload = (type: ConnectorInfoDTO['type']) => {
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
  return () => ({})
}
