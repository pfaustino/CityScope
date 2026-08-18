import { gapFor } from '@shared/accessGaps.ts'
import {
  CAMPAIGN_LIMITATIONS,
  campaignContributionProvenance,
  campaignUsd,
  committeesByElectionYear,
  CONTRIBUTOR_CODE_LABEL,
  contributionRatio,
  EFILE_SEARCH_URL,
} from '@shared/campaigns.ts'
import { CLAIM_LABEL } from '@shared/types.ts'
import { AccessPanel } from '../components/AccessPanel.tsx'
import { HorizontalMoneyChart } from '../components/MoneyChart.tsx'
import { Banner, Stat } from '../components/Stat.tsx'
import { useCityData } from '../lib/data.ts'

export function CampaignsPage() {
  const { warehouse } = useCityData()
  const gap = gapFor('campaigns')
  const snap = warehouse.campaigns
  if (!snap) {
    if (!gap) return null
    return (
      <div className="page">
        <h1>Campaigns</h1>
        <AccessPanel gap={gap} />
      </div>
    )
  }

  const byYear = committeesByElectionYear(snap)
  const y2024 = byYear.find((g) => g.year === 2024)?.committees ?? []
  const rizzotti = y2024.find((c) => c.stateId === '1466605')
  const anthony = y2024.find((c) => c.stateId === '1470392')
  const ratio2024 =
    rizzotti && anthony
      ? contributionRatio(
          rizzotti.yearEnd460.totalContributionsReceived,
          anthony.yearEnd460.totalContributionsReceived,
        )
      : null

  return (
    <div className="page">
      <h1>Campaigns</h1>
      <p className="lede">
        Sitting Burbank City Council members from{' '}
        <a href={EFILE_SEARCH_URL}>Burbank eFile</a>. Last campaign-year Form 460 Line 5 Column B
        (calendar year to date), plus itemized Schedule A contributors from every 460 in that year.
      </p>
      <Banner kind="live">
        {CLAIM_LABEL.fact} / snapshot. Five sitting council members. 2022 and 2024 are different
        elections. These totals are what those committees received. Independent expenditures are not
        included. Itemized names are Schedule A; smaller gifts are usually unitemized. A contribution
        is not evidence a later vote was caused by a donor. Correlation is not causation.
      </Banner>
      <p>
        <span className="pill fact">{CLAIM_LABEL.fact}</span>
        <span className="pill calculation">{CLAIM_LABEL.calculation}</span>
        <span className="pill snapshot">snapshot</span>
      </p>
      <div className="grid stats">
        {snap.committees.map((committee) => (
          <Stat
            key={committee.stateId}
            label={`${committee.yearEnd460.calendarYear} contributions (${committee.candidateName})`}
            value={campaignUsd(committee.yearEnd460.totalContributionsReceived)}
            provenance={campaignContributionProvenance(warehouse, committee)}
          />
        ))}
      </div>

      {byYear.map((group) => (
        <section key={group.year}>
          <h2>{group.year} calendar-year totals</h2>
          <p className="meta">
            {CLAIM_LABEL.fact}. Form 460 Line 5 Column B on the last {group.year}-period statement
            (election {group.electionDate}). {CLAIM_LABEL.calculation}: sorted large to small within
            this year only. Chart tooltip rounds to whole dollars; the table keeps cents as
            published. Do not compare {group.year} totals to another election year as the same race.
          </p>
          {group.year === 2024 && ratio2024 != null ? (
            <p className="meta">
              {CLAIM_LABEL.calculation}. Rizzotti ÷ Anthony Line 5 Column B = {ratio2024.toFixed(2)}
              ×.
            </p>
          ) : null}
          <HorizontalMoneyChart
            data={group.committees.map((committee) => ({
              label: committee.candidateName,
              value: committee.yearEnd460.totalContributionsReceived,
            }))}
            yAxisWidth={160}
          />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Committee</th>
                  <th>State ID</th>
                  <th className="num">Monetary</th>
                  <th className="num">Loans</th>
                  <th className="num">Nonmonetary</th>
                  <th className="num">Total received</th>
                  <th className="num">Spent</th>
                  <th className="num">Cash on hand</th>
                </tr>
              </thead>
              <tbody>
                {group.committees.map((committee) => {
                  const row = committee.yearEnd460
                  return (
                    <tr key={committee.stateId}>
                      <td>{committee.candidateName}</td>
                      <td>
                        <a href={row.pdfUrl}>{committee.committeeName}</a>
                      </td>
                      <td>{committee.stateId}</td>
                      <td className="num">{campaignUsd(row.monetaryContributions)}</td>
                      <td className="num">{campaignUsd(row.loansReceived)}</td>
                      <td className="num">{campaignUsd(row.nonmonetaryContributions)}</td>
                      <td className="num">{campaignUsd(row.totalContributionsReceived)}</td>
                      <td className="num">{campaignUsd(row.totalExpendituresMade)}</td>
                      <td className="num">{campaignUsd(row.endingCashBalance)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {byYear.flatMap((group) => group.committees).map((committee) => {
        const row = committee.yearEnd460
        return (
          <section key={`${committee.stateId}-detail`}>
            <h2>{committee.candidateName}</h2>
            <p className="meta">
              {committee.committeeName} (ID {committee.stateId}). {committee.office}. Election{' '}
              {committee.electionDate}. {CLAIM_LABEL.fact}.
            </p>
            <ul>
              <li>
                Year-end Form 460 filed {row.filedOn} (filing {row.filingId}
                {row.terminated ? '; committee later filed a termination statement' : ''}).{' '}
                <a href={row.pdfUrl}>Open the PDF</a>
              </li>
              <li>
                Total contributions received (Line 5 Column B): {campaignUsd(row.totalContributionsReceived)}
              </li>
              <li>
                Total expenditures made (Line 11 Column B): {campaignUsd(row.totalExpendituresMade)}
              </li>
              <li>Ending cash (Line 16): {campaignUsd(row.endingCashBalance)}</li>
            </ul>
            <h3>Itemized Schedule A contributors</h3>
            <p className="meta">
              {CLAIM_LABEL.fact}. Names from Schedule A on every {committee.electionYear} campaign-year
              Form 460 for this committee, not only the year-end statement. Rolled up by name and city.{' '}
              {CLAIM_LABEL.calculation}: sorted large to small. Gifts under $100 are usually unitemized.
              Street addresses are on the PDFs and are not listed here.
            </p>
            {committee.scheduleA.itemized.length > 0 ? (
              <HorizontalMoneyChart
                data={committee.scheduleA.itemized.slice(0, 10).map((person) => ({
                  label: person.name,
                  value: person.amount,
                }))}
                yAxisWidth={220}
              />
            ) : null}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Contributor</th>
                    <th>City</th>
                    <th>Type</th>
                    <th>Occupation / employer</th>
                    <th className="num">Itemized</th>
                    <th className="num">Gifts</th>
                  </tr>
                </thead>
                <tbody>
                  {committee.scheduleA.itemized.map((person) => (
                    <tr key={`${committee.stateId}-${person.name}-${person.city ?? ''}-${person.zip ?? ''}`}>
                      <td>{person.name}</td>
                      <td>
                        {[person.city, person.state].filter(Boolean).join(', ')}
                      </td>
                      <td>
                        {person.contributorCode
                          ? CONTRIBUTOR_CODE_LABEL[person.contributorCode]
                          : ''}
                      </td>
                      <td>{person.occupationEmployer ?? ''}</td>
                      <td className="num">{campaignUsd(person.amount)}</td>
                      <td className="num">{person.giftCount}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Unitemized contributions of less than $100</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="num">{campaignUsd(committee.scheduleA.unitemized)}</td>
                    <td className="num"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="meta">
              {CLAIM_LABEL.calculation}. Itemized {campaignUsd(committee.scheduleA.itemizedTotal)} +
              unitemized {campaignUsd(committee.scheduleA.unitemized)} = Line 1 Column B monetary{' '}
              {campaignUsd(row.monetaryContributions)}.
            </p>
            {committee.officeholder470.length > 0 ? (
              <>
                <h3>Officeholder Form 470</h3>
                <p className="meta">
                  {CLAIM_LABEL.fact}. Short form listed on eFile for later calendar years. Form 470
                  means the officeholder certified they would not raise or spend $2,000 that year. It
                  is not a dollar total.
                </p>
                <ul>
                  {committee.officeholder470.map((filing) => (
                    <li key={`${committee.stateId}-470-${filing.calendarYear}`}>
                      {filing.calendarYear} ({filing.coversFrom} through {filing.coversThrough}),
                      filed {filing.filedOn}.{' '}
                      <a href={filing.pdfUrl}>Open the PDF</a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </section>
        )
      })}

      <h2>What this extract is not</h2>
      <ul>
        {CAMPAIGN_LIMITATIONS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}
