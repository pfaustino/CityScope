import { gapFor } from '@shared/accessGaps.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'

export function MoneyPage() {
  const gap = gapFor('spending')
  if (!gap) return null
  return (
    <div className="page">
      <h1>City spending & contracts</h1>
      <AccessPanel gap={gap} />
    </div>
  )
}
