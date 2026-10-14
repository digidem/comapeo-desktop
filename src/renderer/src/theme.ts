import { tooltipClasses } from '@mui/material/Tooltip'
import { createTheme as createMaterialTheme } from '@mui/material/styles'

import {
	BLACK_00,
	BLACK_01,
	BLACK_02,
	BLUE_01,
	BLUE_03,
	BLUE_05,
	GREEN_00,
	ORANGE_01,
	RED_00,
	WHITE_00,
} from '../../shared/colors.ts'
import { PORTAL_CONTAINER_ID, TITLE_BAR_HEIGHT } from './lib/constants.ts'

declare module '@mui/material/styles' {
	interface TypographyVariants {
		bodyCopy: React.CSSProperties
		cardHeader: React.CSSProperties
		detailCopy: React.CSSProperties
		heroHeader: React.CSSProperties
		heroSubheading: React.CSSProperties
		pageTitle: React.CSSProperties
		sectionLabel: React.CSSProperties
	}

	interface TypographyVariantsOptions {
		bodyCopy?: React.CSSProperties
		cardHeader?: React.CSSProperties
		detailCopy: React.CSSProperties
		heroHeader?: React.CSSProperties
		heroSubheading?: React.CSSProperties
		pageTitle?: React.CSSProperties
		sectionLabel?: React.CSSProperties
	}

	interface TypeText {
		tertiary: string
		inverted: string
	}
}

declare module '@mui/material/Typography' {
	interface TypographyPropsVariantOverrides {
		body1: false
		body2: false
		h1: false
		h2: false
		h3: false
		h4: false
		h5: false
		h6: false
		caption: false
		overline: false
		subtitle1: false
		subtitle2: false

		bodyCopy: true
		cardHeader: true
		detailCopy: true
		heroHeader: true
		heroSubheading: true
		pageTitle: true
		sectionLabel: true
	}
}

