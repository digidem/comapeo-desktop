import { createTheme, responsiveFontSizes } from '@mui/material/styles'

import {
	ALMOST_BLACK,
	COMAPEO_BLUE,
	DARKER_ORANGE,
	DARK_COMAPEO_BLUE,
	DARK_GREY,
	DARK_ORANGE,
	GREEN,
	LIGHT_COMAPEO_BLUE,
	ORANGE,
	RED,
	WHITE,
} from './colors'

declare module '@mui/material/Button' {
	interface ButtonPropsVariantOverrides {
		darkOrange: true
	}
}

declare module '@mui/material/styles' {
	interface TypographyVariants {
		bannerTitle: React.CSSProperties
		bannerSubtitle: React.CSSProperties
	}

	interface TypographyVariantsOptions {
		bannerTitle?: React.CSSProperties
		bannerSubtitle?: React.CSSProperties
	}

	interface TypeText {
		inverted: string
	}
}

declare module '@mui/material/Typography' {
	interface TypographyPropsVariantOverrides {
		bannerTitle: true
		bannerSubtitle: true
	}
}

const baseTheme = createTheme({
	spacing: 4,
	typography: {
		fontFamily: `'Rubik Variable', sans-serif`,
		fontWeightBold: 500,
		fontSize: 16,
		body1: {
			fontSize: '1rem',
		},
		body2: {
			fontSize: '0.875rem',
		},
		subtitle1: {
			fontSize: '1.125rem',
		},
		subtitle2: {
			fontSize: '1rem',
		},
		button: {
			fontSize: '1rem',
			textTransform: 'none',
		},
		caption: {
			fontSize: '0.75rem',
		},
		h1: {
			fontSize: '2rem',
			fontWeight: 700,
		},
		h2: {
			fontSize: '1.5rem',
			fontWeight: 600,
		},
		bannerTitle: {
			fontSize: '6rem',
			lineHeight: 1,
		},
		bannerSubtitle: {
			fontSize: '1.5rem',
			fontWeight: 500,
			lineHeight: 1.25,
		},
	},
	palette: {
		text: {
			primary: ALMOST_BLACK,
			secondary: DARK_GREY,
			inverted: WHITE,
		},
		primary: {
			main: COMAPEO_BLUE,
			dark: DARK_COMAPEO_BLUE,
			light: LIGHT_COMAPEO_BLUE,
		},
		secondary: {
			main: ORANGE,
			dark: DARK_ORANGE,
		},
		success: {
			main: GREEN,
		},
		error: {
			main: RED,
		},
		background: {
			default: WHITE,
		},
	},
	components: {
		MuiButton: {
			variants: [
				{
					props: { variant: 'darkOrange' },
					style: {
						backgroundColor: DARK_ORANGE,
						color: WHITE,
						'&:hover': {
							backgroundColor: DARKER_ORANGE,
						},
					},
				},
			],
			defaultProps: {
				variant: 'contained',
			},
			styleOverrides: {
				root: ({ ownerState, theme }) => ({
					...(ownerState.variant === 'outlined' && {
						borderColor: '#CCCCD6',
						borderWidth: 1,
						'&:hover': {
							borderWidth: 1,
						},
						'&:focus': {
							borderWidth: 1,
						},
					}),
					borderRadius: theme.spacing(8),
				}),
			},
		},
	},
})

const theme = responsiveFontSizes(baseTheme, {
	breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
	variants: [
		'bannerSubtitle',
		'bannerTitle',
		'body1',
		'body2',
		'button',
		'caption',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'subtitle1',
		'subtitle2',
	],
})

export { theme }
