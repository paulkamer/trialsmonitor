import { MongoClient, ObjectId, Db } from 'mongodb';

import config from '../../config';
import IDbHelper from './IDbHelper';
import { TrialId, Trial } from '../../../types';

/**
 * Database helper
 */
class MongoDbHelper implements IDbHelper {
  client!: MongoClient;
  db!: Db;

  async connect() {
    this.client = new MongoClient(config.mongdodbEndpointUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      keepAlive: false,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 3000,
    });

    await this.client.connect();

    this.db = this.client.db(config.mongodbDbName);
  }

  async disconnect() {
    await this.client?.close();

    delete this.client;
  }

  /**
   * Insert a new trialId into the trials table.
   */
  async insertTrialId(trialId: string): Promise<boolean> {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    const result = await collection.insertOne({
      trialId,
      lastUpdated: 0,
    });

    return result.insertedCount === 1;
  }

  async insertTrialIds(trialIds: Array<TrialId>): Promise<boolean[]> {
    return await Promise.all(trialIds.map((trialId) => this.insertTrialId(trialId)));
  }

  /**
   * Returns all trialId's stored in the "trials" table
   */
  async listTrials(
    attrs = ['trialId', 'lastUpdated'],
    { orderBy, sortDirection, limit, pageNumber } = {
      orderBy: '_id',
      sortDirection: 'asc',
      limit: 250,
      pageNumber: 1,
    }
  ) {
    const collection = this.db.collection(config.mongodbTrialsCollection);
    const projection: object = attrs.reduce<any>(
      (acc, cur) => {
        acc[cur] = 1;
        return acc;
      },
      { _id: 1 }
    );

    limit = limit || 250;
    const skip = (pageNumber - 1) * limit;

    return await collection
      .find({}, { projection })
      .sort({ [orderBy]: sortDirection === 'desc' ? -1 : 1 })
      .limit(Math.max(limit, 0))
      .skip(skip)
      .toArray();
  }

  async countTrials() {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    return await collection.countDocuments();
  }

  /**
   * Fetch a single trial record
   * @param {String} trialId
   */
  async fetchTrial(trialId: TrialId) {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    return await collection.findOne({ trialId });
  }

  /**
   * Fetch trial records by id
   */
  async fetchTrialsByTrialId(
    trialIds: Array<TrialId>,
    attributesToReturn: Array<string>
  ): Promise<Array<Trial>> {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    const projection = attributesToReturn.reduce<any>(
      (acc, cur) => {
        acc[cur] = 1;
        return acc;
      },
      { _id: 1 }
    );

    return await collection
      .find(
        {
          trialId: {
            $in: trialIds,
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
  async updateTrial(trialId: TrialId, ...args: Array<any>) {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    const updateResult = await collection.updateOne(
      { trialId },
      {
        $set: args[0],
      }
    );

    return updateResult.modifiedCount === 1;
  }

  /**
   * Delete trial records by id
   */
  async deleteTrials(ids: Array<TrialId>): Promise<number> {
    const collection = this.db.collection(config.mongodbTrialsCollection);

    const idList = ids.map((id) => new ObjectId(id));

    const result = await collection.deleteMany({
      _id: {
        $in: idList,
      },
    });

    return result.deletedCount || 0;
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
  async insertSearchQuery(searchQuery: string) {
    const collection = this.db.collection(config.mongodbTrialSearchesCollection);

    const params = {
      query: searchQuery,
    };

    return (await collection.insertOne(params)).result.ok === 1;
  }

  /**
   * Delete trial search records by id
   * @param {Array} List of trial search Ids
   */
  async deleteSearchQueries(trialSearchIds: Array<string>) {
    const collection = this.db.collection(config.mongodbTrialSearchesCollection);

    const idList = trialSearchIds.map((id) => new ObjectId(id));

    return (
      (
        await collection.deleteMany({
          _id: {
            $in: idList,
          },
        })
      ).result.ok === 1
    );
  }

  /**
   * Delete a trial search record by id
   * @param {String} trial search Ids
   */
  async deleteSearchQuery(trialSearchId: string) {
    return await this.deleteSearchQueries([trialSearchId]);
  }
}

export default MongoDbHelper;
