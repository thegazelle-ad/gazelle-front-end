const moment = require('moment');
const { loremIpsum } = require('./constants');

module.exports.addDummyArticles = async (knex, numArticles, numCategories) => {
  const rows = [];
  const START_DATE = moment('2000-01-01');
  for (let i = 1; i <= numArticles; i++) {
    const categoryId = (i - 0) % numCategories + 1;
    rows.push({
      id: i,
      slug: `slug-${i}`,
      title: `title-${i}`,
      markdown: loremIpsum,
      // TODO: When we have a markdown editor implemented run this through the
      // markdown parser function
      html: `<p>${loremIpsum}</p>`,
      image_url: 'https://placeimg.com/640/480/any',
      teaser: loremIpsum.substr(0, 156), // The max length of teaser
      views: i,
      created_at: START_DATE.add(i, 'days').toDate(),
      published_at: START_DATE.add(i + 1, 'days').toDate(),
      is_interactive: false,
      // We set the category later
      category_id: categoryId,
    });
  }
  await knex('articles').insert(rows);
};
