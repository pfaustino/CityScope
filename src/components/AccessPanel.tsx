import type { AccessGap } from '@shared/types.ts'
import { STATUS_LABEL } from '@shared/types.ts'
import { Banner } from './Stat.tsx'

export function AccessPanel({ gap }: { gap: AccessGap }) {
  return (
    <div>
      <Banner kind="restricted">
        <strong>{gap.headline}</strong>
        <div>{gap.detail}</div>
      </Banner>
      <p>
        <span className={`status ${gap.status}`} />
        {STATUS_LABEL[gap.status]}
      </p>
      <p>{gap.howToObtain}</p>
      <ul>
        {gap.portals.map((p) => (
          <li key={p.url}>
            <a href={p.url}>{p.name}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
