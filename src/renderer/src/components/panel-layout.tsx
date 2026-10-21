import type { ReactNode } from 'react'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function PanelHeader({
	icon,
	title,
	description,
}: {
	icon: ReactNode
	title: ReactNode
	description?: ReactNode
}) {
	return (
		<Stack direction="column" sx={{ alignItems: 'center', gap: 10 }}>
			{icon}

			<Typography
				variant="heroHeader"
				sx={{ textAlign: 'center', textWrap: 'balance' }}
			>
				{title}
			</Typography>

			{description ? (
				<Typography
					variant="heroSubheading"
					sx={{ textAlign: 'center', textWrap: 'balance' }}
				>
					{description}
				</Typography>
			) : null}
		</Stack>
	)
}

export function PanelBody({ children }: { children: ReactNode }) {
	return (
		<Stack direction="column" sx={{ alignItems: 'center', gap: 4 }}>
			{children}
		</Stack>
	)
}

export function PanelLayout({ children }: { children: ReactNode }) {
	return (
		<Stack direction="column" sx={{ flex: 1, overflow: 'auto' }}>
			<Container
				maxWidth="xs"
				sx={{
					display: 'flex',
					flex: 1,
					flexDirection: 'column',
					paddingBlock: 6,
					paddingInline: 4,
				}}
			>
				<Stack
					direction="column"
					sx={{
						flex: 1,
						gap: 12,
						justifyContent: 'center',
						overflow: 'auto',
						overflowWrap: 'break-word',
					}}
				>
					{children}
				</Stack>
			</Container>
		</Stack>
	)
}
