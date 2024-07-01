import {
  TypographyVariants,
  TypographyVariantsOptions,
} from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface TypographyVariants {
    title: React.CSSProperties
    description: React.CSSProperties
    body: React.CSSProperties
  }
  interface Theme {
    customSpacing: {
      small: number
      medium: number
      large: number
      xLarge: number
    }
  }

  interface ThemeOptions {
    customSpacing?: {
      small?: number
      medium?: number
      large?: number
      xLarge?: number
    }
  }

  interface TypographyVariantsOptions {
    title?: React.CSSProperties
    description?: React.CSSProperties
    body?: React.CSSProperties
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    title: true
    description: true
    body: true
  }
}
