# Invoke Lambda function

`serverless invoke local --function trialUpdater --data "NCT02914535"`
`serverless invoke local --function updatesNotifier --data '["NCT02914535"]'`
`serverless invoke local --function outdatedTrialsChecker`
`serverless invoke local --function newTrialsChecker`

## API methods

`serverless invoke local --function createTrial --data '{"pathParameters": {"id": "5f2642b2e5b87d2c9d632cad" }}'`
`serverless invoke local --function fetchTrial --data '{"pathParameters": {"id": "5f2642b2e5b87d2c9d632cad" }}'`

`serverless invoke local --function listTrialSearches`
`serverless invoke local --function createTrialSearch --data '{"body": {"query": "testje" }}'`
`serverless invoke local --function deleteTrialSearch --data '{"pathParameters": {"id": "5f263b9225577d7925724648" }}'`
