# CityScope

## Product Vision

Build a web-based investigative data platform called CityScope

The application continuously collects publicly available data about the City of Burbank, California, analyzes changes and relationships across datasets, identifies unusual or potentially important patterns, and generates human-readable reports.

The application should function as a combination of:

- Local government data portal
- Data aggregation engine
- Geographic information system
- Statistical analysis platform
- Investigative research assistant
- Automated report generator
- Public transparency dashboard

The application must prioritize accuracy, source transparency, reproducibility, privacy, and responsible interpretation.

The system must NEVER imply that a correlation proves causation and must clearly distinguish facts, calculations, correlations, observations, and hypotheses.

---

# 1. PRIMARY GEOGRAPHIC SCOPE

The default geographic boundary is:

**City of Burbank, California**

The system should support:

- Citywide analysis
- Neighborhood analysis when reliable boundaries exist
- Census tract
- Census block group
- ZIP code
- Police sector/beat when available
- Parcel
- Address
- Latitude/longitude
- Radius from a specified location

The architecture should allow future expansion to:

- Glendale
- Pasadena
- Los Angeles
- San Fernando Valley
- Los Angeles County
- California

Burbank should remain the default.

---

# 2. CORE REPORTS

The first release must support these ten report categories.

## Report 1 — Crime & Public Safety

Analyze:

- Crimes
- Crime categories
- Locations
- Dates
- Times
- Police sectors
- Trends
- Hotspots
- Traffic collisions
- Arrests where legally/publicly available
- Clearance information where available

Generate:

- Weekly report
- Monthly report
- Quarterly report
- Annual report

Automatically calculate:

- Month-over-month change
- Year-over-year change
- Rolling averages
- Crime rate per population where appropriate
- Geographic concentration
- Time-of-day patterns
- Day-of-week patterns

Never identify private individuals unless the underlying source is already lawfully public and publication is appropriate.

---

# 3. Housing & Real Estate

Analyze:

- Building permits
- Residential permits
- Commercial permits
- Demolition permits
- Remodeling
- New construction
- Property information
- Zoning
- Housing Census data
- Rent data when available
- Home-value data when legally/publicly available

Generate:

- Development by neighborhood
- Construction trends
- Permit volume
- Estimated construction value
- Residential vs. commercial development
- Geographic development hotspots

---

# 4. Business Pulse

Track:

- Business licenses
- New businesses
- Business closures where detectable
- Business categories
- Locations
- Opening dates
- Geographic concentration
- Business turnover

Generate:

- New businesses this month
- Businesses that appear to have ceased operations
- Fast-growing business categories
- Declining categories
- Most active commercial corridors
- Neighborhood business growth

The system must clearly label inferred closures as "possible closure" unless a definitive closure record exists.

---

# 5. City Spending & Contracts

Analyze:

- City expenditures
- Vendors
- Contracts
- Purchase orders
- Department budgets
- Actual expenditures
- Capital projects
- Procurement
- Recurring vendors

Generate:

- Largest vendors
- Largest contracts
- Department spending
- Budget vs. actual
- Year-over-year changes
- Unusual spending changes
- Recurring payments
- Capital-project spending

Allow users to drill from:

City → Department → Vendor → Transaction/Contract

Every financial figure must link back to the source record.

---

# 6. Development Watch

Create a geographic project-tracking system.

For every identifiable development project, attempt to associate:

- Address
- Parcel
- Zoning
- Permit
- Permit date
- Permit type
- Project description
- Estimated value
- Contractor where public
- Applicant where public
- Status
- Related permits

Create a project timeline.

Example:

2024-02-01 — Planning application  
2024-05-12 — Permit submitted  
2024-07-03 — Permit approved  
2024-08-10 — Construction permit  
2025-03-01 — Inspection  
2025-07-20 — Additional permit

Display projects on a map.

---

# 7. Police Accountability

Create a dedicated transparency section.

Automatically ingest all publicly available Burbank police information that can legally and reliably be obtained.

Potential sources include:

- Policies
- Training documents
- Complaints
- Use-of-force information
- Arrest statistics
- Crime data
- Department spending
- Staffing information
- Flock transparency information
- Public contracts
- Public audits

Create a separate "restricted data" architecture for information that may require:

- California Public Records Act requests
- Agency authorization
- Vendor authorization
- Special API credentials

Do not pretend restricted data is available.

For every unavailable dataset, display:

**Access Status: Restricted**

and explain how access could potentially be obtained.

Flock/ALPR data must initially be treated as restricted unless an authorized API or public dataset becomes available.

---

# 8. Demographic & Economic Change

Use Census and other authoritative public sources.

Track:

