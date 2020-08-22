import { ObjectID } from 'mongodb';

export type TrialSearch = {
  _id: ObjectID;
  query: string;
};
