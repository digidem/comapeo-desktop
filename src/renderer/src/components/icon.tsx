import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon'

import ICONS_SPRITE_URL from '../images/icons-sprite.svg'
import type { IconName } from '../types/icons.generated'

export function Icon({
	name,
	size,
	sx,
	...props
}: Omit<SvgIconProps, 'name' | 'width' | 'height'> & {
	name: IconName
	size?: number | string
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
			<use href={`${ICONS_SPRITE_URL}#${name}`} />
		</SvgIcon>
	)
}
