import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCityData } from '../lib/data.ts'

type NavGroup = {
  group: string
  split?: boolean
  muted?: boolean
  note?: string
  items: { to: string; label: string }[]
}

const NAV: NavGroup[] = [
  { group: 'Desk', items: [
    { to: '/', label: 'Dashboard' },
    { to: '/reports', label: 'Reports' },
    { to: '/map', label: 'Map' },
    { to: '/investigations', label: 'Investigations' },
  ]},
  { group: 'With data', items: [
    { to: '/crime', label: 'Crime' },
    { to: '/demographics', label: 'Demographics' },
    { to: '/environment', label: 'Environment' },
    { to: '/sources', label: 'Data Sources' },
  ]},
  {
    group: 'No dataset yet',
    split: true,
    muted: true,
    note: 'Not connected or access restricted. These pages do not show city statistics.',
    items: [
      { to: '/businesses', label: 'Businesses' },
      { to: '/development', label: 'Development' },
      { to: '/money', label: 'Money' },
      { to: '/police', label: 'Police' },
      { to: '/transportation', label: 'Transportation' },
      { to: '/airport', label: 'Airport' },
    ],
  },
  { group: 'System', items: [
    { to: '/settings', label: 'Settings' },
  ]},
]

export function Layout() {
  const { warehouse } = useCityData()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const hasCollisions = warehouse.collisions.length > 0
  const groups = NAV.map((g) => {
    if (g.group === 'With data' && hasCollisions) {
      const beforeSources = g.items.filter((i) => i.to !== '/sources')
      const sources = g.items.filter((i) => i.to === '/sources')
      return { ...g, items: [...beforeSources, { to: '/transportation', label: 'Transportation' }, ...sources] }
    }
    if (g.group === 'No dataset yet' && hasCollisions) {
      return { ...g, items: g.items.filter((i) => i.to !== '/transportation') }
    }
    return g
  })

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <div className="shell">
      {navOpen ? (
        <button
          type="button"
          className="nav-overlay"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      ) : null}
      <aside id="site-nav" className={navOpen ? 'side is-open' : 'side'}>
        <NavLink to="/" className="brand" end>
          <strong>CityScope</strong>
          <span>Burbank, California</span>
        </NavLink>
        <nav className="nav">
          {groups.map((g) => (
            <div key={g.group} className={[g.split && 'split', g.muted && 'muted'].filter(Boolean).join(' ') || undefined}>
              <div className="group">{g.group}</div>
              {g.note ? <p className="nav-note">{g.note}</p> : null}
              {g.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="mast">
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={navOpen}
            aria-controls="site-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            Menu
          </button>
          <div>
            <div className="kicker">Public data desk</div>
            <div className="serif">Turn Burbank’s public data into verifiable information.</div>
          </div>
          <div className="kicker mast-end">Investigative without being accusatory</div>
        </header>
        <Outlet />
      </div>
    </div>
  )
}
