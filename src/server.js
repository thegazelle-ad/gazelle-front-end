import FalcorServer from 'falcor-express';
import express from 'express';
import React from 'react';
import falcor from 'falcor';
import _ from 'lodash';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import sourcemap from 'source-map-support';
import routes from 'lib/routes';
import FalcorController from 'lib/falcor/FalcorController';
import FalcorRouter from 'lib/falcor/FalcorRouter';
import { injectModelCreateElement } from 'lib/falcor/falcorUtils';
import path from "path";

// *********************************************
// Load in static issue articles for development
// *********************************************
import testData from '../static/sample-issue/posts.js';
//import authors from '../static/sample-issue/authors.js';

// Allow node to use sourcemaps
sourcemap.install();

function buildHtml500Page (err) { 
  `<!DOCTYPE html>
    <html>
      <head>
        <title>The Gazelle</title>
      </head>
      <body>
        <h2>500 Error</h2>
        <p>A mistake happened. We apologize! Please contact The Gazelle's web development team with the error
        so we can fix it as fast as possible. This was the error:<br/>`+err.toString()+`</p>
      </body>
    </html>`
}

const buildHtmlString = (body, cache) => {
  return (
    `<!DOCTYPE html>
      <html>
        <head>
          <title>The Gazelle</title>
          <link rel="stylesheet" type="text/css" href="/static/build/main.css">
          <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png">
          <link rel="icon" type="image/png" href="/favicons/favicon-32x32.png" sizes="32x32">
          <link rel="icon" type="image/png" href="/favicons/favicon-16x16.png" sizes="16x16">
          <link rel="manifest" href="/favicons/manifest.json">
          <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#5bbad5">
          <meta name="theme-color" content="#ffffff">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <div id="main">`
            + body +
          `</div>
          <script>
            var _initialCache =
            ` + JSON.stringify(cache) + `
            ;
          </script>
          <script src="/static/build/client.js"></script>
        </body>
      </html>`
  );
};

// Shared serverModel
// You can also hardcode / stub parts of the model here
const serverModel = new falcor.Model({
  cache: testData,
  source: new FalcorRouter(),
}).batch();

// Asynchronously render this application
// Returns a promise
const renderApp = (renderProps) => {
  let falcorPaths = _.compact(renderProps.routes.map((route) => {
    const component = route.component;
    if (component.prototype instanceof FalcorController) {
      return component.getFalcorPathSets(renderProps.params);
    }
    return null;
  }));
  // Merging pathsets
  falcorPaths = falcorPaths.reduce((currentPathSets, nextPathSet) => {
    if (nextPathSet[0] instanceof Array) {
      return currentPathSets.concat(nextPathSet);
    }
    else {
      currentPathSets.push(nextPathSet);
      return currentPathSets;
    }
  }, []);

  // Merging pathsets
  var temp = [];
  falcorPaths.forEach((pathSet) => {
    if (pathSet[0] instanceof Array) {
      temp = temp.concat(pathSet);
    }
    else {
      temp.push(pathSet);
    }
  });
  falcorPaths = temp;

  // create a new model for this specific request
  // the reason we do this is so that the serverModel
  // cache won't expire records we need during the unlikely
  // event of heavy concurrent and unique traffic
  // And also it creates the minimum set of data we can send down
  // to the client and reload on the falcor there
  const localModel = new falcor.Model({ source: serverModel.asDataSource() });

  // If the component doesn't want any data
  if (!falcorPaths || falcorPaths.length === 0 || falcorPaths[0].length === 0 && falcorPaths.length === 1) {
    return new Promise((resolve) => {
      resolve(
        buildHtmlString(
          renderToString(
            <RouterContext
              createElement={injectModelCreateElement(localModel)}
              {...renderProps}
            />
          ),
          localModel.getCache()
        )
      );
    });
  }

  console.log('FETCHING Falcor Paths:');
  console.log(falcorPaths);

  return localModel.preload(...falcorPaths).then(() => {
    return (
      buildHtmlString(
        renderToString(
          <RouterContext
            createElement={injectModelCreateElement(localModel)}
            {...renderProps}
          />
        ),
        localModel.getCache()
      )
    );
  });
};

const server = express();

server.use("/model.json", FalcorServer.dataSourceRoute(() => {
  return serverModel.asDataSource()
}));

server.use("/static", express.static("static"));

server.use("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "./static"));
});

server.get('*', (req, res) => {
  match({ routes, location: req.url },
    (error, redirectLocation, renderProps) => {
      if (error) {
        res.status(500).send(error.message);
      } else if (redirectLocation) {
        res.redirect(302, redirectLocation.pathname + redirectLocation.search);
      } else if (renderProps) {
        renderApp(renderProps).then((html) => {
          res.status(200).send(html);
        }).catch((err) => {
          console.error('Failed to render: ', req.url);
          console.error(err.stack || err)
          res.status(500).send(buildHtml500Page(err));
        });
      } else {
        res.status(404).send('Not Found');
      }
    });
});


server.listen(3000, err => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Server started on port 3000');
});
