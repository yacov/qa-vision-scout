# BrowserStack API Endpoints

## REST API v4
Base URL: `https://api.browserstack.com/5`

### Available Browsers
`GET /browsers`
Returns list of available browsers

### Create Worker
`POST /worker`
Creates a new browser worker

### Get Worker Status
`GET /worker/:id`
Returns status of specific worker

### Terminate Worker
`DELETE /worker/:id`
Terminates an active worker

### Take Screenshot
`GET /worker/:id/screenshot`
Takes screenshot of current worker state