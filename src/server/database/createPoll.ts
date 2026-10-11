import createError from '../scraper/createError';
import { ErrorStage, ErrorType } from '../scraper/types';

export async function createPoll(slug, imageData, title, translatedDate, voteCount, prisma, statuses?) {
  try {
    const translated = new Date(translatedDate);
    if (Number.isNaN(translated.getTime())) throw new Error('The poll publication date is invalid.');
    const votes = {
      desh_yes_count: Math.max(0, Math.round(Number(voteCount?.yes) || 0)),
      desh_no_count: Math.max(0, Math.round(Number(voteCount?.no) || 0)),
      desh_no_comment_count: Math.max(0, Math.round(Number(voteCount?.['no-comment']) || 0)),
    };
    const poll = await prisma.poll.upsert({
      where: { slug },
      update: votes,
      create: { slug, image_data: imageData, title, translated_date: translated, ...votes },
    });
    if (statuses) statuses.completed++;
    return { status: 200, data: poll };
  } catch (error) {
    if (statuses) createError(statuses, error?.code === 'P2002' ? ErrorType.DuplicatedArticle : ErrorType.GeneralCantCreate, slug, ErrorStage.Creation);
    console.error('Poll creation failed:', error?.message);
    return { status: 400, data: undefined };
  }
}
