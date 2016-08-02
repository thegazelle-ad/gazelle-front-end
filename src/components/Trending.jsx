import React from 'react';
import ArticleList from 'components/ArticleList';
import BaseComponent from 'lib/BaseComponent';

export default class Trending extends BaseComponent {
  render() {
    return (
      <div className="trending">
        <h2 className="section-header"><span>trending</span></h2>
        <ArticleList articles={this.props.articles} />
      </div>
    );
  }
}

Trending.propTypes = {
  articles: React.PropTypes.object,
}
