import FalcorServer from 'falcor-express';
import express from 'express';
import compression from 'compression';
import React from 'react';
import falcor from 'falcor';
import _ from 'lodash';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import sourcemap from 'source-map-support';
import mainRoutes from 'lib/routes';
import FalcorController from 'lib/falcor/FalcorController';
import FalcorRouter from 'lib/falcor/FalcorRouter';
import { injectModelCreateElement } from 'lib/falcor/falcorUtils';
import path from "path";
import crypto from "crypto";
import fs from "fs"
import Helmet from "react-helmet";
import bodyParser from 'body-parser';
import { exec } from 'child_process';

process.env.NODE_ENV === "production" ?
  console.log("PRODUCTION BUILD") : process.env.NODE_ENV === "beta" ? console.log("BETA BUILD") : console.log("DEVELOPMENT BUILD"); // eslint-disable-line no-console

// Allow node to use sourcemaps

if (process.env.NODE_ENV !== "production") {
  sourcemap.install();
}

// Create MD5 hash of static file for better cache performance
function md5Hash(file) {
  const hash = crypto.createHash('md5');
  // readFileSync in the syncronous version of readFile
  file = fs.readFileSync(file, 'utf8');
  return (hash.update(file).digest('hex'));
}

const mainClientHash = md5Hash('./static/build/client.js');
const mainCssHash = md5Hash('./static/build/main.css');

const buildMainHtmlString = (body, cache) => {

  let head = Helmet.rewind();

  return (
    `<!DOCTYPE html>
      <html>
        <head>
          ` + head.title + `
          <link rel="stylesheet" type="text/css" href="/static/build/main.css?h=` + mainCssHash + `">
          <link rel="icon" type="image/x-icon" href="https://thegazelle.s3.amazonaws.com/gazelle/2016/02/favicon.ico">
          <link rel="apple-touch-icon" sizes="180x180" href="https://thegazelle.s3.amazonaws.com/gazelle/2016/02/apple-touch-icon.png">
          <link rel="icon" type="image/png" href="https://thegazelle.s3.amazonaws.com/gazelle/2016/02/favicon-32x32.png" sizes="32x32">
          <link rel="icon" type="image/png" href="https://thegazelle.s3.amazonaws.com/gazelle/2016/02/favicon-16x16.png" sizes="16x16">
          <link rel="manifest" href="/favicons/manifest.json">
          <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#5bbad5">
          <meta name="theme-color" content="#ffffff">
          <meta name="viewport" content="width=device-width, initial-scale=1">`
            + head.meta +
          `
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
          <script src="/static/build/client.js?h=` + mainClientHash + `"></script>
        </body>
      </html>`
  );
};

const editorClientHash = md5Hash('./static/build/editor-client.js');
const editorCssHash = md5Hash('./static/editorStyles.css');

const editorHtmlString = (
  `<!DOCTYPE html>
    <html>
      <head>
        <title>Gazelle Editor Tools</title>
        <link rel="stylesheet" href="/pure-min.css">
        <link rel="stylesheet" type="text/css" href="/editorStyles.css?h=` + editorCssHash + `">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <div id="main">
          loading...
        </div>
        <script src="/build/editor-client.js?h=` + editorClientHash + `"></script>
      </body>
    </html>`
);

// Shared serverModel
// You can also hardcode / stub parts of the model here
const serverModel = new falcor.Model({
  source: new FalcorRouter(),
  // maxSize is 400 MB in production and 80 MB when in development or beta mode
  maxSize: process.env.NODE_ENV === "production" ? 400*1000*1000 : 80*1000*1000,
  collectRatio: 0.75,
}).batch();

