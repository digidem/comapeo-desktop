import SvgIcon, { type SvgIconProps } from '@mui/material/SvgIcon'

import type { IconName } from '../generated/icons.generated'
import { getIconURL } from '../lib/icons'

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
			<use href={getIconURL(name)} />
		</SvgIcon>
	)
}
