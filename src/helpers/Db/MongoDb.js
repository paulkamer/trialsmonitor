const { MongoClient, ObjectId } = require('mongodb');

const config = require('../../config');

/**
 * Database helper
 */
class MongoDbHelper {
  /**
   * Initialize the DB connection
   */
  constructor() {
    const uri = config.mongdodbEndpointUri;
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  async connect() {
    await this.client.connect();

    this.db = this.client.db(config.mongodbDbName);
  }

  async disconnect() {
    await this.client.close();
  }

  /**
   * Insert a new trialId into the trials table.
   */
  async insertTrialId(trialId) {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    const params = {
      trialId,
      lastUpdated: 0,
    };

    const result = await collection.insertOne(params);

    return result.insertedCount === 1;
  }

  /**
   * Returns all trialId's stored in the "trials" table
   */
  async listTrials(attrs = ['trialId', 'lastUpdated'], { orderBy, sortDirection, limit } = {}) {
    const collection = this.db.collection(config.mongodbTrialsCollection);
    const projection = attrs.reduce(
      (acc, cur) => {
        acc[cur] = 1;
        return acc;
      },
      { _id: 1 }
    );

    return await collection
      .find({}, { projection })
      .sort({ [orderBy]: sortDirection === 'desc' ? -1 : 1 })
      .limit(limit || 50)
      .toArray();
  }

  /**
   * @deprecated
   */
  normalizeTrial(trial) {
    return trial;
  }

  /**
   * Fetch a single trial record
   * @param {String} trialId
   */
  async fetchTrial(trialId) {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    return await collection.findOne({ _id: new ObjectId(trialId) });
  }

  /**
   * Fetch trial records by id
   * @param {Array} List of trialIds
   * @param {Array} List of attribute names to return
   */
  async fetchTrials(trialIds, attributesToReturn) {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    const idList = trialIds.map(id => new ObjectId(id));

    const projection = attributesToReturn.reduce(
      (acc, cur) => {
        acc[cur] = 1;
        return acc;
      },
      { _id: 1 }
    );

    return await collection
      .find(
        {
          _id: {
            $in: idList,
          },
        },
        {
          projection,
        }
      )
      .toArray();
  }

  /**
   * Update a Trial document
   *
   * @param {String} trialId
   * @param {Object}
   */
  async updateTrial(trialId, ...args) {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    const updateResult = await collection.updateOne(
      { _id: new ObjectId(trialId) },
      {
        $set: args[0],
      }
    );

    return updateResult.modifiedCount === 1;
  }

  /**
   * Delete trial records by id
   * @param {Array} List of trialIds
   */
  async deleteTrials(trialIds) {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    const idList = trialIds.map(id => new ObjectId(id));

    const result = await collection.deleteMany({
      _id: {
        $in: idList,
      },
    });

    return result.deletedCount;
  }

  /**
   * Returns all trialId's stored in the "trials" table
   */
  async listSearchQueries() {
    const collection = this.db.collection(config.mongodbTrialSearchesCollection);

    return await collection.find().toArray();
  }

  /**
   * Insert a new search query into the trialsearches table.
   */
  async insertSearchQuery(searchQuery) {
    const collection = this.db.collection(config.mongodbTrialSearchesCollection);

    const params = {
      query: searchQuery,
    };

    return await collection.insertOne(params);
  }

  /**
   * Delete trial search records by id
   * @param {Array} List of trial search Ids
   */
  async deleteSearchQueries(trialSearchIds) {
    const collection = this.db.collection(config.mongodbTrialSearchesCollection);

    const idList = trialSearchIds.map(id => new ObjectId(id));

    return await collection.deleteMany({
      _id: {
        $in: idList,
      },
    });
  }

  /**
   * Delete a trial search record by id
   * @param {String} trial search Ids
   */
  async deleteSearchQuery(trialSearchId) {
    return await this.deleteSearchQueries([trialSearchId]);
  }
}

module.exports = MongoDbHelper;
