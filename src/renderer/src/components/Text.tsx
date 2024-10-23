import { CSSProperties, PropsWithChildren } from 'react'
import { type Variant } from '@mui/material/styles/createTypography'
import Typography from '@mui/material/Typography'

type Kind = 'title' | 'subtitle' | 'body'

const kindToVariant: { [k in Kind]: Variant } = {
	title: 'h1',
	subtitle: 'subtitle1',
	body: 'body1',
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
	kind?: Kind
}

export function Text({
	bold,
	italic,
	kind = 'body',
	style,
	underline,
	...otherProps
}: TextProps) {
	return (
		<Typography
			variant={kindToVariant[kind]}
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
