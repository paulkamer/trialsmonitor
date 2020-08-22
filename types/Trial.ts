import { ObjectID } from 'mongodb';

import { TrialId } from './TrialId';
import { ClinicalTrialsTrial } from '.';

export type Trial = {
  _id: ObjectID;
  trialId: TrialId;
  lastUpdated: number;
  title?: string;
  acronym?: string;
  phase?: string;
  studyStatus?: string;

  trial?: string;
  diff?: string;
};
