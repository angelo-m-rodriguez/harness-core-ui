import React from 'react'
import { Container, Text } from '@wings-software/uicore'

interface TagViewerProps {
  style?: React.CSSProperties
  tag: string
}

const TagViewer: React.FC<TagViewerProps> = ({ tag, style }) => (
  <Text
    style={{
      padding: '4px var(--spacing-small)',
      display: 'inline-block',
      color: 'var(--primary-9)',
      background: 'var(--grey-100)',
      borderRadius: '4px',
      fontSize: '10px',
      ...style
    }}
  >
    {tag}
  </Text>
)

export interface TagsViewerProps {
  tags: string[] | null | undefined
  style?: React.CSSProperties
}

export const TagsViewer: React.FC<TagsViewerProps> = ({ tags, style }) => (
  <Container
    style={{
      display: 'inline-flex',
      flexWrap: 'wrap' /*, gap: 'var(--spacing-xsmall)' -> Safari does not support it yet (Feb 2021) :( */,
      margin: 'calc(-1 * var(--spacing-xsmall)) 0 0 calc(-1 * var(--spacing-xsmall))',
      width: 'calc(100% + var(--spacing-xsmall))'
    }}
  >
    {tags?.map(tag => (
      <TagViewer key={tag} tag={tag} style={{ margin: 'var(--spacing-xsmall) 0 0 var(--spacing-xsmall)', ...style }} />
    ))}
  </Container>
)
