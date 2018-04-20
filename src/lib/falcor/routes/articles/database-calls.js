/**
 * @typedef PaginationArticle
 * @param {string} slug - The slug of the article
 */

/**
 * Fetches a page of articles where pages are a given length
 * @param {any} database - The knex instance to query on
 * @param {number} pageLength - Length of page to be fetched
 * @param {number} pageIndex - Which page to fetch of size pageLength
 * @returns {Promise<PaginationArticle[]>} - An array of articles on the page
 */
export async function getPaginatedArticle(database, pageLength, pageIndex) {
  const offset = pageLength * pageIndex;
  const articles = await database
    .select('slug')
    .from('articles')
    .orderBy('created_at', 'DESC')
    .limit(pageLength)
    .offset(offset);
  return articles;
}
