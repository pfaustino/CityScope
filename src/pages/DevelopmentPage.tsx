import { gapFor } from '@shared/accessGaps.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'

export function DevelopmentPage() {
  const gap = gapFor('permits')
  if (!gap) return null
  return (
    <div className="page">
      <h1>Development watch</h1>
      <AccessPanel gap={gap} />
    </div>
  )
}