export function createTheme({ platform }: { platform: NodeJS.Platform }) {
	const fontWeightRegular = 400
	const fontWeightMedium = 500
	const fontWeightBold = 600

	const baseTheme = createMaterialTheme({
		cssVariables: true,
		spacing: 4,
		typography: (palette) => {
			return {
				fontFamily: `"Rubik Variable", sans-serif`,
				fontWeightRegular,
				fontWeightMedium,
				fontWeightBold,
				fontSize: 16,

				// NOTE: Built-in variants
				body1: undefined,
				body2: undefined,
				button: {
					fontSize: '1rem',
					fontWeight: fontWeightRegular,
					textTransform: 'none',
				},
				h1: undefined,
				h2: undefined,
				h3: undefined,
				h4: undefined,
				h5: undefined,
				h6: undefined,
				subtitle1: undefined,
				subtitle2: undefined,

				// NOTE: Custom variants
				bodyCopy: {
					color: palette.text.secondary,
					fontSize: '1rem',
				},
				cardHeader: {
					fontSize: '1.1669rem',
					fontWeight: fontWeightMedium,
				},
				detailCopy: {
					fontSize: '0.8331rem',
				},
				heroHeader: {
					fontSize: '1.6669rem',
					fontWeight: fontWeightMedium,
				},
				heroSubheading: {
					color: palette.text.secondary,
					fontSize: '1.1669rem',
				},
				pageTitle: {
					fontSize: '1.1669rem',
					fontWeight: fontWeightBold,
				},
				sectionLabel: {
					fontSize: '0.8331rem',
					fontWeight: fontWeightMedium,
					textTransform: 'uppercase',
				},
			}
		},
		palette: {
			text: {
				primary: BLACK_00,
				secondary: BLACK_01,
				tertiary: BLACK_02,
				inverted: WHITE_00,
			},
			primary: {
				main: BLUE_03,
				contrastText: WHITE_00,
			},
			secondary: {
				main: ORANGE_01,
				contrastText: WHITE_00,
			},
			success: {
				main: GREEN_00,
				contrastText: WHITE_00,
			},
			error: {
				main: RED_00,
				contrastText: WHITE_00,
			},
			background: {
				default: BLUE_01,
			},
			divider: BLUE_05,
		},
		zIndex: {
			mobileStepper: 10,
			fab: 11,
			speedDial: 11,
			appBar: 12,
			drawer: 13,
			modal: 14,
			snackbar: 15,
			tooltip: 16,
		},
		components: {
			MuiBackdrop: {
				styleOverrides:
					platform === 'darwin'
						? { root: { top: TITLE_BAR_HEIGHT } }
						: undefined,
			},
			MuiButton: {
				defaultProps: {
					variant: 'contained',
					disableElevation: true,
					size: 'large',
				},
				styleOverrides: {
					root: ({ theme }) => {
						return {
							borderRadius: theme.spacing(8),
							fontSize: theme.typography.button.fontSize,
							maxWidth: 250,
							minWidth: 100,
						}
					},
					outlined: ({ theme }) => {
						return {
							background: WHITE_00,
							border: `1px solid ${BLUE_05}`,
							'&:hover, &:focus': {
								borderColor: theme.darken(BLUE_05, 0.2),
							},
						}
					},
				},
				variants: [
					{
						props: { fullWidth: true },
						style: { flex: 'auto', whiteSpace: 'nowrap' },
					},
				],
			},
			MuiButtonBase: {
				styleOverrides: {
					root: {
						fontSize: '1rem',
						fontWeight: fontWeightRegular,
						fontFamily: `"Rubik Variable", sans-serif`,
						textTransform: 'none',
					},
				},
			},
			MuiCircularProgress: {
				defaultProps: {
					disableShrink: true,
				},
			},
			MuiContainer: {
				defaultProps: {
					disableGutters: true,
				},
			},
			MuiCssBaseline: {
				styleOverrides: (theme) => ({
					'h1, h2, h3, h4, h5, h6': {
						fontWeight: theme.typography.fontWeightRegular,
						margin: 0,
					},
				}),
			},
			MuiDialog: {
				styleOverrides: {
					paper: ({ theme }) => {
						return {
							borderRadius: theme.spacing(2),
							border: `1px solid ${BLUE_05}`,
						}
					},
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
			MuiInputLabel: {
				defaultProps: {
					// Hacky way of not showing the required asterisk: https://github.com/mui/material-ui/issues/10274
					required: false,
				},
			},
			MuiList: {
				defaultProps: {
					disablePadding: true,
				},
			},
			MuiListItem: {
				defaultProps: {
					disableGutters: true,
					disablePadding: true,
				},
			},
			MuiListItemButton: {
				defaultProps: {
					disableGutters: true,
				},
			},
			MuiMenuItem: {
				defaultProps: {
					disableGutters: true,
				},
			},
			MuiModal: {
				defaultProps: {
					container: () => {
						return document.getElementById(PORTAL_CONTAINER_ID)
					},
				},
				styleOverrides:
					platform === 'darwin'
						? {
								root: {
									top: TITLE_BAR_HEIGHT,
								},
							}
						: undefined,
			},
			MuiStack: {
				defaultProps: {
					useFlexGap: true,
				},
			},

			MuiPopper: {
				defaultProps: {
					container: () => {
						return document.getElementById(PORTAL_CONTAINER_ID)
					},
				},
			},
			MuiTooltip: {
				defaultProps: {
					enterDelay: 0,
					leaveDelay: 0,
					slotProps: {
						tooltip: {
							sx: (theme) => ({
								backgroundColor: theme.palette.common.white,
								color: theme.palette.text.primary,
								boxShadow: theme.shadows[5],
							}),
						},
					},
				},
				styleOverrides: {
					popper: {
						[`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
							{
								marginTop: '4px',
							},
						[`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]:
							{
								marginBottom: '4px',
							},
						[`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]:
							{
								marginLeft: '4px',
							},
						[`&.${tooltipClasses.popper}[data-popper-placement*="left"] .${tooltipClasses.tooltip}`]:
							{
								marginRight: '4px',
							},
					},
				},
			},
			MuiTypography: {
				defaultProps: {
					variant: 'bodyCopy',
					variantMapping: {
						bodyCopy: 'p',
						cardHeader: 'p',
						detailCopy: 'p',
						heroHeader: 'p',
						heroSubheading: 'p',
						pageTitle: 'h1',
					},
				},
			},
		},
	})

	return baseTheme
}
