import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  typography: {
    fontFamily: 'Rubik, sans-serif',
    fontSize: 16,
    h1: {
      fontSize: 32,
      fontWeight: 700,
    },
    h2: {
      fontSize: 24,
      fontWeight: 600,
    },
    // Custom semantic names
    title: {
      fontSize: 20,
      fontWeight: 700,
    },
    description: {
      fontSize: 14,
      fontWeight: 400,
    },
    body: {
      fontSize: 16,
    },
  },
  palette: {
    primary: {
      main: '#0066FF',
      dark: '#050F77',
      light: '#CCE0FF',
    },
    secondary: {
      main: '#FF9933',
      dark: '#E86826',
    },
    success: {
      main: '#59A553',
    },
    error: {
      main: '#D92222',
    },
  },
  customSpacing: {
    small: 8,
    medium: 16,
    large: 24,
    xLarge: 32,
  },
})

export default theme
