import { createRecommendedArticles } from './createRecommendedArticles';
import createError from '../scraper/createError';
import { ErrorStage, ErrorType } from '../scraper/types';

type ParagraphPart = { type: string; content?: string; href?: string };

export function articleDocument(paragraphs: Record<string, ParagraphPart[]> | ParagraphPart[][]) {
  const document = Object.values(paragraphs || {}).map(parts => ({
    type: 'paragraph',
    children: parts.map(part => part.type === 'link'
      ? { type: 'link', href: part.href || '', children: [{ text: part.content || '' }] }
      : { text: part.content || '' }),
  })).map(paragraph => ({
    ...paragraph,
    children: paragraph.children.length ? paragraph.children : [{ text: '' }],
  }));
  return document.length ? document : [{ type: 'paragraph', children: [{ text: '' }] }];
}

export async function createArticle(
  articleSlug,
  imageData,
  title,
  categoryName,
  translatedDate,
  paragraphs,
  recommendedArticleSlugs,
  requireCreateRecommendedArticles,
  prisma,
  articleUrl = articleSlug,
  statuses?
) {
  try {
    const category = await prisma.category.findFirst({ where: { name: categoryName } });
    if (!category) {
      if (statuses) createError(statuses, ErrorType.InexistentCategory, articleUrl, ErrorStage.Creation);
      return { status: 400, data: undefined };
    }
    const translated = new Date(translatedDate);
    if (Number.isNaN(translated.getTime())) throw new Error('The article publication date is invalid.');
    const insert = async database => {
      const article = await database.article.create({
        data: {
          slug: articleSlug,
          image_data: imageData,
          title,
          categoryId: category.id,
          translated_date: translated,
          content: articleDocument(paragraphs),
        },
      });
      if (requireCreateRecommendedArticles && recommendedArticleSlugs?.length) {
        await createRecommendedArticles(recommendedArticleSlugs, article.id, database);
      }
      return article;
    };
    const article = requireCreateRecommendedArticles && typeof prisma.$transaction === 'function'
      ? await prisma.$transaction(insert)
      : await insert(prisma);
    if (statuses) statuses.completed++;
    return { status: 200, data: article };
  } catch (error) {
    const duplicate = error?.code === 'P2002';
    if (statuses) createError(statuses, duplicate ? ErrorType.DuplicatedArticle : ErrorType.GeneralCantCreate, articleUrl, ErrorStage.Creation);
    console.error('Article creation failed:', duplicate ? 'Duplicate article.' : error?.message);
    return { status: 400, data: undefined };
  }
}
