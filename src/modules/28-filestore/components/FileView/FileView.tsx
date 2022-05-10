/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */
import React, {useContext} from 'react'
import {Container, Tabs} from '@harness/uicore'
import {useStrings} from 'framework/strings'
import FileDetails from '@filestore/components/FileView/FileDetails/FileDetails'

import {FileStoreContext} from "@filestore/components/FileStoreContext/FileStoreContext";
import {FILE_VIEW_TAB} from "@filestore/interfaces/FileStore";
import ReferencedBy from './ReferencedBy/ReferencedBy'
import css from '@filestore/components/FileView/FileView.module.scss'

export default function FileView(): React.ReactElement {
    const {getString} = useStrings()
    const {activeTab, setActiveTab} = useContext(FileStoreContext)

    return (
        <Container style={{width: '100%'}} className={css.mainFileView}>
            <Tabs
                id={'serviceLandingPageTabs'}
                defaultSelectedTabId={activeTab}
                onChange={(tabId) => setActiveTab(tabId as FILE_VIEW_TAB)}
                tabList={[
                    {
                        id: FILE_VIEW_TAB.DETAILS,
                        title: getString('details'),
                        panel: <FileDetails/>
                    },
                    {
                        id: FILE_VIEW_TAB.REFERENCED_BY,
                        title: getString('refrencedBy'),
                        panel: <ReferencedBy/>
                    },
                    {id: FILE_VIEW_TAB.ACTIVITY_LOG, title: getString('activityLog'), panel: <div/>}
                ]}
            />
        </Container>
    )
}
