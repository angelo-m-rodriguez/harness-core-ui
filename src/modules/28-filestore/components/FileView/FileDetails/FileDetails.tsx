/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React from 'react'
import { Container } from '@harness/uicore'

import MonacoEditor from '@common/components/MonacoEditor/MonacoEditor'

export default function FileDetails(): React.ReactElement {
  return (
    <Container style={{ width: '100%' }}>
      <MonacoEditor
        height={800}
        // value={value}
        language={'plaintext'}
        options={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 14,
          minimap: {
            enabled: false
          },
          readOnly: false,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 60,
          wordWrap: 'on',
          scrollbar: {
            verticalScrollbarSize: 0
          },
          renderLineHighlight: 'none',
          wordWrapBreakBeforeCharacters: '',
          // mouseStyle: disabled ? 'default' : 'text',
          lineNumbersMinChars: 0
        }}
        // onChange={txt => formik.setFieldValue(name, txt)}
        {...({ name: 'testeditor' } as any)} // this is required for test cases
      />
    </Container>
  )
}
