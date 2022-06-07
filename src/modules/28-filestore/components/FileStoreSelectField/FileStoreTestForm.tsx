/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Formik, FormikForm, Text, FormInput, Button } from '@wings-software/uicore'
import { Color } from '@harness/design-system'

import * as Yup from 'yup'

import { useStrings } from 'framework/strings'
import FileStoreSelectInput from './FileStoreSelectField'

export interface SSHConfigFormData {
  fileStore: any
  texttest: any
}

const TestForm: React.FC = () => {
  //   const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  //   const [saving, setSaving] = useState(false)
  const { getString } = useStrings()

  const validationSchema = Yup.object().shape({
    fileStore: Yup.string().trim().required(getString('validation.branchName'))
  })

  return (
    <>
      <Container padding="small" width={400} style={{ minHeight: '500px' }}>
        <Text margin={{ bottom: 'xlarge' }} font={{ size: 'medium' }} color={Color.BLACK}>
          {/* {getString('secrets.createSSHCredWizard.titleAuth')} */}
        </Text>
        <Formik<SSHConfigFormData>
          onSubmit={() => {
            ;() => null
          }}
          formName="fileStoreTest"
          validationSchema={validationSchema}
          initialValues={{
            fileStore: '',
            texttest: ''
          }}
        >
          {() => {
            return (
              <FormikForm>
                <FormInput.Text name="texttest" />
                <FileStoreSelectInput name="fileStore" label="File store test label" placeholder="Select" />
                <Button type="submit">submit</Button>
              </FormikForm>
            )
          }}
        </Formik>
      </Container>
    </>
  )
}

export default TestForm
