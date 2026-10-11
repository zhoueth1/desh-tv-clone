export async function getRecommendedArticles(articleId, prisma) {
  const article = await prisma.article.findUnique({
    where: { id: Number(articleId) },
    select: { recommendedArticles: { select: { slug: true, image_data: true, title: true } } },
  });
  const recommended = article?.recommendedArticles || [];
  return {
    recommendedArticleLinks: recommended.map(item => 'https://desh.tv' + item.slug.replace(/^\/article/, '')),
    recommendedArticleImageData: recommended.map(item => item.image_data),
    recommendedArticleTitles: recommended.map(item => item.title),
  };
}
