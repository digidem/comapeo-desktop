import ICONS_SPRITE_URL from '../images/icons-sprite.svg'
import type { IconName } from '../types/icons.generated'

export function getIconURL(iconName: IconName) {
	return `${ICONS_SPRITE_URL}#${iconName}`
}
