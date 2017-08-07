import React from 'react';
import Helmet from 'react-helmet'; // Add <head> data
import { viewArticle, isArticleViewed } from 'lib/utilities';

// Components
import Article from 'components/Article';
import FalcorController from 'lib/falcor/FalcorController';
import NotFound from 'components/NotFound';

export default class ArticleController extends FalcorController {
  static getFalcorPathSets(params) {
    // URL Format: thegazelle.org/issue/:issueNumber/:articleCategory/:articleSlug

    // Multilevel request requires Falcor Path for each level of data requested
    return [
      // Fetch article data
      ['articlesBySlug', params.articleSlug,
       ['title', 'teaser', 'html', 'publishedAt', 'issueNumber', 'category', 'slug', 'image']],
      ['articlesBySlug', params.articleSlug, 'authors', { length: 10 }, ['name', 'slug']],

      // Fetch two related articles
      // TODO: convert fetching by category to fetching by tag
      ['articlesBySlug', params.articleSlug,
       'related', { length: 2 }, ['title', 'teaser', 'image', 'issueNumber', 'category', 'slug']],
      ['articlesBySlug', params.articleSlug,
       'related', { length: 2 }, 'authors', { length: 10 }, ['name', 'slug']],

      // Fetch first five Trending articles
      ['trending', { length: 6 }, ['title', 'issueNumber', 'category', 'slug', 'image']],
      ['trending', { length: 6 }, 'authors', { length: 10 }, ['name', 'slug']],

    ];
  }

  componentDidMount() {
    super.componentDidMount();
    const slug = this.props.params.articleSlug;
    // We don't want beta views to count towards the total view count
    // and we only want to count each view once per session (might use cookies
    // later to make this consistent for a user in general?)
    if (process.env.NODEENV !== 'beta' && !isArticleViewed(slug)) {
      viewArticle(slug);
      this.props.model.call(['articlesBySlug', slug, 'addView'], [], [], []).then(() => {});
    }
  }

  componentWillReceiveProps(nextProps, nextContext) {
    super.componentWillReceiveProps(nextProps, nextContext);
    const slug = this.props.params.articleSlug;
    if (process.env.NODEENV !== 'beta' && !isArticleViewed(slug)) {
      viewArticle(slug);
      this.props.model.call(['articlesBySlug', slug, 'addView'], [], [], []).then(() => {});
    }
  }

  render() {
    if (this.state.ready) {
      if (
        !this.state.data || !this.state.data.articlesBySlug ||
         !this.state.data.articlesBySlug[this.props.params.articleSlug] ||
        !this.state.data.articlesBySlug[this.props.params.articleSlug].title
         || !this.state.data.articlesBySlug[this.props.params.articleSlug].issueNumber) {
        return (
          <NotFound />
        );
      } {
        const articleSlug = this.props.params.articleSlug;
        // Access data fetched via Falcor
        const articleData = this.state.data.articlesBySlug[articleSlug];
        const trendingData = this.state.data.trending;
        const relatedArticlesData = articleData.related;
        // make sure article meta image has default
        const articleMetaImage = articleData.image || 'https://thegazelle.s3.amazonaws.com/gazelle/2016/02/saadiyat-reflection.jpg';
        const meta = [
          // Search results
          { name: 'description', content: this.props.teaser },

          // Social media sharing
          { property: 'og:title', content: `${articleData.title} | The Gazelle` },
          { property: 'og:type', content: 'article' },
          { property: 'og:url',
          content: `www.thegazelle.org/issue/ ${articleData.issueNumber.toString()}/
           ${articleData.category}/ ${articleData.slug}` },
          { property: 'og:image', content: articleMetaImage },
          { property: 'og:image:width', content: '540' }, // 1.8:1 ratio
          { property: 'og:image:height', content: '300' },
          { property: 'og:description', content: articleData.teaser },
          { property: 'og:siteName', content: 'The Gazelle' },
        ];
        return (
          <div>
            <Helmet
              meta={meta}
              title={`${articleData.title} | The Gazelle`}
            />
            <Article
              title={articleData.title}
              teaser={articleData.teaser}
              publishedAt={articleData.publishedAt}
              html={articleData.html}
              authors={articleData.authors}
              featuredImage={articleData.image}
              url={`thegazelle.org/issue/ ${articleData.issueNumber.toString()}
              / ${articleData.category}/ ${articleData.slug}`}
              trending={trendingData}
              relatedArticles={relatedArticlesData}
            />
          </div>
        );
      }
    } else {
      return (
        <div>
          Loading
        </div>
      );
    }
  }
}
