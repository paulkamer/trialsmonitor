import { Trial, TrialId, TrialSearch } from '../../../types';

interface IDbHelper {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  insertTrialId(trialId: TrialId): Promise<boolean>;
  listTrials(attrs?: TrialId[], options?: object): Promise<Trial[]>;

  countTrials(): Promise<number>;
  fetchTrial(trialId: TrialId): Promise<Trial>;
  fetchTrialsByTrialId(trialIds: TrialId[], attributesToReturn: string[]): Promise<Trial[]>;

  updateTrial(trialId: TrialId, attributes: object): Promise<boolean>;
  deleteTrials(trialIds: TrialId[]): Promise<number>;

  listSearchQueries(): Promise<TrialSearch[]>;
  insertSearchQuery(searchQuery: string): Promise<boolean>;
  deleteSearchQueries(trialSearchIds: string[]): Promise<boolean>;
  deleteSearchQuery(trialSearchId: string): Promise<boolean>;
}

export default IDbHelper;
