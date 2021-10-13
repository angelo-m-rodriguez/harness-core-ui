import { identity, pick, pickBy } from 'lodash-es'

import { useParams } from 'react-router-dom'
import { useDeepCompareEffect } from '@common/hooks'
import { usePermissionsContext, PermissionRequestOptions } from 'framework/rbac/PermissionsContext'
import type { PermissionCheck, ResourceScope } from 'services/rbac'
import type { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ResourceType } from '@rbac/interfaces/ResourceType'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'

export interface Resource {
  resourceType: ResourceType
  resourceIdentifier?: string
}

export interface PermissionRequest {
  resourceScope?: ResourceScope
  resource: Resource
  permission: PermissionIdentifier
}

export interface PermissionsRequest {
  resourceScope?: ResourceScope
  resource: Resource
  permissions: PermissionIdentifier[]
  options?: PermissionRequestOptions
}

export function getDTOFromRequest(permissionRequest: PermissionRequest, defaultScope: ResourceScope): PermissionCheck {
  const { resource, resourceScope, permission } = permissionRequest
  return {
    // pickBy(obj, identity) removes keys with undefined values
    resourceScope: pickBy(resourceScope || defaultScope, identity),
    ...pickBy(resource, identity),
    permission
  }
}

export function usePermission(permissionsRequest?: PermissionsRequest, deps: Array<any> = []): Array<boolean> {
  const { requestPermission, checkPermission, cancelRequest } = usePermissionsContext()
  const { accountId: accountIdentifier, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const defaultScope = { accountIdentifier, orgIdentifier, projectIdentifier }

  useDeepCompareEffect(() => {
    // generate PermissionRequest for every action user requested
    permissionsRequest &&
      permissionsRequest.permissions.forEach(permission => {
        const permissionCheckDto = getDTOFromRequest(
          {
            permission,
            ...pick(permissionsRequest, ['resourceScope', 'resource'])
          } as PermissionRequest,
          defaultScope
        )
        // register request in the context
        requestPermission(permissionCheckDto, permissionsRequest?.options)
      })

    return () => {
      // cancel above request when this hook instance is unmounting
      permissionsRequest &&
        permissionsRequest.permissions.forEach(permission => {
          const permissionCheckDto = getDTOFromRequest(
            {
              permission,
              ...pick(permissionsRequest, ['resourceScope', 'resource'])
            } as PermissionRequest,
            defaultScope
          )
          cancelRequest(permissionCheckDto)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionsRequest?.options, ...deps])

  // hook should return boolean for every action requested, in same order
  if (permissionsRequest !== undefined) {
    return permissionsRequest.permissions.map(permission => {
      const permissionCheckDto = getDTOFromRequest(
        {
          permission,
          ...pick(permissionsRequest, ['resourceScope', 'resource'])
        } as PermissionRequest,
        defaultScope
      )
      return checkPermission(permissionCheckDto)
    })
  }

  return []
}
