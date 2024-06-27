import * as React from 'react'
import { useMemo } from 'react'
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  SxProps,
  Theme,
} from '@mui/material'
import { MessageDescriptor, useIntl } from 'react-intl'

type ColorScheme = 'dark' | 'light' | 'ComapeoBlue'
type Variant = 'contained' | 'outlined' | 'text'
type Size = 'medium' | 'large'

interface CustomButtonProps {
  children: React.ReactNode | MessageDescriptor
  customColor?: ColorScheme
  disabled?: boolean
  onClick: () => void
  size?: Size
  testID?: string
  customVariant?: Variant
  sx?: SxProps<Theme>
}

export const Button: React.FC<
  CustomButtonProps & Omit<MuiButtonProps, 'variant'>
> = ({
  children,
  customColor = 'dark',
  disabled = false,
  onClick,
  size = 'medium',
  testID,
  customVariant = 'contained',
  sx,
  ...rest
}) => {
  const intl = useIntl()

  const translatedChildren = useMemo(() => {
    if (children === null) {
      return <div></div>
    } else if (typeof children === 'object' && 'id' in children) {
      return intl.formatMessage(children as MessageDescriptor)
    } else return children
  }, [children, intl])

  const defaultStyles: SxProps = {
    borderRadius: 30,
    alignSelf: 'center',
    overflow: 'hidden',
    ...(customVariant === 'contained' && {
      backgroundColor:
        customColor === 'ComapeoBlue'
          ? 'var(--comapeo-blue)'
          : customColor === 'dark'
            ? 'var(--black)'
            : 'var(--white)',
      color:
        customColor === 'ComapeoBlue' || customColor === 'dark'
          ? 'var(--white)'
          : 'var(--black)',
    }),
    ...(customVariant === 'outlined' && {
      borderColor:
        customColor === 'ComapeoBlue'
          ? 'var(--comapeo-blue)'
          : customColor === 'dark'
            ? 'var(--black)'
            : 'var(--white)',
      color:
        customColor === 'ComapeoBlue'
          ? 'var(--comapeo-blue)'
          : customColor === 'dark'
            ? 'var(--black)'
            : 'var(--white)',
      borderWidth: '1.5px',
    }),
    ...(customVariant === 'text' && {
      color:
        customColor === 'ComapeoBlue'
          ? 'var(--comapeo-blue)'
          : customColor === 'dark'
            ? 'var(--black)'
            : 'var(--white)',
      fontWeight: '700',
      letterSpacing: 0.5,
      fontSize: 16,
    }),
  }

  return (
    <MuiButton
      sx={{ ...defaultStyles, ...sx }}
      variant={customVariant}
      disabled={disabled}
      onClick={onClick}
      size={size}
      data-testid={testID}
      {...rest}
    >
      {translatedChildren}
    </MuiButton>
  )
}
