// Adapted version of https://suspense.epicreact.dev/exercise/04/01/solution
import { use, type ComponentProps } from 'react'

import { imageSrcResource } from '../lib/image'

type SuspenseImageProps = ComponentProps<'img'> &
	Required<Pick<ComponentProps<'img'>, 'src'>>

export function SuspenseImage({ src, ...props }: SuspenseImageProps) {
	const s = use(imageSrcResource(src))
	return <img src={s} {...props} />
}
