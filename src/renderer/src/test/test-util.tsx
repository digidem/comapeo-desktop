import type { ComponentType, ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'

import { ReuseableProviderWrapper } from '../AppWrapper'

const combineWrappers =
	(...wrappers: Array<ComponentType<{ children: ReactNode }>>) =>
	({ children }: { children: ReactNode }) =>
		wrappers.reduce((acc, Wrapper) => <Wrapper>{acc}</Wrapper>, children)

const customRender = (
	ui: ReactNode,
	{
		wrapper: AdditionalWrapper,
		...options
	}: Omit<RenderOptions, 'wrapper'> & {
		wrapper?: React.ComponentType<{ children: React.ReactNode }>
	} = {},
) => {
	const Wrapper = AdditionalWrapper
		? combineWrappers(AdditionalWrapper, ReuseableProviderWrapper)
		: ReuseableProviderWrapper

	return render(ui, { wrapper: Wrapper, ...options })
}

export * from '@testing-library/react'

// override render method
export { customRender as render }
