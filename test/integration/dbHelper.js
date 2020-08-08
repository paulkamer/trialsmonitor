const { Seeder } = require('mongo-seeding');

const config = require('../../src/config');

const seedDb = async () => {
  switch (config.dbType) {
    case 'mongodb':
      await seedMongoDb();
      break;
    default:
      throw new Error(`Unsupported dbType: ${config.dbType}`);
  }
};

async function seedMongoDb() {
  const seederConfig = {
    database: config.mongdodbEndpointUri,
    dropCollections: true,
  };

  const seeder = new Seeder(seederConfig);

  const path = require('path');
  const collections = seeder.readCollectionsFromPath(path.resolve('db/seeds/dev/mongodb/'));

  try {
    await seeder.import(collections).catch(err => console.error(err));
  } catch (err) {
    console.error(err);
    // Handle errors
  }
}

module.exports = { seedDb };
