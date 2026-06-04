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
		<Stack direction="column">
			<Typography sx={{ fontWeight: 500 }}>{primaryText}</Typography>

			<Typography color="textSecondary" aria-hidden>
				{secondaryText}
			</Typography>
		</Stack>
	)
}
