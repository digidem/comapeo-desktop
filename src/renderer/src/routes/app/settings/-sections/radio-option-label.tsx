import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function RadioOptionLabel({
	primaryText,
	secondaryText,
}: {
	primaryText: string
	secondaryText: string
}) {
	return (
		<Stack direction="column" sx={{ gap: 1 }}>
			<Typography
				sx={{ fontWeight: (theme) => theme.typography.fontWeightMedium }}
			>
				{primaryText}
			</Typography>

			<Typography color="textTertiary" aria-hidden>
				{secondaryText}
			</Typography>
		</Stack>
	)
}
