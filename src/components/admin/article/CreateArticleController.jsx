import React from 'react';
import { browserHistory } from 'react-router';
import PropTypes from 'prop-types';
import _ from 'lodash';

// Helpers
import { slugifyStaff } from 'lib/utilities';
import { parseFalcorPseudoArray } from 'lib/falcor/falcor-utilities';

// Custom Components
import ImageUrlField from 'components/admin/article/components/ImageUrlField';
import TitleField from 'components/admin/article/components/TitleField';
import ListSelector from 'components/admin/form-components/ListSelector';
import MaxLenTextField from 'components/admin/form-components/MaxLenTextField';
import { MAX_TEASER_LENGTH } from 'components/admin/lib/constants';
import { SearchableAuthorsSelector } from 'components/admin/form-components/searchables';

// Material UI
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';

// HOCs
import { withFalcorData, buildPropMerger } from 'components/hocs/falcor-hocs';

const falcorPaths = [
  ['categories', 'byIndex', { length: 30 }, ['name', 'slug']],
];

const propMerger = buildPropMerger((data, currentProps) => {
  const categories = parseFalcorPseudoArray(data.categories.byIndex).filter(
    category => _.get(category, 'slug') && _.get(category, 'name'),
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
      teaser: '',
      category: '',
      imageUrl: '',
    };
  }

  updateTitle = title => this.setState({ title });
  updateSlug = slug => this.setState({ slug });
  updateAuthors = authors => this.setState({ authors });
  updateTeaser = teaser => this.setState({ teaser });
  updateImage = imageUrl => this.setState({ imageUrl });
  updateCategory = category => this.setState({ category });

  handleDialogClose = () => {
    const { page } = this.props.params;
    const pathname = `/articles/page/${page}`;

    const location = { pathname, state: { refresh: false } }; // TODO: Add proper refresh
    browserHistory.push(location);
  };

  handleCreateArticle = () => {};

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
        <TitleField title={this.state.title} onUpdate={this.updateTitle} />
        {/* This is temporary until Will merges in his text fields with DB lengths */}
        {/* We also want to make this required */}
        <MaxLenTextField
          name="slug"
          value={this.state.slug}
          maxLen={100}
          onUpdate={this.updateSlug}
        />
        <ListSelector
          label="Category"
          chosenElement={this.state.category}
          update={this.updateCategory}
          elements={this.props.categories}
        />
        <ImageUrlField
          imageUrl={this.state.imageUrl}
          updateImage={this.updateImage}
        />
        <MaxLenTextField
          name="teaser"
          value={this.state.teaser}
          maxLen={MAX_TEASER_LENGTH}
          onUpdate={this.updateTeaser}
        />
        <SearchableAuthorsSelector
          elements={this.state.authors}
          onChange={this.debouncedHandleFormStateChanges}
          onUpdate={this.updateAuthors}
          disabled={this.state.saving}
          mode="staff"
          slugify={slugifyStaff}
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
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

const EnhancedCreateArticleController = withFalcorData(falcorPaths, propMerger)(
  CreateArticleController,
);

export { EnhancedCreateArticleController as CreateArticleController };
