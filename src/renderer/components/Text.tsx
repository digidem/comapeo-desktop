import { CSSProperties, PropsWithChildren } from 'react'
import Typography from '@mui/material/Typography'

type BaseProps = PropsWithChildren<{
  align?: Extract<
    CSSProperties['textAlign'],
    'inherit' | 'left' | 'center' | 'right' | 'justify'
  >
  bold?: boolean
  className?: string
  id?: string
  italic?: boolean
  style?: CSSProperties
  underlined?: boolean
}>

export function TitleText({
  align,
  bold,
  children,
  className,
  italic,
  style,
  underlined,
}: BaseProps) {
  return (
    <Typography
      variant="h1"
      align={align}
      style={{
        ...style,
        fontWeight: bold ? 'bold' : undefined,
        fontStyle: italic ? 'italic' : undefined,
        textDecoration: underlined ? 'underline' : undefined,
      }}
      className={className}
    >
      {children}
    </Typography>
  )
}

export function BodyText({
  align,
  bold,
  children,
  className,
  italic,
  style,
  underlined,
}: BaseProps) {
  return (
    <Typography
      variant="body1"
      style={{
        ...style,
        fontWeight: bold ? 'bold' : undefined,
        fontStyle: italic ? 'italic' : undefined,
        textDecoration: underlined ? 'underline' : undefined,
      }}
      align={align}
      className={className}
    >
      {children}
    </Typography>
  )
}

export function SubtitleText({
  align,
  bold,
  children,
  className,
  italic,
  style,
  underlined,
}: BaseProps) {
  return (
    <Typography
      variant="subtitle1"
      style={{
        ...style,
        fontWeight: bold ? 'bold' : undefined,
        fontStyle: italic ? 'italic' : undefined,
        textDecoration: underlined ? 'underline' : undefined,
      }}
      align={align}
      className={className}
    >
      {children}
    </Typography>
  )
}

type TextProps = BaseProps & {
  kind: 'title' | 'body' | 'subtitle'
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
    case 'subtitle':
      return (
        <SubtitleText style={style} {...otherProps}>
          {children}
        </SubtitleText>
      )
    default:
      throw new Error(`Invalid 'kind' prop value: ${kind}`)
  }
}
