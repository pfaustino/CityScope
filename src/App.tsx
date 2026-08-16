import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import { ProvenanceProvider } from './components/ProvenanceDrawer.tsx'
import { AirportPage } from './pages/AirportPage.tsx'
import { BusinessPage } from './pages/BusinessPage.tsx'
import { CrimePage } from './pages/CrimePage.tsx'
import { DashboardPage } from './pages/DashboardPage.tsx'
import { DemographicsPage } from './pages/DemographicsPage.tsx'
import { DevelopmentPage } from './pages/DevelopmentPage.tsx'
import { EntityPage } from './pages/EntityPage.tsx'
import { EnvironmentPage } from './pages/EnvironmentPage.tsx'
import { InvestigationsPage } from './pages/InvestigationsPage.tsx'
import { MapPage } from './pages/MapPage.tsx'
import { MoneyPage } from './pages/MoneyPage.tsx'
import { PolicePage } from './pages/PolicePage.tsx'
import { ReportDetailPage } from './pages/ReportDetailPage.tsx'
import { ReportsPage } from './pages/ReportsPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { SourcesPage } from './pages/SourcesPage.tsx'
import { TransportationPage } from './pages/TransportationPage.tsx'

export default function App() {
  return (
    <ProvenanceProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/investigations" element={<InvestigationsPage />} />
          <Route path="/businesses" element={<BusinessPage />} />
          <Route path="/crime" element={<CrimePage />} />
          <Route path="/development" element={<DevelopmentPage />} />
          <Route path="/money" element={<MoneyPage />} />
          <Route path="/police" element={<PolicePage />} />
          <Route path="/demographics" element={<DemographicsPage />} />
          <Route path="/transportation" element={<TransportationPage />} />
          <Route path="/environment" element={<EnvironmentPage />} />
          <Route path="/airport" element={<AirportPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/investigate/:kind/:id" element={<EntityPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProvenanceProvider>
  )
}
