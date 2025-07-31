export type AudioInfo = {
	src: string
	duration: number
}

const audioCache = new Map<string, Promise<AudioInfo>>()

function preloadAudio(src: string) {
	const { resolve, reject, promise } = Promise.withResolvers<AudioInfo>()

	const audio = new Audio(src)

	audio.onloadedmetadata = () => {
		if (Number.isNaN(audio.duration)) {
			reject(new Error('No media data available to determine duration'))
			return
		}

		if (!Number.isFinite(audio.duration)) {
			reject(new Error('Media does not have a known duration'))
			return
		}

		resolve({
			src,
			duration: audio.duration,
		})
	}
	audio.onerror = reject

	return promise
}

export function audioInfoResource(src: string) {
	const promise = audioCache.get(src) ?? preloadAudio(src)

	audioCache.set(src, promise)

	return promise
}
