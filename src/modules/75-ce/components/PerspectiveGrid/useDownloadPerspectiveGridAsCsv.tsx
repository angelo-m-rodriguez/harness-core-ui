/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  Container,
  Dialog,
  Text,
  Layout,
  Button,
  ButtonVariation,
  Formik,
  FormInput,
  FormikForm,
  getErrorInfoFromErrorObject
} from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { isUndefined, defaultTo } from 'lodash-es'
import * as Yup from 'yup'
import { useModalHook } from '@harness/use-modal'
import { useStrings } from 'framework/strings'
import { QlceViewEntityStatsDataPoint, useFetchperspectiveGridQuery } from 'services/ce/services'
import { useToaster } from '@common/exports'
import { downloadPerspectiveGridAsCsv } from '@ce/utils/downloadPerspectiveGridAsCsv'
import type { Column } from './Columns'

import css from './PerspectiveGrid.module.scss'

const MAX_ROWS_ALLOWED = 10000

interface Props {
  perspectiveTotalCount: number
  variables: Record<string, any>
  selectedColumnsToDownload: Column[]
  perspectiveName: string
}

interface DownloadConfig {
  fileName: string
  exportRowsUpto: string
  excludeRowsWithCost: string
}

export const useDownloadPerspectiveGridAsCsv = (options: Props) => {
  const { getString } = useStrings()
  const { showError } = useToaster()

  const { perspectiveTotalCount, variables, selectedColumnsToDownload, perspectiveName } = options

  const [downloadConfig, setDownloadConfig] = useState<DownloadConfig | undefined>()
  const dataRefetchRef = useRef(perspectiveTotalCount)

  const [downloadGridData, executeQuery] = useFetchperspectiveGridQuery({
    pause: Boolean(downloadConfig?.exportRowsUpto),
    variables: { ...variables, limit: Number(downloadConfig?.exportRowsUpto) || perspectiveTotalCount } as any
  })

  const downloadData = defaultTo(downloadGridData.data?.perspectiveGrid?.data, [])

  useEffect(() => {
    try {
      if (!isUndefined(downloadConfig)) {
        executeQuery({ requestPolicy: 'network-only' })

        dataRefetchRef.current = Number(downloadConfig.exportRowsUpto)
      }
    } catch (error) {
      showError(getErrorInfoFromErrorObject(error as Record<string, any>))
    }
  }, [downloadConfig])

  useEffect(() => {
    try {
      if (!isUndefined(downloadConfig) && dataRefetchRef.current === downloadData.length) {
        downloadPerspectiveGridAsCsv({
          csvFileName: downloadConfig.fileName,
          downloadData: downloadData as QlceViewEntityStatsDataPoint[],
          excludeRowsWithCost: downloadConfig.excludeRowsWithCost,
          selectedColumnsToDownload
        })
        closeDownloadCSVModal()
      }
    } catch (error) {
      showError(getErrorInfoFromErrorObject(error))
    }
  }, [downloadData, dataRefetchRef.current])

  const [openDownloadCSVModal, closeDownloadCSVModal] = useModalHook(() => {
    const maxNoOfRows = Math.min(perspectiveTotalCount, MAX_ROWS_ALLOWED)

    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={closeDownloadCSVModal}
        className={css.dialog}
        title={getString('ce.perspectives.exportCSV')}
      >
        <Formik
          formName="formikFormBasic"
          initialValues={{
            fileName: perspectiveName,
            exportRowsUpto: String(maxNoOfRows),
            excludeRowsWithCost: ''
          }}
          validationSchema={Yup.object().shape({
            fileName: Yup.string().trim().required(),
            exportRowsUpto: Yup.number()
              .required()
              .min(1, getString('ce.perspectives.noOfRowsGreaterThan'))
              .max(maxNoOfRows, getString('ce.perspectives.noOfRowsLessThan', { number: maxNoOfRows })),
            excludeRowsWithCost: Yup.number()
          })}
          onSubmit={({ fileName, exportRowsUpto, excludeRowsWithCost }) => {
            setDownloadConfig({ fileName, excludeRowsWithCost, exportRowsUpto })
          }}
        >
          {formikProps => {
            const showLongerDownloadTimeWarning =
              Number(formikProps.values.exportRowsUpto) < maxNoOfRows && Number(formikProps.values.exportRowsUpto) > 500

            return (
              <FormikForm>
                <Layout.Vertical
                  flex={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
                  style={{ minHeight: 280 }}
                >
                  <Container width={'100%'}>
                    <Text font={{ variation: FontVariation.BODY2 }} margin={{ bottom: 'small' }}>
                      {getString('ce.perspectives.filename')}
                    </Text>
                    <FormInput.Text name="fileName" />
                  </Container>
                  <Container>
                    <Text font={{ variation: FontVariation.BODY2 }} margin={{ bottom: 'small' }}>
                      {getString('ce.perspectives.exportRowsUpto')}
                    </Text>
                    <Layout.Horizontal spacing="small">
                      <FormInput.Text name="exportRowsUpto" />
                      <Text font={{ variation: FontVariation.BODY }} padding={{ top: 'small' }}>{`${getString(
                        'of'
                      )} ${maxNoOfRows}`}</Text>
                    </Layout.Horizontal>
                    {showLongerDownloadTimeWarning ? (
                      <Text color={Color.BLUE_700} font={{ variation: FontVariation.SMALL }} icon="info-messaging">
                        {getString('ce.perspectives.largeNoOfRowsWarning')}
                      </Text>
                    ) : null}
                  </Container>
                  <Container width={'100%'}>
                    <Container margin={{ bottom: 'small' }}>
                      <Text inline font={{ variation: FontVariation.BODY2 }}>
                        {getString('ce.perspectives.excludeRowswithCost')}
                      </Text>
                      <Text inline font={{ variation: FontVariation.BODY, italic: true }}>{` ${getString(
                        'common.optionalLabel'
                      )}`}</Text>
                    </Container>
                    <FormInput.Text name="excludeRowsWithCost" placeholder={getString('ce.perspectives.enterAmount')} />
                  </Container>
                </Layout.Vertical>
                <Layout.Horizontal spacing="small" padding={{ top: 'xxlarge' }}>
                  <Button
                    text={getString('common.download')}
                    variation={ButtonVariation.PRIMARY}
                    type="submit"
                    loading={downloadGridData.fetching}
                  />
                  <Button
                    text={getString('cancel')}
                    variation={ButtonVariation.TERTIARY}
                    onClick={closeDownloadCSVModal}
                  />
                </Layout.Horizontal>
              </FormikForm>
            )
          }}
        </Formik>
      </Dialog>
    )
  }, [perspectiveTotalCount, downloadGridData, selectedColumnsToDownload])

  return [openDownloadCSVModal, closeDownloadCSVModal]
}
