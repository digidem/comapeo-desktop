import { useMemo } from 'react'
import { useTheme, type TypographyVariant } from '@mui/material/styles'

export function useIconSizeBasedOnTypography({
	typographyVariant,
	multiplier = 1,
}: {
	typographyVariant: TypographyVariant
	multiplier?: number
}) {
	const theme = useTheme()

	const fontSize = theme.typography[typographyVariant].fontSize
	const lineHeight = theme.typography[typographyVariant].lineHeight

	return useMemo(() => {
		return `calc(${fontSize} * ${lineHeight} * ${multiplier})`
	}, [fontSize, lineHeight, multiplier])
}
