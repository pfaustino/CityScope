import { accessStatus, loadEnv } from './env.ts'

loadEnv()
const status = accessStatus()
console.log('CENSUS_API_KEY', status.CENSUS_API_KEY ? 'set' : 'missing')
console.log('NOAA_CDO_TOKEN', status.NOAA_CDO_TOKEN ? 'set' : 'missing')
console.log('AIRNOW_API_KEY', status.AIRNOW_API_KEY ? 'set' : 'missing')
console.log('DATA_GOV_API_KEY', status.DATA_GOV_API_KEY ? 'set' : 'missing')
console.log('signup', status.signup)
