export const mockSecret = {
  status: 'SUCCESS',
  data: {
    secret: {
      type: 'SecretText',
      name: 'connectorPass',
      identifier: 'connectorPass',
      tags: {},
      description: '',
      spec: { secretManagerIdentifier: 'harnessSecretManager' }
    },
    createdAt: 1606373702954,
    updatedAt: 1606373702954,
    draft: false
  },
  metaData: null,
  correlationId: '0346aa2b-290e-4892-a7f0-4ad2128c9829'
}

export const mockListSecrets = {
  status: 'SUCCESS',
  data: {
    totalPages: 1,
    totalItems: 1,
    pageItemCount: 1,
    pageSize: 100,
    content: [
      {
        secret: {
          type: 'SecretFile',
          name: 'nfile1',
          identifier: 'nfile1',
          tags: {},
          description: 'desc',
          spec: {
            secretManagerIdentifier: 'vault1'
          }
        },
        createdAt: 1602137372269,
        updatedAt: 1602137372269,
        draft: false
      }
    ],
    pageIndex: 0,
    empty: false
  },
  metaData: null,
  correlationId: 'eae05856-9cc0-450d-9d18-b459320311ff'
}
