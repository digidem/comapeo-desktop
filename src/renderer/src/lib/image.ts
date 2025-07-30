// Adapted version of https://suspense.epicreact.dev/exercise/04/01/solution
const imageCache = new Map<string, Promise<string>>()

function preloadImage(src: string) {
	const { resolve, reject, promise } = Promise.withResolvers<string>()
	const image = new Image()

	image.src = src
	image.onload = () => resolve(src)
	image.onerror = reject

	return promise
}

export function imageSrcResource(src: string) {
	const promise = imageCache.get(src) ?? preloadImage(src)

	imageCache.set(src, promise)

	return promise
}
