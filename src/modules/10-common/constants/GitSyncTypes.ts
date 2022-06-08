export enum StoreType {
  INLINE = 'INLINE',
  REMOTE = 'REMOTE'
}

export interface StoreMetadata {
  storeType?: 'INLINE' | 'REMOTE'
  connectorRef?: string
  repoName?: string
  branch?: string
  filePath?: string
}
