import { createTheme } from '@mui/material/styles'

import {
	COMAPEO_BLUE,
	DARK_COMAPEO_BLUE,
	DARK_GREY,
	DARK_ORANGE,
	DARK_TEXT,
	GREEN,
	LIGHT_COMAPEO_BLUE,
	ORANGE,
	RED,
	WHITE,
} from './colors'

const theme = createTheme({
	typography: {
		fontFamily: 'Rubik, sans-serif',
		fontSize: 12,
		body1: {
			fontSize: '1rem',
		},
		body2: {
			fontSize: '0.875rem',
			color: DARK_TEXT,
		},
		subtitle1: {
			fontSize: '1.125rem',
			color: DARK_TEXT,
		},
		subtitle2: {
			fontSize: '1rem',
			color: DARK_TEXT,
		},
		button: {
			fontSize: '1rem',
			fontWeight: 700,
			textTransform: 'none',
		},
		caption: {
			fontSize: '0.75rem',
			color: DARK_TEXT,
		},
		h1: {
			fontSize: '2rem',
			fontWeight: 700,
			color: DARK_TEXT,
		},
		h2: {
			fontSize: '1.5rem',
			fontWeight: 600,
			color: DARK_TEXT,
		},
	},
	palette: {
		text: {
			primary: DARK_TEXT,
			secondary: DARK_GREY,
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
			defaultProps: {
				variant: 'contained',
			},
			styleOverrides: {
				root: ({ ownerState }) => ({
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
					borderRadius: 32,
					textTransform: 'none',
					fontSize: '1rem',
					fontWeight: 400,
					paddingVertical: 12,
				}),
			},
		},
	},
	spacing: 1,
})

export { theme }
