/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import type { ResponseSecretResponseWrapper } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import type { SecretsPathProps } from '@common/interfaces/RouteInterfaces'
import EntitySetupUsage from '@common/pages/entityUsage/EntityUsage'
import { EntityType } from '@common/pages/entityUsage/EntityConstants'

interface ReferencedByProps {
  secretData?: ResponseSecretResponseWrapper
}
const SecretReferences: React.FC<ReferencedByProps> = props => {
  const { secretId } = useParams<SecretsPathProps>()
  const { getString } = useStrings()

  useDocumentTitle([
    getString('common.references'),
    props.secretData?.data?.secret.name || '',
    getString('common.secrets')
  ])

  return (
    <>
      <EntitySetupUsage entityType={EntityType.Secrets} entityIdentifier={secretId} />
    </>
  )
}

export default SecretReferences
