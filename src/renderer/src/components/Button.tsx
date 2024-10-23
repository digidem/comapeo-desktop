import { CSSProperties, MouseEventHandler, PropsWithChildren } from 'react'
import { Button as MuiButton } from '@mui/material'

type CustomButtonProps = PropsWithChildren<{
	name?: string
	className?: string
	color?: 'primary' | 'secondary' | 'success' | 'error'
	size?: 'medium' | 'large' | 'fullWidth'
	testID?: string
	variant?: 'contained' | 'outlined' | 'text'
	style?: CSSProperties
	onClick?: MouseEventHandler<HTMLButtonElement>
}>

export const Button = ({
	children,
	testID,
	size = 'medium',
	color = 'primary',
	variant = 'contained',
	style,
	...props
}: CustomButtonProps) => {
	const propsBasedOnSize = size === 'fullWidth' ? { fullWidth: true } : { size }
	return (
		<MuiButton
			color={color}
			variant={variant}
			style={style}
			data-testid={testID}
			{...propsBasedOnSize}
			onClick={props.onClick}
		>
			{children}
		</MuiButton>
	)
}
