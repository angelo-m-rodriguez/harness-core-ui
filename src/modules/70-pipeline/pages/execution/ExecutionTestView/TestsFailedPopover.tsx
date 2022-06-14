/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Heading, Layout, Text } from '@wings-software/uicore'
import Ansi from 'ansi-to-react'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import type { TestCase } from 'services/ti-service'
import css from './BuildTests.module.scss'

export function PopoverSection(props: { label: string; content: string; asPre?: boolean }): React.ReactElement {
  const { label, content, asPre } = props

  return (
    <Container>
      <Heading className={css.testPopoverHeading} level={3} font={{ weight: 'bold' }}>
        {label}
      </Heading>
      <Text className={css.testPopoverDetail} font={{ mono: true }}>
        {asPre ? <pre>{content}</pre> : <Ansi useClasses>{content}</Ansi>}
      </Text>
    </Container>
  )
}

export interface TestsFailedPopoverProps {
  testCase: TestCase
  openTestsFailedModal?: (errorContent: JSX.Element) => void
}

export function TestsFailedPopover({
  testCase,
  openTestsFailedModal
}: TestsFailedPopoverProps): React.ReactElement | null {
  const { getString } = useStrings()
  const {
    name,
    class_name,
    result: { status = '', message, desc, type } = {},
    stderr: stacktrace,
    stdout: output
  } = testCase

  const failed = ['error', 'failed'].includes(status)

  if (failed) {
    const errorContent = (
      <Layout.Vertical spacing="xlarge" padding="xlarge" className={css.testPopoverBody}>
        {name && <PopoverSection label={getString('pipeline.testsReports.testCaseName')} content={name} />}
        {class_name && <PopoverSection label={getString('pipeline.testsReports.className')} content={class_name} />}
        {status && <PopoverSection label={getString('pipeline.testsReports.status')} content={status} />}

        {type && <PopoverSection label={getString('pipeline.testsReports.type')} content={type} />}

        {message && <PopoverSection label={getString('pipeline.testsReports.failureMessage')} content={message} />}

        {desc && <PopoverSection label={getString('pipeline.testsReports.description')} content={desc} />}

        {stacktrace && <PopoverSection label={getString('pipeline.testsReports.stackTrace')} content={stacktrace} />}

        {output && <PopoverSection label={getString('pipeline.testsReports.consoleOutput')} content={output} />}
      </Layout.Vertical>
    )
    return (
      <Layout.Vertical>
        {errorContent}
        <Text
          padding="xlarge"
          style={{ cursor: 'pointer' }}
          color={Color.PRIMARY_7}
          onClick={e => {
            e.stopPropagation()
            openTestsFailedModal?.(errorContent)
          }}
        >
          {getString('pipeline.clickToExpandErrorDetails')}
        </Text>
      </Layout.Vertical>
    )
  }

  return null
}
