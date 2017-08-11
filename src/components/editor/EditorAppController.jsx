import React from 'react';
import BaseComponent from 'lib/BaseComponent';
import { browserHistory } from 'react-router';
import http from 'http';

// material-ui
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import AppBar from 'material-ui/AppBar';
import FlatButton from 'material-ui/FlatButton';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import Divider from 'material-ui/Divider';

// Components
import EditorNavigation from 'components/editor/EditorNavigation';

let HOSTNAME = '';
let PORT = '';

if (process.env.NODE_ENV === 'production') {
  HOSTNAME = 'admin.thegazelle.org';
  PORT = 443;
} else if (process.env.NODE_ENV === 'beta') {
  HOSTNAME = 'adminbeta.thegazelle.org';
  PORT = 443;
} else {
  HOSTNAME = 'localhost';
  PORT = 4000;
}

export default class EditorAppController extends BaseComponent {
  constructor(props) {
    super(props);
    this.restartServer = this.restartServer.bind(this);
    this.pingServer = this.pingServer.bind(this);
    this.handleDisableLink = this.handleDisableLink.bind(this);
    this.resetGhostInfo = this.resetGhostInfo.bind(this);
    this.isLoggedIn = this.isLoggedIn.bind(this);
  }

  componentWillMount() {
    // Used for material-ui magic;
    injectTapEventPlugin(); // Will be removed when React supports onTouchTap() soon
  }

  isLoggedIn() {
    return this.props.location.pathname.substr(0, 6) !== '/login';
  }

  handleDisableLink(e) {
    if (!this.isLoggedIn()) {
      e.preventDefault();
    }
  }

  pingServer () {
    let counter = 0;
    function isRestarted () {
      http.get('/isrestarted', (response) => {
        let signal = '';
        response.on('data', (chunk) => {
          signal += chunk;
        });
        response.on('end', () => {
          if (signal === 'false') {
            window.alert("Servers restarted successfully");
          }
          else if (signal === 'true') {
            counter+=1;
            if (counter <= 5) {
              setTimeout(isRestarted, 500);
            }
          }
          if (counter > 5) {
            window.alert('Error');
          }
        })
      })
    }
    isRestarted();
  }

  restartServer() {
    const password = window.prompt('Please input the password');
    const options = {
      hostname: HOSTNAME,
      port: PORT,
<<<<<<< d3c8d13623aea3cbf13fcc99d1adbfcac89d2f09
      path: `/restartserver?password=${password}`,
    };
=======
      path: '/restartserver?password=' + password,
    }

>>>>>>> Reset Server Button
    http.get(options, (res) => {
      let reply = '';

      res.on('data', (chunk) => {
        reply += chunk;
      });

      res.on('end', () => {
<<<<<<< 53fc8f687b5c20a2315a5809a6aec3883cb882c9
<<<<<<< d3c8d13623aea3cbf13fcc99d1adbfcac89d2f09
        if (reply === 'restarted') {
          window.alert('Servers restarted successfully');
        } else if (reply === 'error') {
          window.alert('there was an error restarting the servers');
        } else if (reply === 'invalid') {
          window.alert('invalid password');
        } else {
          window.alert('unknown error');
=======
        if (reply === "restarted") {
          window.alert("Servers restarted successfully");
        }
        else if (reply === "start") {
          window.alert("server is being restarted now");
=======
        if (reply === "start") {
          window.alert("Server is being restarted now");
<<<<<<< 9907f2f92e33d7e1a3d761b5263013b6637e3769
          this.isRestarted();
>>>>>>> Update EditorAppController.jsx
=======
          this.pingServer();
>>>>>>> Made corrections to EditorAppController as suggested
        }
        else if (reply === "error") {
          window.alert("There was an error restarting the servers");
        }
        else if (reply === "invalid") {
          window.alert("Invalid password");
        }
        else {
<<<<<<< 53fc8f687b5c20a2315a5809a6aec3883cb882c9
          window.alert("unknown error");
>>>>>>> Reset Server Button
=======
          window.alert("Unknown error");
>>>>>>> Update EditorAppController.jsx
        }
      });
    });
  }

  resetGhostInfo() {
    this.props.model.invalidate(['articlesByPage'], ['articlesBySlug']);
    browserHistory.push('/');
  }

  render() {
    const navItems = ['Articles', 'Authors', 'Issues', 'Images'];
    const bodyStyle = { transition: 'margin-left 450ms cubic-bezier(0.23, 1, 0.32, 1)' };
    if (this.isLoggedIn()) { bodyStyle.marginLeft = 256; }

    const LoggedIn = () => (
      <IconMenu
        iconButtonElement={
          <IconButton><MoreVertIcon /></IconButton>
        }
        targetOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      >
        <MenuItem
          primaryText="Restart Server"
          onClick={this.restartServer}
          style={{ color: '#C62828' }}
        />
        <MenuItem
          primaryText="Refresh Ghost Data"
          onClick={this.resetGhostInfo}
          disabled
        />
        <Divider />
        <MenuItem primaryText="Sign out" />
      </IconMenu>
    );

    return (
      <MuiThemeProvider>
        <div className="mainContainer">
          <AppBar
            title={"Editor Tools"}
            iconElementRight={this.isLoggedIn() ?
              <LoggedIn /> :
              <FlatButton label="Sign In" />}
            showMenuIconButton={false}
          />

          {/* Only show nav if logged in */}
          <EditorNavigation navItems={navItems} isNavOpen={this.isLoggedIn()} />
          <div style={bodyStyle} className="editor-body">
            <div className="editor-items">
              {this.props.children}
            </div>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}
