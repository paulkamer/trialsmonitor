// eslint-disable-next-line import/no-extraneous-dependencies
const AWS = require('aws-sdk');

const TABLE_TRIALS = process.env.TRIALS_TABLE;
const TABLE_SEARCHES = process.env.SEARCHES_TABLE;

/**
 * Database helper
 */
class DbHelper {
  /**
   * Initialize the DB connection
   */
  constructor() {
    const dynamoDbConfig = {
      region: process.env.DYNAMODB_REGION,
      apiVersion: process.env.DYNAMODB_API_VERSION,
    };

    // On localhost the 'endpoint' is a required config setting
    if (process.env.STAGE === 'dev') dynamoDbConfig.endpoint = process.env.DYNAMODB_DEV_ENDPOINT;

    this.db = new AWS.DynamoDB(dynamoDbConfig);
  }

  /**
   * Insert a new trialId into the trials table.
   */
  insertTrialId(trialId) {
    const params = {
      TableName: TABLE_TRIALS,
      Item: {
        id: { S: trialId },
        lastUpdated: { N: '0' }, // Ensures lastUpdated attribute is present
      },
      ConditionExpression: 'attribute_not_exists(id)',
    };

    return new Promise(resolve => {
      this.db
        .putItem(params)
        .promise()
        .then(() => {
          resolve(true);
        })
        .catch(() => {
          resolve(false);
        });
    });
  }

  /**
   * Returns all trialId's stored in the "trials" table
   */
  async listTrials(attributesToGet = ['id', 'lastUpdated']) {
    const queryParams = {
      TableName: TABLE_TRIALS,
      Select: 'SPECIFIC_ATTRIBUTES',
      AttributesToGet: attributesToGet,
      Limit: 100,
    };

    const trialsById = {};
    let items;
    try {
      // Loop until all items have been returned. DynamoDB has a limit of 1MB, so
      // will not return all 100 rows in a single pass
      do {
        items = await this.db.scan(queryParams).promise();
        items.Items.forEach(trial => {
          const result = {};

          // Extract values from DB results. Values are stored under the field type
          // key, i.e. { "id": { "S": "<trial_id>" }}
          Object.entries(trial).forEach((e) => {
            result[e[0]] = Object.values(trial[e[0]])[0];
          });

          // Ensure the lastUpdated value is a Number
          if (trial.lastUpdated) result.lastUpdated = Number(trial.lastUpdated.N) || 0;

          trialsById[trial.id.S] = { ...result };
        });

        queryParams.ExclusiveStartKey = items.LastEvaluatedKey;
      } while (typeof items.LastEvaluatedKey !== 'undefined');
    } catch (e) {
      console.error(e);

      return {};
    }

    return trialsById;
  }

  /**
   * Fetch a single trial record
   * @param {String} trialId
   */
  async fetchTrial(trialId) {
    try {
      const params = {
        TableName: TABLE_TRIALS,
        Key: {
          id: { S: trialId },
        },
      };

      const result = await this.db.getItem(params).promise();

      return result.Item;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /**
   * Fetch trial records by id
   * @param {Array} List of trialIds
   * @param {Array} List of attribute names to return
   */
  async fetchTrials(trialIds, attributesToReturn) {
    let result;
    try {
      const params = {
        RequestItems: {
          [TABLE_TRIALS]: {
            Keys: trialIds.map(trialId => ({ id: { S: trialId } })),
            ProjectionExpression: attributesToReturn.join(','),
          },
        },
      };

      result = await this.db.batchGetItem(params).promise();
    } catch (e) {
      console.error(e);
      return false;
    }

    try {
      return result.Responses[TABLE_TRIALS];
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  /**
   * Update a Trial document in the "trials" DynamoDb table.
   * Copies the existing 'trial' attribute over to 'prevTrial' for the purpose of
   * defining a DIFF later on.
   *
   * @param {String} trialId
   * @param {Object}
   */
  async updateTrial(trialId, { trial, title, acronym, phase, studyStatus, lastUpdated, diff }) {
    const params = {
      TableName: TABLE_TRIALS,
      Key: {
        id: { S: trialId },
      },
      UpdateExpression:
        'SET title = :title, acronym = :acronym, phase = :phase, studyStatus = :studyStatus, trial = :trial, prevTrial = if_not_exists(trial, :prevTrialFallback), diff = :diff, lastUpdated = :lastUpdated',
      ExpressionAttributeValues: {
        ':title': { S: title },
        ':acronym': { S: acronym },
        ':phase': { S: phase },
        ':studyStatus': { S: studyStatus },
        ':trial': { S: JSON.stringify(trial) },
        ':lastUpdated': { N: String(lastUpdated) },
        ':diff': { S: diff },
        ':prevTrialFallback': { S: '{}' },
      },
    };

    try {
      await this.db.updateItem(params).promise();
    } catch (e) {
      console.error(e);
      return false;
    }

    return true;
  }

  /**
   * Delete trial records by id
   * @param {Array} List of trialIds
   */
  async deleteTrials(trialIds) {
    let result;
    try {
      const params = {
        RequestItems: {
          [TABLE_TRIALS]:
            trialIds.map(trialId => ({
              DeleteRequest: {
                Key: { id: { S: trialId } } ,
              }
            }))
        },
      };

      result = await this.db.batchWriteItem(params).promise();
    } catch (e) {
      console.error(e);
      return false;
    }

    try {
      return result;
    } catch (e) {
      console.error(e);
      return false;
    }
  }


  /**
   * Returns all trialId's stored in the "trials" table
   */
  async listSearchQueries(attributesToGet = ['id', 'query']) {
    const queryParams = {
      TableName: TABLE_SEARCHES,
      Select: 'SPECIFIC_ATTRIBUTES',
      AttributesToGet: attributesToGet,
      Limit: 100,
    };

    const searchQueries = [];
    let items;
    try {
      // Loop until all items have been returned.
      do {
        items = await this.db.scan(queryParams).promise();
        items.Items.forEach(searchQuery => {
          const result = {};

          Object.entries(searchQuery).forEach((e) => {
            if (!attributesToGet.includes(e[0])) return;

            result[e[0]] = Object.values(searchQuery[e[0]])[0];
          });

          searchQueries.push({
            ...result,
          });
        });

        queryParams.ExclusiveStartKey = items.LastEvaluatedKey;
      } while (typeof items.LastEvaluatedKey !== 'undefined');
    } catch (e) {
      console.error(e);

      return [];
    }

    return searchQueries;
  }
}

module.exports = DbHelper;
