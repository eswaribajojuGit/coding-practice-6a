const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()

const dbPath = path.join(__dirname, 'covid19India.db')
app.use(express.json())

let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertStateDbObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
const convertDistrictDbObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    disrtictName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getAllStatesQuery = `
  SELECT 
  *
  FROM
  state
  ORDER BY
  state_id;`
  const statesArray = await db.all(getAllStatesQuery)
  response.send(
    statesArray.map(eachState =>
      convertStateDbObjectToResponseObject(eachState),
    ),
  )
})
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getState = `
  SELECT 
  *
  FROM
  state
  WHERE
  state_id = ${stateId};`
  const state = await db.get(getState)
  response.send(convertStateDbObjectToResponseObject(state))
})
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO 
  district(district_name,state_id,cases,cured,active,deaths)
  VALUES
     ('${districtName}',
     ${stateId},
     ${cases},
     ${cured},
     ${active},
     ${deaths});`
  await db.run(postDistrictQuery)
  response.send('District Successfully Added')
})
app.get('districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const getDistrict = `
  SELECT 
  *
  FROM 
  district
  WHERE
  district_id = ${districtId};`
  const newDistrict = await db.get(getDistrict)
  const districtResult = convertDistrictDbObjectToResponseObject(newDistrict)
  response.send(districtResult)
})
app.delete('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  SELECT
  *
  FROM
  district
  WHERE
  district_id = ${districtId}`
  await db.run(deleteDistrict)
  response.send('District Removed')
})
app.put('/districts/:districtId', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictDetails = `
  UPDATE district SET
                     district_name = ${districtName},
                     state_id = ${stateId},
                     cases = ${cases},
                     cured = ${cured},
                     active = ${active},
                     deaths = ${deaths}
                WHERE district_id = ${districtId};`
  await db.run(updateDistrictDetails)
  response.send('District Details Updated')
})
app.get('states/:stateId/stats', async (request, response) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
      FROM 
        districts 
      WHERE 
        state_id = ${stateId};`
  const stats = await db.get(getStateStatsQuery)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    ` //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    ` //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await database.get(getStateNameQuery)
  response.send(getStateNameQueryResponse)
}) //sending the required response

module.exports = app
