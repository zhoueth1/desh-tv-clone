export enum ErrorStage {
  Fetching = 'fetching',
  Creation = 'creation',
}

export enum ErrorType {
  ProblematicParagraphs = 'problematicParagraphs',
  MissingData = 'missingData',
  GeneralCantFetch = 'generalCantFetch',
  FetchPromiseRejected = 'fetchPromiseRejected',
  CreatePromiseRejected = 'createPromiseRejected',
  InexistentCategory = 'inexistentCategory',
  DuplicatedArticle = 'duplicatedArticle',
  GeneralCantCreate = 'generalCantCreate',
}

export type ScrapeStatuses = {
  completed: number;
  attempts: number;
  fetchingErrors: number;
  creationErrors: number;
  errors: Record<string, { fetching: string[]; creation: string[] }>;
};

export const createStatuses = (): ScrapeStatuses => ({
  completed: 0,
  attempts: 0,
  fetchingErrors: 0,
  creationErrors: 0,
  errors: {},
});
