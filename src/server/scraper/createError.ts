import { ErrorStage, type ScrapeStatuses } from './types';

export default function createError(
  statuses: ScrapeStatuses,
  errorName: string,
  articleUrl: string,
  errorStage: ErrorStage
) {
  if (!statuses) return;
  if (errorStage === ErrorStage.Creation) statuses.creationErrors++;
  else statuses.fetchingErrors++;

  const errors = (statuses.errors[articleUrl || 'unknown'] ??= {
    fetching: [],
    creation: [],
  });
  errors[errorStage].push(errorName);
}
