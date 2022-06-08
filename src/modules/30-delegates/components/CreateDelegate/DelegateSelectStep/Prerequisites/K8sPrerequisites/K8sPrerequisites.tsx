/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'

import { Layout, Text, Container } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { DelegateSizeDetails, useGetDelegateSizes } from 'services/portal'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import css from './K8sPrerequisites.module.scss'

const K8sPrerequisites = () => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { data: delegateSizes } = useGetDelegateSizes({
    queryParams: { accountId, orgId: orgIdentifier, projectId: projectIdentifier }
  })

  const delegateSizeMappings: DelegateSizeDetails[] | undefined = delegateSizes?.resource || []

  return (
    <>
      <Text className={css.prereq}>{getString('delegate.kubernetes.prerequisites')}</Text>
      <Container
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
          height: '340px',
          fontSize: '13px',
          lineHeight: '20px',
          /* or 154% */

          letterSpacing: '0.233333px'
        }}
      >
        <Text font={{ size: 'normal' }} className={css.preReqContent}>
          {getString('delegate.kubernetes.prerequisites_info1')}
        </Text>

        <Container>
          <Text inline className={css.preReqContent}>
            {getString('delegate.kubernetes.prerequisites_info2')}
          </Text>
          <Text inline font={{ weight: 'bold' }}>
            https://app.harness.io
          </Text>
        </Container>
        <Text className={css.preReqContent}>{getString('delegate.kubernetes.prerequisites_info3')}</Text>
        <Container>
          {delegateSizeMappings.map(size => (
            <Layout.Horizontal key={size.label}>
              <Text inline className={css.preReqContent} icon="arrow-right" iconProps={{ size: 8 }}>
                {getString('delegate.kubernetes.prerequisites_worload', {
                  ...size,
                  ram: (Number(size.ram) / 1000).toFixed(1)
                })}
              </Text>
            </Layout.Horizontal>
          ))}
        </Container>
        <Text className={css.preReqContent}>{getString('delegate.kubernetes.permissions_title')}</Text>
        <Container>
          <Layout.Horizontal>
            <Text className={css.preReqContent} icon="arrow-right" iconProps={{ size: 8 }}>
              {getString('delegate.kubernetes.permissions_info1')}
            </Text>
          </Layout.Horizontal>
          <Layout.Horizontal>
            <Text className={css.preReqContent} icon="arrow-right" iconProps={{ size: 8 }}>
              {getString('delegate.kubernetes.permissions_info2')}
            </Text>
          </Layout.Horizontal>
        </Container>
      </Container>
    </>
  )
}

export default K8sPrerequisites
