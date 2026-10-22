import type { ComponentProps } from 'react'
import type { IntlProvider } from 'react-intl'

import { BLUE_04, ORANGE_01 } from '../../../shared/colors.ts'

type FormatXMLElementFn = NonNullable<
	ComponentProps<typeof IntlProvider>['defaultRichTextElements']
>[string]

export const Bold: FormatXMLElementFn = (parts) => {
	return <b>{parts}</b>
}

export const Orange: FormatXMLElementFn = (parts) => {
	return <span style={{ color: ORANGE_01 }}>{parts}</span>
}

export const Blue: FormatXMLElementFn = (parts) => {
	return <span style={{ color: BLUE_04 }}>{parts}</span>
}

export const Break: FormatXMLElementFn = (_parts) => {
	return <br />
}

export const Mono: FormatXMLElementFn = (parts) => {
	return <pre style={{ display: 'inline' }}>{parts}</pre>
}
