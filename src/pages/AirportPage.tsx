import { gapFor } from '@shared/accessGaps.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'

export function AirportPage() {
  const gap = gapFor('airport')
  if (!gap) return null
  return (
    <div className="page">
      <h1>Hollywood Burbank Airport</h1>
      <AccessPanel gap={gap} />
      <p>The map can still mark BUR’s coordinates. That is a location, not a passenger statistic.</p>
    </div>
  )
}
