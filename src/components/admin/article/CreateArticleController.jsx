import React from 'react';
import { browserHistory } from 'react-router';
import PropTypes from 'prop-types';
import _ from 'lodash';

// Helpers
import { parseFalcorPseudoArray } from 'lib/falcor/falcor-utilities';
import { compose } from 'lib/higher-order-helpers';
import { getArticleListPath, getArticlePath } from 'routes/admin-helpers';
import { buildErrorMessage } from 'lib/error-helpers';

// Custom Components
import {
  HttpsUrlField,
  ShortRequiredTextField,
} from 'components/admin/form-components/validated-fields';
import ListSelector from 'components/admin/form-components/ListSelector';
import MaxLenTextField from 'components/admin/form-components/MaxLenTextField';
import { MAX_TEASER_LENGTH } from 'components/admin/lib/constants';
import {
  SearchableAuthorsSelector,
  SearchableTagsSelector,
} from 'components/admin/form-components/searchables';
import { FullPageLoadingOverlay } from 'components/admin/FullPageLoadingOverlay';
import LoadingOverlay from 'components/admin/LoadingOverlay';

// Material UI
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';

// HOCs
import {
  withFalcorData,
  withFalcor,
  buildPropMerger,
} from 'components/hocs/falcor-hocs';
import { withModals } from 'components/admin/hocs/modals/withModals';

// Misc.
import { logger } from 'lib/logger';

// Define data needed by component
const falcorPaths = [['categories', 'byIndex', { length: 30 }, ['name', 'id']]];

const propMerger = buildPropMerger((data, currentProps) => {
  const categories = parseFalcorPseudoArray(data.categories.byIndex).filter(
    category => _.get(category, 'id') && _.get(category, 'name'),
  );
  return {
    ...currentProps,
    categories,
  };
});

class CreateArticleController extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      slug: '',
      authors: [],
      tags: [],
      teaser: '',
      category: null,
      imageUrl: '',
      saving: false,
    };
  }

  updateTitle = title => this.setState({ title });
  updateSlug = slug => this.setState({ slug });
  updateAuthors = authors => this.setState({ authors });
  updateTags = tags => this.setState({ tags });
  updateTeaser = teaser => this.setState({ teaser });
  updateImage = imageUrl => this.setState({ imageUrl });
  updateCategory = category => this.setState({ category });

  handleDialogClose = () => {
    browserHistory.push(getArticleListPath(this.props.params.page));
  };

  validateArticle = async () => {
    // Check that it has all the required fields
    const requiredFields = ['title', 'slug'];
    const errorMessage = requiredFields
      .map(key => {
        if (!this.state[key]) {
          return `${key} is a required field`;
        }
        return null;
      })
      .filter(x => x !== null)
      .join('\n');
    if (errorMessage) {
      await this.props.displayAlert(errorMessage);
      return false;
    }
    return true;
  };

  handleCreateArticle = async () => {
    if (!await this.validateArticle()) {
      return;
    }

    const createArticleArgument = _.pick(this.state, [
      'title',
      'slug',
      'authors',
      'tags',
      'teaser',
      'category',
      'imageUrl',
    ]);

    let newArticle;
    this.setState({ saving: true });
    try {
      const jsonGraph = await this.props.falcor.call(
        ['articles', 'createNew'],
        [createArticleArgument],
      );
      const createdArticles = parseFalcorPseudoArray(
        jsonGraph.json.articles.byId,
      );
      if (createdArticles.length !== 1) {
        logger.error(new Error('Expected exactly one article to be created'));
        await this.props.displayAlert(buildErrorMessage());
        return;
      }
      [newArticle] = createdArticles;
    } catch (e) {
      logger.error(e);
      await this.props.displayAlert(buildErrorMessage());
      return;
    } finally {
      // Finally runs even if we return from the function in try and catch
      this.setState({ saving: false });
    }
    const pathname = getArticlePath(newArticle.id, this.props.params.page);
    browserHistory.push({ pathname, state: { refresh: true } });
  };

  render() {
    const actionButtons = [
      <RaisedButton
        primary
        onClick={this.handleCreateArticle}
        label="Create Article"
      />,
    ];
    return (
      <Dialog
        open
        title="Create New Article"
        modal={false}
        autoScrollBodyContent
        actions={actionButtons}
        onRequestClose={this.handleDialogClose}
      >
        {this.state.saving && <LoadingOverlay />}
        <ShortRequiredTextField
          floatingLabelText="Title"
          value={this.state.title}
          onUpdate={this.updateTitle}
          disabled={this.state.saving}
        />
        <br />
        <ShortRequiredTextField
          floatingLabelText="Slug"
          value={this.state.slug}
          onUpdate={this.updateSlug}
          disabled={this.state.saving}
        />
        <br />
        <ListSelector
          label="Category"
          chosenElement={this.state.category}
          update={this.updateCategory}
          elements={this.props.categories}
          disabled={this.state.saving}
        />
        <br />
        <HttpsUrlField
          floatingLabelText="Image"
          value={this.state.imageUrl}
          onUpdate={this.updateImage}
          fullWidth
          disabled={this.state.saving}
        />
        <br />
        <MaxLenTextField
          name="teaser"
          value={this.state.teaser}
          maxLen={MAX_TEASER_LENGTH}
          onUpdate={this.updateTeaser}
          disabled={this.state.saving}
        />
        <br />
        <SearchableAuthorsSelector
          elements={this.state.authors}
          onUpdate={this.updateAuthors}
          disabled={this.state.saving}
          mode="staff"
        />
        <br />
        <SearchableTagsSelector
          elements={this.state.tags}
          onUpdate={this.updateTags}
          mode="tags"
          disabled={this.state.saving}
        />
      </Dialog>
    );
  }
}

CreateArticleController.propTypes = {
  params: PropTypes.shape({
    page: PropTypes.string.isRequired,
  }).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  falcor: PropTypes.shape({
    call: PropTypes.func.isRequired,
  }).isRequired,
  displayAlert: PropTypes.func.isRequired,
};

const EnhancedCreateArticleController = compose(
  withFalcorData(falcorPaths, propMerger, FullPageLoadingOverlay),
  withFalcor,
  withModals,
)(CreateArticleController);

export { EnhancedCreateArticleController as CreateArticleController };
