import type { SVGProps } from 'react'
import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon'

import type { IconName } from '../types/icons.generated'

const SPRITE_PATH = '/icons/sprite.svg'

export function Icon({
	name,
	size,
	sx,
	...props
}: Omit<SvgIconProps, 'name' | 'width' | 'height'> & {
	name: IconName
	size?: number
}) {
	return (
		<SvgIcon
			{...props}
			width={size}
			height={size}
			// MUI sets the height and width css properties on the SVG element.
			// Unsetting these properties is needed in order for the height and width SVG attributes to actually work.
			sx={
				size
					? {
							...sx,
							height: 'unset',
							width: 'unset',
						}
					: sx
			}
		>
			<use href={`${SPRITE_PATH}#${name}`} />
		</SvgIcon>
	)
}

export function Icon2({
	name,
	...props
}: SVGProps<SVGSVGElement> & {
	name: IconName
}) {
	return (
		<svg {...props}>
			<use href={`${SPRITE_PATH}#${name}`} />
		</svg>
	)
}
