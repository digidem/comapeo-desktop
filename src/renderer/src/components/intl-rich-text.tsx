import type { ComponentProps } from 'react'
import type { IntlProvider } from 'react-intl'

import { CORNFLOWER_BLUE, ORANGE } from '../colors.ts'

type FormatXMLElementFn = NonNullable<
	ComponentProps<typeof IntlProvider>['defaultRichTextElements']
>[string]

export const Bold: FormatXMLElementFn = (parts) => {
	return <b>{parts}</b>
}

export const Orange: FormatXMLElementFn = (parts) => {
	return <span style={{ color: ORANGE }}>{parts}</span>
}

export const Blue: FormatXMLElementFn = (parts) => {
	return <span style={{ color: CORNFLOWER_BLUE }}>{parts}</span>
}

export const Break: FormatXMLElementFn = (_parts) => {
	return <br />
}
