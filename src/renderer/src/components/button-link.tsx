/**
 * Based on
 * https://tanstack.com/router/latest/docs/framework/react/guide/custom-link#button
 */
import MUIButton, { type ButtonProps } from '@mui/material/Button'
import MUIIconButton, { type IconButtonProps } from '@mui/material/IconButton'
import { createLink } from '@tanstack/react-router'

export const ButtonLink = createLink((props: ButtonProps<'a'>) => {
	return <MUIButton component="a" ref={props.ref} {...props} />
})

export const IconButtonLink = createLink((props: IconButtonProps<'a'>) => {
	return <MUIIconButton component="a" ref={props.ref} {...props} />
})
