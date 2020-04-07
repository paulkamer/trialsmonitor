# Invoke Lambda function

`serverless invoke local --function trialUpdater --data "NCT02914535"`
`serverless invoke local --function updatesNotifier --data '["NCT02914535"]'`
`serverless invoke local --function outdatedTrialsChecker`
`serverless invoke local --function searchNewTrials`

---

# DynamoDB

`aws dynamodb list-tables --endpoint-url http://localhost:8000`
`aws dynamodb scan --table-name trials_dev --endpoint-url http://localhost:8000`
`aws dynamodb scan --table-name searches_dev --endpoint-url http://localhost:8000`

```
aws dynamodb scan \
    --table-name trials_dev \
    --attributes-to-get '["id","lastUpdated"]' \
    --endpoint-url http://localhost:8000
```

```
aws dynamodb put-item \
    --table-name trials_dev \
    --item  '{"id":{"S":"NCT02914535"},"lastUpdated":{"N": "12355"}}' \
    --condition-expression "attribute_not_exists(id)" \
    --endpoint-url http://localhost:8000
```

```
aws dynamodb query \
    --table-name trials_dev \
    --key-condition-expression "id = :trialId" \
    --expression-attribute-values  '{":trialId":{"S":"NCT02914535"}}' \
    --endpoint-url http://localhost:8000
```

```
aws dynamodb update-item \
    --table-name trials_dev \
    --key '{"id":{"S":"NCT02914535"}}' \
    --update-expression 'SET trial = :trial, prevTrial = trial' \
    --expression-attribute-values '{ ":trial": {"S":"{\"a\":\"123\"}"}}' \
    --endpoint-url http://localhost:8000
```

```
aws dynamodb delete-item \
    --table-name trials_dev \
    --key '{"id":{"S":"t1"}}' \
    --endpoint-url http://localhost:8000
```

```
aws dynamodb batch-get-item \
    --request-items '{ "trials_dev": { "Keys": [{"id": { "S": "NCT02914535"}}]}
```