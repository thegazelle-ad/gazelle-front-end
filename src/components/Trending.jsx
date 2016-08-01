import React from 'react';
import ArticleList from 'components/ArticleList';

export default function Trending(props) {
  return (
    <div className="trending">
      <h2 className="section-header"><span>trending</span></h2>
      <ArticleList articles={props.articles} />
    </div>
  );
}

Trending.propTypes = {
  articles: React.PropTypes.object,
}
