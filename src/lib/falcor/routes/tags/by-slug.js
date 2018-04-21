import _ from 'lodash';

import { tagQuery, updateTags, addTag } from './database-calls';
import { has } from 'lib/utilities';

export const routes = [
  {
    route: "tags['bySlug'][{keys:slugs}]['id', 'name', 'slug']",
    get: pathSet =>
      new Promise(resolve => {
        const requestedFields = pathSet[3];
        // TODO change to article query once Will's changes
        // are merged in.
        tagQuery(pathSet.slugs, requestedFields).then(data => {
          // always returns slug in the object no matter what.
          const results = [];
          data.forEach(tag => {
            requestedFields.forEach(field => {
              results.push({
                path: ['tags', 'bySlug', tag.slug, field],
                value: tag[field],
              });
            });
          });
          resolve(results);
        });
      }),
    set: jsonGraphArg =>
      new Promise((resolve, reject) => {
        const tagsBySlug = jsonGraphArg.tags.bySlug;
        updateTags(tagsBySlug)
          .then(flag => {
            if (!flag) {
              throw new Error(
                'For unknown reasons updateTags returned a non-true flag',
              );
            }
            const results = [];
            _.forEach(tagsBySlug, (tagObject, slug) => {
              _.forEach(tagObject, (value, field) => {
                results.push({
                  path: ['tags', 'bySlug', slug, field],
                  value,
                });
              });
            });
            resolve(results);
          })
          .catch(e => {
            reject(e);
          });
      }),
  },
  {
    route: "tags['bySlug']['addTag']",
    call: (callPath, args) =>
      new Promise(resolve => {
        const tagObject = args[0];
        if (!(has.call(tagObject, 'slug') && has.call(tagObject, 'name'))) {
          throw new Error(
            'When creating a tag you must provide both name and slug',
          );
        }
        addTag(tagObject).then(flag => {
          if (flag !== true) {
            throw new Error('Create Tag function returned non-true flag');
          }
          const results = [];
          const tagSlug = tagObject.slug;
          _.forEach(tagObject, (value, field) => {
            results.push({
              path: ['tags', 'bySlug', tagSlug, field],
              value,
            });
          });
          resolve(results);
        });
      }),
  },
];
