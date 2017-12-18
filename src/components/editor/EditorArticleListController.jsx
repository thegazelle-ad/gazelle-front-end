import React from 'react';
import { Link, browserHistory } from 'react-router';
import FalcorController from 'lib/falcor/FalcorController';
import EditorSearchBar from 'components/editor/EditorSearchBar';
import EditorList from 'components/editor/EditorList';
import moment from 'moment';

// material-ui
import ListItem from 'material-ui/List/ListItem';
import CircularProgress from 'material-ui/CircularProgress';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import { darkBlack } from 'material-ui/styles/colors';
import RaisedButton from 'material-ui/RaisedButton';

const styles = {
  paper: {
    height: '100%',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'left',
    display: 'inline-block',
  },
  tabs: {
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 15,
  },
  buttons: {
    margin: 12,
    marginBottom: 24,
  },
};

const NUM_ARTICLES_IN_PAGE = 50;

export default class EditorArticleListController extends FalcorController {
  constructor(props) {
    super(props);
    this.getNewPagePath = this.getNewPagePath.bind(this);
    this.clickSearchSuggestion = this.clickSearchSuggestion.bind(this);
    this.createListElement = this.createListElement.bind(this);
  }

  static getFalcorPathSets(params) {
    return [
      [
        'articles', 'byPage',
        NUM_ARTICLES_IN_PAGE,
        parseInt(params.page, 10),
        { length: NUM_ARTICLES_IN_PAGE },
        ['title', 'slug', 'teaser', 'published_at'],
      ],
      ['articles', 'length'],
    ];
  }

  getNewPagePath(delta) {
    let path = this.props.location.pathname;
    path = path.split('/');
    path[3] = (parseInt(path[3], 10) + delta).toString();
    return path.join('/');
  }

  clickSearchSuggestion(article) {
    const page = this.props.params.page;
    const path = `/articles/page/${page}/slug/${article.slug}`;
    browserHistory.push(path);
  }

  createListElement(article) {
    const page = this.props.params.page;
    return (
      <Link to={`/articles/page/${page}/slug/${article.slug}`} key={article.slug}>
        <ListItem
          primaryText={article.title}
          secondaryText={
            <p>
              <span style={{ color: darkBlack }}>
                {moment(article.published_at).format('MMM DD, YYYY')}
              </span> {" -- "}
              {article.teaser}
            </p>
          }
          secondaryTextLines={2}
        />
      </Link>
    );
  }

  render() {
    if (this.state.ready) {
      // If trying to access inacessible page, redirect to page 1
      if (!this.state.data.articles.byPage) {
        return (
          <p>
            You have tried accessing a page that doesn't exist. Please press
            <Link to="/articles/page/1">this link</Link> to return to page 1.
            If you believe this was unintended and there is an error with the
            website please contact the web development team of The Gazelle.
          </p>
        );
      }

      const page = this.props.params.page;
      const data = this.state.data.articles.byPage[NUM_ARTICLES_IN_PAGE][page];
      const length = this.state.data.articles.length;
      const maxPage = Math.ceil(length / NUM_ARTICLES_IN_PAGE);

      return (
        <div>
          <h1>Articles</h1>
          <Divider />
          <Paper style={styles.paper} zDepth={2}>
            <div style={styles.tabs}>
              <h2>Select an Article</h2>
              <Divider />
              <br />
              <EditorSearchBar
                model={this.props.model}
                mode="articles"
                handleClick={this.clickSearchSuggestion}
                length={3}
                fields={[]}
                showPubDate
              />
              <EditorList
                elements={data}
                createElement={this.createListElement}
              />
              <RaisedButton
                label="Previous Page"
                primary
                style={styles.buttons}
                disabled={page <= 1}
                containerElement={<Link to={this.getNewPagePath(-1)} />}
              />
              <RaisedButton
                label="Next Page"
                primary
                style={styles.buttons}
                disabled={page >= maxPage}
                containerElement={<Link to={this.getNewPagePath(1)} />}
              />
            </div>
          </Paper>
          {this.props.children}
        </div>
      );
    }
    return (
      <div className="circular-progress">
        <CircularProgress />
        {this.props.children}
      </div>
    );
  }
}
