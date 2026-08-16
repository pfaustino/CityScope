import { gapFor } from '@shared/accessGaps.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'

export function BusinessPage() {
  const gap = gapFor('business')
  if (!gap) return null
  return (
    <div className="page">
      <h1>Business pulse</h1>
      <AccessPanel gap={gap} />
    </div>
  )
}
