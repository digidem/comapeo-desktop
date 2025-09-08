import type { IconName } from '../generated/icons.generated'
import ICONS_SPRITE_URL from '../images/icons-sprite.svg'

export function getIconURL(iconName: IconName) {
	return `${ICONS_SPRITE_URL}#${iconName}`
}
