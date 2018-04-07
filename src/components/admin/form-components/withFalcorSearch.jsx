import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { cleanupFalcorKeys } from 'lib/falcor/falcor-utilities';
import { withFalcor } from 'components/hocs/falcor-hocs';
import { debounce } from 'lib/utilities';
import { getDisplayName } from 'lib/higher-order-helpers';

export const withFalcorSearch = (fields, formatter, mode) => WrappedField => {
  const debounceTime = 250;
  class Searchable extends React.Component {
    constructor(props) {
      super(props);
      this.getSuggestions = this.getSuggestions.bind(this);

      this.debounceSuggestions = debounce(query => {
        if (!query.trim()) {
          return Promise.resolve({});
        }

        let pathSets = this.props.extraPathSets || [];
        pathSets = pathSets.reduce(
          (arr, pathSet) => {
            arr.push(
              ['search', mode, query, { length: this.props.length }].concat(
                pathSet,
              ),
            );
            return arr;
          },
          [
            [
              'search',
              mode,
              query,
              { length: this.props.length },
              _.uniq([...fields, ...this.props.fields, 'id', 'slug']),
            ],
          ],
        );

        return new Promise(resolve => {
          this.props.falcor.get(...pathSets).then(x => {
            if (!x) {
              return resolve({ suggestions: [] });
            }
            x = cleanupFalcorKeys(x); // eslint-disable-line no-param-reassign
            const suggestions = _.toArray(x.json.search[mode][query])
              .filter(item => item !== undefined)
              .map(item => ({
                title: formatter(item),
                id: item.id,
                slug: item.slug,
              }));
            return resolve({ suggestions });
          });
        });
      }, debounceTime);
    }

    getSuggestions(query) {
      return Promise.resolve(this.debounceSuggestions(query));
    }

    render() {
      const passedProps = _.omit(this.props, 'handleClick');
      return (
        <WrappedField
          getSuggestions={this.getSuggestions}
          mode={mode}
          handleClick={this.props.handleClick}
          {...passedProps}
        />
      );
    }
  }

  Searchable.propTypes = {
    falcor: PropTypes.shape({
      get: PropTypes.func.isRequired,
    }).isRequired,
    handleClick: PropTypes.func.isRequired,
    length: PropTypes.number,
    fields: PropTypes.arrayOf(PropTypes.string),
    extraPathSets: PropTypes.arrayOf(
      PropTypes.arrayOf(
        (propValue, key, componentName, location, propFullName) => {
          if (!_.isString(propValue[key]) && !_.isNumber(propValue[key])) {
            return new Error(
              `Invalid prop ${propFullName} supplied to` +
                ` ${componentName}. Validation failed.`,
            );
          }
          if (propValue[0] === 'search') {
            return new Error(
              `Invalid prop ${propFullName} supplied to ${componentName}. ` +
                'Just add the extension, do not add "search"... as this is already considered.',
            );
          }
          return true;
        },
      ),
    ),
  };

  Searchable.defaultProps = {
    length: 3,
    fields: [],
    extraPathSets: [[]],
  };

  Searchable.displayName = `FalcorSearch(${getDisplayName(WrappedField)})`;
  return withFalcor(Searchable);
};
