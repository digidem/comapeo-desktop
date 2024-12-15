import type { ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'

import { ReuseableProviderWrapper } from '../AppWrapper'

const customRender = (ui: ReactNode, options: RenderOptions) =>
	render(ui, { wrapper: ReuseableProviderWrapper, ...options })

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }
