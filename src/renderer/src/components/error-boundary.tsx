import type { ErrorInfo, ReactElement, ReactNode } from 'react'
// NOTE: Not sure if using CatchBoundary is really safe to use for generic purposes. Might need to switch to `react-error-boundary`.
import { CatchBoundary, type ErrorComponentProps } from '@tanstack/react-router'

export function ErrorBoundary({
	children,
	fallback,
	getResetKey,
	onError,
}: {
	children: ReactNode
	getResetKey: () => number | string
	fallback: (props: ErrorComponentProps) => ReactElement
	onError?: (error: Error, errorInfo?: ErrorInfo) => void
}) {
	return (
		<CatchBoundary
			getResetKey={getResetKey}
			errorComponent={fallback}
			onCatch={onError}
		>
			{children}
		</CatchBoundary>
	)
}
