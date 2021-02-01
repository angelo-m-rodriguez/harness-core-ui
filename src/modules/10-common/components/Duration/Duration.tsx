import React, { useEffect, useState } from 'react'
import { Text, TextProps } from '@wings-software/uicore'
import { isNil } from 'lodash-es'
import i18n from './Duration.i18n'

export interface DurationProps extends Omit<TextProps, 'icon'> {
  startTime?: number
  endTime?: number // if endTime is nullable, endTime is Date.now() and the duration is re-calculated by an interval
  formatter?: string // subset of 'wdhms'
  durationText?: string // optional text to override the default `Duration: ` prefix
  icon?: TextProps['icon'] | null
}

/**
 * Idea from https://gist.github.com/THEtheChad/1297617. Copyright 2011 THEtheChad Elliott (MIT license).
 */
interface DurationDiff {
  w: number
  d: number
  h: number
  m: number
  s: number
  ms: number
}

const durationInMillis: Omit<DurationDiff, 'ms'> = {
  w: 604800000, // week
  d: 86400000, // day
  h: 3600000, // hour
  m: 60000, // minutes
  s: 1000 // second
}

const keys = ['w', 'd', 'h', 'm', 's']

export function timeDelta(start: number, end: number, formatter = 'wdhms'): DurationDiff {
  const delta: DurationDiff = { w: 0, d: 0, h: 0, m: 0, s: 0, ms: 0 }

  delta.ms = Math.abs(end - start)

  keys
    .filter(key => formatter.includes(key))
    .forEach(_key => {
      const key = _key as keyof Omit<DurationDiff, 'ms'>

      delta[key] = Math.floor(delta.ms / durationInMillis[key])
      delta.ms -= delta[key] * durationInMillis[key]
    })

  return delta
}

export const Duration: React.FC<DurationProps> = ({
  startTime,
  endTime,
  formatter,
  durationText,
  icon,
  ...textProps
}) => {
  const [_endTime, setEndTime] = useState(endTime || Date.now())
  React.useEffect(() => {
    if (endTime) {
      setEndTime(endTime)
    }
  }, [endTime])
  const delta = startTime ? timeDelta(startTime, _endTime, formatter) : { w: 0, d: 0, h: 0, m: 0, s: 0 }

  useEffect(() => {
    const timeoutId =
      (!endTime &&
        window.setInterval(() => {
          setEndTime(Date.now())
        }, 1000)) ||
      0

    return () => {
      window.clearInterval(timeoutId)
    }
  }, [endTime])

  if (startTime && endTime && endTime - startTime < 1000) {
    return (
      <Text inline icon={isNil(icon) ? undefined : icon || 'hourglass'} {...textProps}>
        {endTime - startTime}ms
      </Text>
    )
  }

  const text = i18n.humanizeDuration(delta.w, delta.d, delta.h, delta.m, delta.s)

  return (
    <Text inline icon={isNil(icon) ? undefined : icon || 'hourglass'} {...textProps}>
      {durationText || i18n.duration}
      {text}
    </Text>
  )
}
