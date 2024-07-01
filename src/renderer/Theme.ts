import { createTheme } from '@mui/material/styles'

import {
  CoMAPEO_BLUE,
  DARK_CoMAPEO_BLUE,
  DARK_ORANGE,
  GREEN,
  LIGHT_CoMAPEO_BLUE,
  ORANGE,
  RED,
} from './colors'

const theme = createTheme({
  typography: {
    fontFamily: 'Rubik, sans-serif',
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
      fontSize: '0.875rem',
      fontWeight: 600,
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
  },
  palette: {
    primary: {
      main: CoMAPEO_BLUE,
      dark: DARK_CoMAPEO_BLUE,
      light: LIGHT_CoMAPEO_BLUE,
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
  },
})

export { theme }
