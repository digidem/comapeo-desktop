// Text.tsx
import * as React from 'react'
import { PropsWithChildren } from 'react'
import Typography, { TypographyProps } from '@mui/material/Typography'

type BaseProps = PropsWithChildren &
  TypographyProps & { style?: React.CSSProperties }

export function TitleText({ children, style, ...otherProps }: BaseProps) {
  return (
    <Typography variant="h1" style={style} {...otherProps}>
      {children}
    </Typography>
  )
}

export function BodyText({ children, style, ...otherProps }: BaseProps) {
  return (
    <Typography variant="body1" style={style} {...otherProps}>
      {children}
    </Typography>
  )
}

export function DescriptionText({ children, style, ...otherProps }: BaseProps) {
  return (
    <Typography variant="body2" style={style} {...otherProps}>
      {children}
    </Typography>
  )
}

export function SubtitleText({ children, style, ...otherProps }: BaseProps) {
  return (
    <Typography variant="subtitle1" style={style} {...otherProps}>
      {children}
    </Typography>
  )
}

type TextProps = BaseProps & {
  kind?: 'title' | 'body' | 'description' | 'subtitle'
}

export function Text({ children, kind, style, ...otherProps }: TextProps) {
  switch (kind) {
    case 'title':
      return (
        <TitleText style={style} {...otherProps}>
          {children}
        </TitleText>
      )
    case 'body':
      return (
        <BodyText style={style} {...otherProps}>
          {children}
        </BodyText>
      )
    case 'description':
      return (
        <DescriptionText style={style} {...otherProps}>
          {children}
        </DescriptionText>
      )
    case 'subtitle':
      return (
        <SubtitleText style={style} {...otherProps}>
          {children}
        </SubtitleText>
      )
    default:
      return (
        <Typography style={style} {...otherProps}>
          {children}
        </Typography>
      )
  }
}
