/**
 * Based on
 * https://tanstack.com/router/latest/docs/framework/react/guide/custom-link#button
 */
import type { ComponentProps } from 'react'
import MUIButton, { type ButtonProps } from '@mui/material/Button'
import MUIButtonBase, {
	type ButtonBaseProps as MUIButtonBaseProps,
} from '@mui/material/ButtonBase'
import MUIIconButton, { type IconButtonProps } from '@mui/material/IconButton'
import MUILink, { type LinkProps as MUILinkProps } from '@mui/material/Link'
import MUIListItemButton, {
	type ListItemButtonProps as MUIListItemButtonProps,
} from '@mui/material/ListItemButton'
import { createLink, type LinkOptions } from '@tanstack/react-router'

const ButtonLinkComponent = createLink((props: ButtonProps<'a'>) => {
	return <MUIButton component="a" ref={props.ref} {...props} />
})

export type ButtonLinkProps = Omit<
	ComponentProps<typeof ButtonLinkComponent>,
	keyof LinkOptions
> &
	LinkOptions

export function ButtonLink(props: ButtonLinkProps) {
	return <ButtonLinkComponent {...props} />
}

const IconButtonLinkComponent = createLink((props: IconButtonProps<'a'>) => {
	return <MUIIconButton component="a" ref={props.ref} {...props} />
})

export type IconButtonLinkProps = Omit<
	ComponentProps<typeof IconButtonLinkComponent>,
	keyof LinkOptions
> &
	LinkOptions

export function IconButtonLink(props: IconButtonLinkProps) {
	return <IconButtonLinkComponent {...props} />
}

const TextLinkComponent = createLink((props: MUILinkProps) => {
	return <MUILink {...props} />
})

export type TextLinkComponentProps = Omit<
	ComponentProps<typeof TextLinkComponent>,
	keyof LinkOptions
> &
	LinkOptions

export function TextLink(props: TextLinkComponentProps) {
	return <TextLinkComponent {...props} />
}

const ButtonBaseLinkComponent = createLink((props: MUIButtonBaseProps) => {
	return <MUIButtonBase {...props} />
})

export type ButtonBaseLinkComponentProps = Omit<
	ComponentProps<typeof ButtonBaseLinkComponent>,
	keyof LinkOptions
> &
	LinkOptions

export function ButtonBaseLink(props: ButtonBaseLinkComponentProps) {
	return <ButtonBaseLinkComponent {...props} />
}

const ListItemButtonLinkComponent = createLink(
	(props: MUIListItemButtonProps) => {
		return <MUIListItemButton {...props} />
	},
)

export type ListItemButtonLinkComponentProps = Omit<
	ComponentProps<typeof ListItemButtonLinkComponent>,
	keyof LinkOptions
> &
	LinkOptions

export function ListItemButtonLink(props: ListItemButtonLinkComponentProps) {
	return <ListItemButtonLinkComponent {...props} />
}
