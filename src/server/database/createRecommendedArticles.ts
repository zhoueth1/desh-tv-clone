export async function createRecommendedArticles(recommendedArticleSlugs, articleId, prisma) {
  if (!recommendedArticleSlugs?.length) return false;
  const slugs = [...new Set(recommendedArticleSlugs.flatMap(slug => [slug, encodeURI(slug)]))];
  const recommended = await prisma.article.findMany({
    where: { slug: { in: slugs }, id: { not: Number(articleId) } },
    select: { id: true },
  });
  if (!recommended.length) return false;
  await prisma.article.update({
    where: { id: Number(articleId) },
    data: { recommendedArticles: { connect: recommended } },
  });
  return true;
}
