import { gapFor } from '@shared/accessGaps.ts'
import {
  budgetForFiscalYear,
  citywideBudgetVsActual,
  departmentChartRows,
  departmentRows,
  latestBudgetPeriod,
  openGovPaymentsProvenance,
  openGovProvenance,
  totalRow,
  ytdActualPeriod,
} from '@shared/opengov.ts'
import { CLAIM_LABEL } from '@shared/types.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'
import { BudgetActualChart, HorizontalMoneyChart } from '../components/MoneyChart.tsx'
import { MonthChart } from '../components/MonthChart.tsx'
import { Banner, Stat } from '../components/Stat.tsx'
import { num, usd, useCityData } from '../lib/data.ts'

const BWP = 'Burbank Water and Power'

export function MoneyPage() {
  const { warehouse } = useCityData()
  const gap = gapFor('spending')
  const snap = warehouse.budgetAnnual
  if (!snap) {
    if (!gap) return null
    return (
      <div className="page">
        <h1>City spending & contracts</h1>
        <AccessPanel gap={gap} />
      </div>
    )
  }

  const provenance = openGovProvenance(warehouse, snap)
  const latestBudget = latestBudgetPeriod(snap)
  const total = totalRow(snap)
  const ytd = ytdActualPeriod(snap)
  const ytdBudget = ytd ? budgetForFiscalYear(snap, ytd.fiscalYear) : undefined
  const latestTotal = latestBudget && total ? (total.amounts[latestBudget.label] ?? null) : null
  const ytdTotal = ytd && total ? (total.amounts[ytd.label] ?? null) : null
  const ytdBudgetTotal = ytdBudget && total ? (total.amounts[ytdBudget.label] ?? null) : null
  const vsActual = citywideBudgetVsActual(snap)
  const byDept = latestBudget ? departmentChartRows(snap, latestBudget.label) : []
  const withoutBwp = latestBudget
    ? departmentChartRows(snap, latestBudget.label, { exclude: [BWP] })
    : []
  const depts = departmentRows(snap)
  const payments = warehouse.payments

  return (
    <div className="page">
      <h1>City spending & contracts</h1>
      <p className="lede">
        OpenGov Annual — Departments export ({snap.fileName}). All-funds budget and actuals by
        department
        {payments ? `, plus vendor payments from ${payments.fileName}` : ''}. Not a contracts
        register.
      </p>
      <Banner kind="live">
        {CLAIM_LABEL.fact} / snapshot. Burbank Water and Power is an enterprise utility and is a
        large share of the all-funds total. May actuals are year-to-date through May, not a full
        fiscal year. Correlation is not causation.
      </Banner>
      <p>
        <span className="pill fact">{CLAIM_LABEL.fact}</span>
        <span className="pill calculation">{CLAIM_LABEL.calculation}</span>
        <span className="pill snapshot">snapshot</span>
      </p>
      <div className="grid stats">
        {latestBudget && latestTotal != null ? (
          <Stat
            label={`${latestBudget.label} (all funds)`}
            value={usd(latestTotal)}
            provenance={provenance}
          />
        ) : null}
        {ytd && ytdTotal != null ? (
          <Stat
            label={`${ytd.label} (YTD)`}
            value={usd(ytdTotal)}
            meta={
              ytdBudget && ytdBudgetTotal != null
                ? `${ytd.fiscalYear} adopted budget ${usd(ytdBudgetTotal)}`
                : undefined
            }
          />
        ) : null}
        <Stat label="Departments in this export" value={String(depts.length)} />
      </div>

      {latestBudget && byDept.length > 0 ? (
        <>
          <h2>{latestBudget.label} by department</h2>
          <p className="meta">
            {CLAIM_LABEL.fact}. Dollars from the OpenGov column “{latestBudget.label}”. Sorted
            large to small.
          </p>
          <HorizontalMoneyChart data={byDept} />
        </>
      ) : null}

      {latestBudget && withoutBwp.length > 0 ? (
        <>
          <h2>{latestBudget.label} excluding {BWP}</h2>
          <p className="meta">
            {CLAIM_LABEL.calculation}. Same column with {BWP} removed so other departments are
            readable. Not a general-fund extract — the file does not label funds.
          </p>
          <HorizontalMoneyChart data={withoutBwp} color="#132f3c" />
        </>
      ) : null}

      {vsActual.length > 0 ? (
        <>
          <h2>Budget vs year-end actual</h2>
          <p className="meta">
            {CLAIM_LABEL.fact}. Citywide totals. Only June year-end actual columns are compared to
            that year’s adopted budget. May year-to-date is not treated as a full-year actual.
          </p>
          <BudgetActualChart data={vsActual} />
        </>
      ) : null}

      <h2>All figures in this export</h2>
      <p className="meta">
        {CLAIM_LABEL.fact}. Report “{snap.report}”
        {snap.generatedOn ? `, download generated ${snap.generatedOn}` : ''}. Amounts are USD as
        published.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Department</th>
              {snap.periods.map((period) => (
                <th key={period.label} className="num">
                  {period.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snap.departments.map((row) => (
              <tr key={row.department}>
                <td>{row.department}</td>
                {snap.periods.map((period) => (
                  <td key={period.label} className="num">
                    {usd(row.amounts[period.label] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payments ? (
        <>
          <h2>Accounts Payable transactions</h2>
          <p className="lede">
            Vendor Payment Listing from{' '}
            <a href={payments.sourceUrl}>OpenGov Accounts Payable Transactions</a>. Invoice
            payments, not contracts, and not a department rollup.
          </p>
          <Banner kind="live">
            {CLAIM_LABEL.fact} / snapshot. {num(payments.count)} payments totaling {usd(payments.total)}{' '}
            from {payments.dateStart} through {payments.dateEnd}. Negative amounts are refunds or
            adjustments as published. Large vendors include payroll, retirement, and utilities.
            Correlation is not causation.
          </Banner>
          <div className="grid stats">
            <Stat
              label="AP invoice total"
              value={usd(payments.total)}
              provenance={openGovPaymentsProvenance(warehouse, payments)}
            />
            <Stat label="Payment rows" value={num(payments.count)} />
            <Stat
              label="Payment dates"
              value={`${payments.dateStart ?? 'n/a'} – ${payments.dateEnd ?? 'n/a'}`}
            />
          </div>
          <h3>Top vendors by invoice amount</h3>
          <p className="meta">
            {CLAIM_LABEL.calculation}. Sum of Invoice Amount by Vendor Name. Top{' '}
            {payments.topVendors.length} of this extract. Not a ranking of waste.
          </p>
          <HorizontalMoneyChart
            data={payments.topVendors.map((row) => ({ label: row.vendor, value: row.amount }))}
            yAxisWidth={220}
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th className="num">Payments</th>
                  <th className="num">Invoice amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.topVendors.map((row) => (
                  <tr key={row.vendor}>
                    <td>{row.vendor}</td>
                    <td className="num">{num(row.count)}</td>
                    <td className="num">{usd(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Payments by month</h3>
          <p className="meta">
            {CLAIM_LABEL.calculation}. Sum of Invoice Amount by Payment Date month (YYYY-MM). This
            extract has no payments dated June 2026.
          </p>
          <MonthChart
            data={Object.fromEntries(payments.byMonth.map((row) => [row.month, row.amount]))}
          />
        </>
      ) : (
        <p className="meta">
          Accounts Payable Transactions are not loaded. Place OpenGov-Accounts-Payable.csv at the
          repo root or download from{' '}
          <a href="https://burbankca.opengov.com/data/#/1296">Burbank OpenGov AP</a>.
        </p>
      )}
    </div>
  )
}
