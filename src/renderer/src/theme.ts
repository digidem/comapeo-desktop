import { createTheme, responsiveFontSizes } from '@mui/material/styles'

import {
	ALMOST_BLACK,
	BLUE_GREY,
	COMAPEO_BLUE,
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
	cssVariables: true,
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
		},
		h2: {
			fontSize: '1.5rem',
		},
		h3: {
			fontSize: '1.25rem',
		},
		h4: undefined,
		h5: undefined,
		h6: undefined,
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
			contrastText: WHITE,
		},
		secondary: {
			main: ORANGE,
			dark: DARK_ORANGE,
			contrastText: WHITE,
		},
		success: {
			main: GREEN,
			contrastText: WHITE,
		},
		error: {
			main: RED,
			contrastText: WHITE,
		},
		background: {
			default: DARK_COMAPEO_BLUE,
		},
	},
	components: {
		MuiInputLabel: {
			defaultProps: {
				// Hacky way of not showing the required asterisk: https://github.com/mui/material-ui/issues/10274
				required: false,
			},
		},
		MuiFormHelperText: {
			styleOverrides: {
				root: {
					marginInlineStart: 0,
					marginInlineEnd: 0,
				},
			},
		},
		MuiButton: {
			defaultProps: {
				variant: 'contained',
				disableElevation: true,
				size: 'large',
			},
			styleOverrides: {
				root: ({ theme }) => {
					return { borderRadius: theme.spacing(8) }
				},
				loading: () => {
					return {
						backgroundColor: undefined,
					}
				},
				outlined: {
					backgroundColor: WHITE,
					border: `1px solid ${BLUE_GREY}`,
					'&:hover': {
						borderColor: DARK_GREY,
					},
					'&:focus': {
						borderColor: DARK_GREY,
					},
				},
			},
		},
		MuiDialog: {
			styleOverrides: {
				paper: ({ theme }) => {
					return {
						borderRadius: theme.spacing(2),
						border: `1px solid ${BLUE_GREY}`,
					}
				},
			},
		},
		MuiStack: {
			defaultProps: {
				useFlexGap: true,
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
		'subtitle1',
		'subtitle2',
	],
})

export { theme }
