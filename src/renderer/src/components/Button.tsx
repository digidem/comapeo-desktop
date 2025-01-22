import {
	type CSSProperties,
	type MouseEventHandler,
	type PropsWithChildren,
} from 'react'
import { Button as MuiButton, type ButtonProps } from '@mui/material'

type CustomButtonProps = PropsWithChildren<{
	name?: string
	className?: string
	color?: ButtonProps['color']
	size?: 'medium' | 'large' | 'fullWidth'
	testID?: string
	variant?: 'contained' | 'outlined' | 'text' | 'darkOrange'
	style?: CSSProperties
	onClick?: MouseEventHandler<HTMLButtonElement>
	disabled?: boolean
	startIcon?: React.ReactNode
	endIcon?: React.ReactNode
}>

export const Button = ({
	children,
	testID,
	size = 'medium',
	color = 'primary',
	variant = 'contained',
	style,
	disabled,
	className,
	startIcon,
	...props
}: CustomButtonProps) => {
	const propsBasedOnSize = size === 'fullWidth' ? { fullWidth: true } : { size }
	return (
		<MuiButton
			startIcon={startIcon}
			className={className}
			color={color}
			variant={variant}
			style={style}
			data-testid={testID}
			disabled={disabled}
			{...propsBasedOnSize}
			onClick={props.onClick}
		>
			{children}
		</MuiButton>
	)
}
