import type { FilterDataInterface, FilterInterface } from "@common/components/Filter/Constants";
import type {
  EmbeddedUserDetailsDTO,
  FilesFilterProperties,
  FilterDTO,
} from "services/cd-ng";
import { StringUtils } from "@common/exports";

export type FileStoreFilterFormType = Omit<FilesFilterProperties, 'createdBy'> & {
  createdBy?: string
}

export const createRequestBodyPayload = ({
                                           isUpdate,
                                           data,
                                           projectIdentifier,
                                           orgIdentifier,
                                           accountIdentifier,
                                           referenceIdentifier,
                                           createdByList
                                         }: {
  isUpdate: boolean
  data: FilterDataInterface<FileStoreFilterFormType, FilterInterface>
  projectIdentifier: string
  orgIdentifier: string,
  accountIdentifier: string,
  referenceIdentifier?: string,
  createdByList: EmbeddedUserDetailsDTO[]
}): FilterDTO => {
  const {
    metadata: { name: _name, filterVisibility, identifier },
    formValues
  } = data

  const createdBy = createdByList.find(user => formValues.createdBy === user.email)

  return {
    name: _name,
    identifier: isUpdate ? identifier : StringUtils.getIdentifierFromName(_name),
    projectIdentifier,
    orgIdentifier,
    filterVisibility: filterVisibility,
    filterProperties: {
      createdBy: createdBy,
      ...(
        formValues.referencedBy && referenceIdentifier ? {
          referencedBy: {
            type: formValues.referencedBy,
            entityRef: {
              identifier: referenceIdentifier,
              orgIdentifier,
              projectIdentifier,
              accountIdentifier
            }
          }
        } : {}
      ),
      fileUsage: formValues.fileUsage,
      tags: formValues.tags,
      filterType: 'FileStore'
    } as FilesFilterProperties
  }
}
