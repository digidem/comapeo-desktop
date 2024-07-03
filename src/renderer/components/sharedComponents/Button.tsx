import React from 'react'
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from '@mui/material'
import { MessageDescriptor, useIntl } from 'react-intl'

interface CustomButtonProps extends Omit<MuiButtonProps, 'children'> {
  children: React.ReactNode | MessageDescriptor
  color?: 'primary' | 'secondary' | 'success' | 'error'
  variant?: 'contained' | 'outlined' | 'text'
  testID?: string
  size?: 'medium' | 'large'
}

export const Button: React.FC<CustomButtonProps> = ({ children, ...props }) => {
  const { formatMessage } = useIntl()

  const translatedContent =
    children && typeof children === 'object' && 'id' in children
      ? formatMessage(children as MessageDescriptor)
      : children

  return (
    <MuiButton {...props}>{translatedContent as React.ReactNode}</MuiButton>
  )
}