- Population
- Age
- Income
- Poverty
- Employment
- Education
- Housing
- Rent
- Home ownership
- Household size
- Transportation
- Language
- Population change

Allow comparisons between:

- Burbank overall
- Census tracts
- Neighborhoods
- Different years

Generate an annual "Burbank Is Changing" report.

---

# 9. Transportation

Analyze:

- Traffic collisions
- Roads
- Intersections
- Public transportation
- Parking
- Construction
- Airport-related transportation data where available

Identify:

- Dangerous intersections
- Collision hotspots
- Collision trends
- Construction-related changes
- Transit patterns

Allow geographic visualization.

---

# 10. Airport

Create a Hollywood Burbank Airport section.

Track publicly available:

- Passenger volume
- Flights
- Airlines
- Destinations
- Aircraft
- Delays
- Airport activity
- Noise-related information

Allow geographic comparison with surrounding neighborhoods.

---

# 11. Environment & Risk

Track:

- Weather
- Extreme temperatures
- Rainfall
- Air quality
- Earthquakes
- Wildfire risk
- Flood risk
- Hazardous facilities
- Environmental violations
- Other authoritative environmental datasets

Generate:

- Monthly environmental report
- Extreme weather alerts
- Earthquake activity
- Environmental risk maps

---

# 12. DATA SOURCE ARCHITECTURE

Every dataset must have a source record.

Each source must contain:

- Source name
- Agency
- URL
- API endpoint
- Dataset identifier
- Authentication requirement
- Rate limit
- Update frequency
- Geographic coverage
- Historical coverage
- Fields available
- Last successful retrieval
- Last modified date if available
- Data quality rating
- Legal/access classification

Access classifications:

1. PUBLIC — no authentication
2. API_KEY — free/easy API key
3. REGISTRATION — free account required
4. AUTHORIZED — agency/vendor approval required
5. CPRA — public-records request potentially required
6. RESTRICTED — not currently accessible

---

# 13. SOURCE PROVENANCE

Every report statistic must be traceable.

For every number displayed, maintain:

- Source
- Dataset
- Retrieval timestamp
- Query parameters
- Geographic filter
- Time period
- Transformation/calculation performed

A user should be able to click:

**"143 new businesses"**

and see exactly where the number came from.

---

# 14. DATA INGESTION

Create scheduled ingestion jobs.

Default frequencies:

- Daily where data changes frequently
- Weekly for slower datasets
- Monthly for Census/economic datasets
- On-demand for historical datasets

The ingestion system must:

- Detect API failures
- Retry failed requests
- Respect rate limits
- Log failures
- Validate schemas
- Detect changed fields
- Detect duplicate records
- Record retrieval timestamps
- Preserve raw source data

Never silently overwrite historical source data.

---

# 15. DATA NORMALIZATION

Normalize common fields:

- Address
- Date
- Time
- Latitude
- Longitude
- ZIP
- Census tract
- Parcel
- Business name
- Agency
- Department
- Vendor

Use geocoding when necessary.

Store original source values alongside normalized values.

---

# 16. GEOGRAPHIC JOIN ENGINE

The application should automatically determine which geographic areas a record belongs to.

For example:

Incident  
→ coordinates  
→ Census tract  
→ ZIP  
→ police sector  
→ Burbank neighborhood

Parcel  
→ address  
→ zoning  
→ Census tract  
→ neighborhood

Business  
→ address  
→ coordinates  
→ commercial corridor  
→ Census tract

---

# 17. CROSS-DATASET ANALYSIS

This is one of the most important features.

Allow the system to correlate datasets.

Examples:

Crime + weather

Crime + demographics

Crime + business openings

Crime + development

Building permits + property values

Business closures + construction

Traffic collisions + road construction

Airport activity + noise complaints

City spending + contracts

Police activity + staffing

Environment + demographics

The system must label these as:

**Correlation / Association**

and never automatically state that one caused the other.

---

# 18. ANOMALY DETECTION

Automatically identify statistically unusual changes.

Examples:

- Crime suddenly increases
- Business closures spike
- A vendor's payments increase sharply
- Building permits suddenly concentrate in one area
- Traffic collisions increase at an intersection
- A department's spending deviates significantly from historical patterns

Each anomaly should include:

- Metric
- Baseline
- Current value
- Percentage change
- Historical comparison
- Confidence/strength
- Possible explanations
- Data limitations

Do not call something "fraud," "abuse," "corruption," or "criminal" based solely on statistical anomalies.

Use language such as:

**"Unusual pattern detected; further investigation may be warranted."**

---

# 19. REPORT GENERATION

Reports should be generated automatically.

Each report contains:

## Executive Summary

3–7 major findings.

## Key Numbers

