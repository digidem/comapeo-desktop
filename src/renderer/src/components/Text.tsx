import {
	type CSSProperties,
	type ComponentProps,
	type PropsWithChildren,
} from 'react'
import Typography from '@mui/material/Typography'
import { type Variant } from '@mui/material/styles/createTypography'

type Kind = 'title' | 'subtitle' | 'body' | 'caption'

type TextColor = 'primary' | 'secondary' | 'disabled'

const kindToVariant: { [k in Kind]: Variant } = {
	title: 'h1',
	subtitle: 'subtitle1',
	body: 'body1',
	caption: 'caption',
} as const

const textColorToTypographyColor: {
	[c in TextColor]: ComponentProps<typeof Typography>['color']
} = {
	primary: 'textPrimary',
	secondary: 'textSecondary',
	disabled: 'textDisabled',
} as const

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
	underline?: boolean
}>

type TextProps = BaseProps & {
	color?: TextColor
	kind?: Kind
}

export function Text({
	bold,
	italic,
	kind = 'body',
	style,
	underline,
	color = 'primary',
	...otherProps
}: TextProps) {
	return (
		<Typography
			variant={kindToVariant[kind]}
			color={textColorToTypographyColor[color]}
			fontWeight={bold ? 'bold' : undefined}
			fontStyle={italic ? 'italic' : undefined}
			style={{
				textDecoration: underline ? 'underline' : undefined,
				...style,
			}}
			{...otherProps}
		/>
	)
}
