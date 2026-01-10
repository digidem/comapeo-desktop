import {
	notFound,
	type AnyRouter,
	type NotFoundError,
	type ToOptions,
} from '@tanstack/react-router'
import * as v from 'valibot'

export const CustomNotFoundDataSchema = v.object({
	message: v.string(),
})

type CustomNotFoundData = v.InferInput<typeof CustomNotFoundDataSchema>

export function customNotFound(
	options: Omit<NotFoundError, 'data'> & { data: CustomNotFoundData },
): NotFoundError {
	return notFound(options)
}

// NOTE: Accounts for bugs where `router.navigate()` doesn't account for hash history and file URIs
// when navigating with document reloading enabled.
// (https://discord.com/channels/719702312431386674/1431138480096022680)
export function buildDocumentReloadURL(
	router: Pick<AnyRouter, 'buildLocation' | 'history' | 'origin'>,
	to: NonNullable<ToOptions['to']>,
) {
	// Accounts for hash history usage
	const hrefUsingHash = router.history.createHref(
		router.buildLocation({ to }).href,
	)

	// Accounts for file URI scenario by creating an "external" href that tanstack router will handle more correctly internally
	return new URL(hrefUsingHash, router.origin || '').href
}