Important statistics.

## What Changed?

Year-over-year and month-over-month comparisons.

## Geographic Analysis

Maps and neighborhood comparisons.

## Trends

Charts and time series.

## Notable Changes

Automatically detected anomalies.

## Cross-Dataset Findings

Potential relationships.

## What We Don't Know

Missing data and limitations.

## Sources

Every claim linked to its underlying dataset.

---

# 20. AI ANALYSIS

Use an AI model to help interpret data.

The AI may:

- Summarize findings
- Explain statistical changes
- Identify questions worth investigating
- Suggest additional datasets
- Generate report narratives
- Generate headlines
- Generate follow-up research questions

The AI must NOT:

- Invent facts
- Invent sources
- Claim causation without evidence
- Identify someone as a criminal based on statistical patterns
- Make unsupported allegations
- Hide uncertainty
- Modify source data

All AI-generated statements should be traceable to underlying data.

---

# 21. INVESTIGATION MODE

Allow a user to select an entity and investigate it.

Examples:

**Business**

→ permits  
→ property  
→ neighborhood  
→ Census  
→ nearby crime  
→ city contracts  
→ development

**Address**

→ parcel  
→ zoning  
→ permits  
→ businesses  
→ crime  
→ transportation  
→ demographics

**Vendor**

→ contracts  
→ payments  
→ departments  
→ spending over time

**Neighborhood**

→ crime  
→ businesses  
→ development  
→ demographics  
→ housing  
→ environment

---

# 22. MAP

Create an interactive Burbank map.

Layers should include:

- Crime
- Businesses
- Permits
- Development
- Parcels
- Zoning
- Roads
- Traffic collisions
- Police sectors
- Census tracts
- Environmental data
- Airport
- Other available datasets

Allow layers to be turned on/off.

---

# 23. REPORT DISCOVERY

The system should proactively suggest reports.

Examples:

**"Business closures in Magnolia Park increased 41%."**

**"A single intersection experienced an unusual increase in collisions."**

**"Construction activity in this Census tract has increased significantly."**

**"One city vendor's payments increased 280% year-over-year."**

The user can click:

**Investigate**

and the system creates an investigation workspace.

---

# 24. INVESTIGATION WORKSPACE

Allow users to save:

- Findings
- Charts
- Maps
- Sources
- Notes
- Documents
- API responses
- Questions
- Hypotheses

Create an investigation timeline.

Allow export to:

- PDF
- HTML
- Markdown
- CSV
- JSON

---

# 25. API ACCESS DASHBOARD

Create an administration screen showing every potential Burbank data source.

Columns:


| Source | Status | Authentication | Frequency | Last Update |
| ------ | ------ | -------------- | --------- | ----------- |


Example statuses:

🟢 Connected  
🟡 Needs API key  
🟠 Needs registration  
🔵 Needs CPRA request  
🔴 Restricted  
⚫ Unavailable

The system should explain exactly how to obtain access to each unavailable source.

---

# 26. INITIAL DATA SOURCE PRIORITY

Do NOT attempt to integrate every source initially.

Phase 1 should prioritize:

1. Burbank GIS / ArcGIS services
2. Burbank business data
3. Burbank permit/development data
4. Burbank financial information
5. Burbank police/public safety data
6. Census/ACS
7. California open data
8. Los Angeles County GIS
9. NOAA weather
10. USGS earthquake data

Flock/ALPR should be implemented as a future authorized/restricted connector rather than assuming access.

---

# 27. REPORT QUALITY STANDARD

Every report must answer:

1. What happened?
2. How large is the change?
3. Where did it happen?
4. When did it happen?
5. Compared with what baseline?
6. What data supports the conclusion?
7. What other explanations exist?
8. What information is missing?
9. What should a human investigate next?

---

# 28. USER INTERFACE

Main navigation:

**Dashboard**

**Reports**

**Map**

**Investigations**

**Businesses**

**Crime**

**Development**

**Money**

**Police**

**Demographics**

**Transportation**

**Environment**

**Airport**

**Data Sources**

**Settings**

---

# 29. HOME DASHBOARD

Display:

### Burbank Today

- Crime
- Business activity
- Development
- City spending
- Transportation
- Weather
- Environmental conditions

### This Week's Findings

Automatically selected notable changes.

### Investigations Worth Exploring

AI-generated suggestions based on unusual patterns.

### Data Health

Show whether data sources are current.

---

# 30. PRINCIPLE

The application's purpose is:

**"Turn Burbank's public data into understandable, verifiable information that helps residents understand what is happening in their city."**

The platform should be investigative without being accusatory.

It should surface facts and unusual patterns while leaving conclusions about wrongdoing to human investigation and evidence.