// Asynchronously render this application
// Returns a promise
const renderApp = (renderProps) => {
  let falcorPaths = _.compact(renderProps.routes.map((route) => {
    const component = route.component;
    if (component.prototype instanceof FalcorController) {
      let pathSets = component.getFalcorPathSets(renderProps.params, renderProps.location.query);
      if (!(pathSets instanceof Array) || pathSets.length === 0) {
        return null;
      }
      return pathSets;
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
        buildMainHtmlString(
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

  // Silenced Falcor path logs
  // console.log('FETCHING Falcor Paths:');
  // console.log(falcorPaths);
  return localModel.preload(...falcorPaths).then(() => {
    return (
      buildMainHtmlString(
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

// The Gazelle website server

const mainApp = express();

mainApp.use("/model.json", FalcorServer.dataSourceRoute(() => {
  return serverModel.asDataSource()
}));

mainApp.use("/static", express.static("static"));

mainApp.use("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "./static"));
});

mainApp.use(compression());

if (process.env.NODE_ENV === "beta") {
  mainApp.get('/login', (req, res) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("GOT REQUEST"); // eslint-disable-line no-console
    }
    match({ routes: mainRoutes, location: req.url },
      (error, redirectLocation, renderProps) => {
        if (error) {
          res.status(500).send(error.message);
        } else if (redirectLocation) {
          res.redirect(302, redirectLocation.pathname + redirectLocation.search);
        } else if (renderProps) {
          renderApp(renderProps, true).then((html) => {
            res.status(200).send(html);
          }).catch((err) => {
            if (process.env.NODE_ENV !== "production") {
              console.error('Failed to render: ', req.url); // eslint-disable-line no-console
              console.error(err.stack || err) // eslint-disable-line no-console
              res.status(500).send(err.stack || err);
            }
            else {
              res.status(500).send("There was an error while serving you this webpage." +
                " Please contact The Gazelle team and tell them this link is broken. We hope" +
                " to fix it soon. Thank you.");
            }
          });
        } else {
          res.status(404).send('Not Found');
        }
      }
    );
  });
  mainApp.get(/(?!\/login)/, (req, res) => {
    res.redirect(307, '/login?url=' + req.url);
  });
}
else {
  mainApp.get('*', (req, res) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("GOT REQUEST"); // eslint-disable-line no-console
    }
    match({ routes: mainRoutes, location: req.url },
      (error, redirectLocation, renderProps) => {
        if (error) {
          res.status(500).send(error.message);
        } else if (redirectLocation) {
          res.redirect(302, redirectLocation.pathname + redirectLocation.search);
        } else if (renderProps) {
          renderApp(renderProps, true).then((html) => {
            res.status(200).send(html);
          }).catch((err) => {
            if (process.env.NODE_ENV !== "production") {
              console.error('Failed to render: ', req.url); // eslint-disable-line no-console
              console.error(err.stack || err) // eslint-disable-line no-console
              res.status(500).send(err.stack || err);
            }
            else {
              res.status(500).send("There was an error while serving you this webpage." +
                " Please contact The Gazelle team and tell them this link is broken. We hope" +
                " to fix it soon. Thank you.");
            }
          });
        } else {
          res.status(404).send('Not Found');
        }
      }
    );
  });
}

// To start server with PORT=3000 default: run `npm start`
// NOTE: On Linux systems, any port below 1024 requires root access (`sudo` command)
// To run on port 80:
//    Development build: run `sudo PORT=80 npm start`
//    Production build: run `sudo npm start`
mainApp.listen(process.env.MAIN_PORT ? process.env.MAIN_PORT : 3000, err => {
  if (err) {
    console.error(err); // eslint-disable-line no-console
    return;
  }
  console.log('The Gazelle Website started on port ' + (process.env.MAIN_PORT ? process.env.MAIN_PORT : 3000)); // eslint-disable-line no-console
});




// Editor tools server

const editorTools = express();

// This is for parsing post requests
editorTools.use(bodyParser.urlencoded({extended: true, limit: "50mb"}));
// For connecting the client to our falcor server
editorTools.use("/model.json", FalcorServer.dataSourceRoute(() => {
  return serverModel.asDataSource()
}));
// serving static files
editorTools.use(express.static("static"));

var allowCrossDomain = function(req, res, next) {
    if ('OPTIONS' == req.method) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
      res.send(200);
    }
    else {
      next();
    }
};

editorTools.use(allowCrossDomain);

const PATH_NAME = process.env.NODE_ENV === "production" ?
  '~/gazelle-production/scripts/restartServers.sh' : process.env.NODE_ENV === "beta" ?
  '~/gazelle-beta/scripts/restartServers.sh' : '~/code/gazelle-front-end/scripts/restartServers.sh';

editorTools.get('/restartserver', (req, res) => {
  if (!process.env.NODE_ENV) {
    // in dev mode
    res.status(200).send("restarted");
    return;
  }
  const H1PRIME = 4189793;
  const H2PRIME = 3296731;
  const BIG_PRIME = 5003943032159437;
  let hash = function(password) {
    let num = password.charCodeAt(0);
    for (let i = 1; i < password.length; i++) {
      num = ((num*256)%BIG_PRIME + password.charCodeAt(i))%BIG_PRIME;
    }
    const hash = ((num % H1PRIME) + 5*(num % H2PRIME) + 1 + 25)%BIG_PRIME;
    return hash;
  }

  const password = req.query.password;
  if ((typeof password) !== "string" || password.length < 1) {
    res.status(401).send('invalid');
  }
  else if (hash(password) === 8692053) {
    exec(PATH_NAME, (err, stdout, stderr) => {
      if (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error(err); // eslint-disable-line no-console
        }
        res.status(500).send('error');
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log(stdout); // eslint-disable-line no-console
        console.log(stderr); // eslint-disable-line no-console
      }
      res.status(200).send('restarted');
    });
  }
  else {
    res.status(401).send('invalid');
  }
})

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "beta") {
  editorTools.get('/login', (req, res) => {
    res.status(200).send(editorHtmlString);
  });

  editorTools.get(/(?!\/restartserver|\/login).*/, (req, res) => {
    res.redirect(307, '/login?url=' + req.url);
  });
}

else {
  editorTools.get(/(?!\/restartserver).*/, (req, res) => {
    res.status(200).send(editorHtmlString);
  });
}


editorTools.listen(process.env.EDITOR_PORT ? process.env.EDITOR_PORT : 4000, err => {
  if (err) {
    console.error(err); // eslint-disable-line no-console
    return;
  }

  console.log('Editor tools server started on port', process.env.EDITOR_PORT ? process.env.EDITOR_PORT : 4000); // eslint-disable-line no-console
});
