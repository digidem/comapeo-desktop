import { PropsWithChildren } from 'react'
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from '@mui/material'

type CustomButtonProps = PropsWithChildren<{
  name?: string
  className?: string
  color?: 'primary' | 'secondary' | 'success' | 'error'
  size?: 'medium' | 'large' | 'fullWidth'
  testID?: string
  variant?: 'contained' | 'outlined' | 'text'
  sx?: MuiButtonProps['sx']
  onClick?: MuiButtonProps['onClick']
}>

export const Button = ({
  children,
  testID,
  size = 'medium',
  color = 'primary',
  variant = 'contained',
  ...props
}: CustomButtonProps) => {
  const propsBasedOnSize = size === 'fullWidth' ? { fullWidth: true } : { size }
  return (
    <MuiButton
      color={color}
      variant={variant}
      sx={props.sx}
      data-testid={testID}
      {...propsBasedOnSize}
      onClick={props.onClick}
    >
      {children}
    </MuiButton>
  )
}
