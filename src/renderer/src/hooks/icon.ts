import { useMemo } from 'react'
import { useTheme, type TypographyVariants } from '@mui/material/styles'

export function useIconSizeBasedOnTypography({
	variant,
	multiplier = 1,
}: {
	variant: keyof Pick<
		TypographyVariants,
		| 'bodyCopy'
		| 'cardHeader'
		| 'detailCopy'
		| 'heroHeader'
		| 'heroSubheading'
		| 'pageTitle'
		| 'sectionLabel'
	>
	multiplier?: number
}) {
	const theme = useTheme()

	const fontSize = theme.typography[variant].fontSize

	return useMemo(() => {
		return `calc(${fontSize} * ${multiplier})`
	}, [fontSize, multiplier])
}
