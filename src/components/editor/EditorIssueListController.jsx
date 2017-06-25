import React from 'react';
import FalcorController from 'lib/falcor/FalcorController';
import _ from 'lodash';
import { browserHistory, Link } from 'react-router';

// material-ui
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import {Tabs, Tab} from 'material-ui/Tabs';
import TextField from 'material-ui/TextField';

export default class EditorIssueListController extends FalcorController {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.addIssue = this.addIssue.bind(this);
    this.safeSetState({
      saving: false,
      name: '',
      number: '',
    });
  }
  static getFalcorPathSets() {
    return ['issuesByNumber', {from: 1, to: 200}, 'name'];
  }

  handleChange(e) {
    const issueNumber = e.target.value;
    if (issueNumber === "none") {
      browserHistory.push("/issues");
      return;
    }
    const currentUrl = this.props.location.pathname;
    const urlArray = currentUrl.split('/');
    urlArray[2] = issueNumber.toString();
    const newUrl = urlArray.join('/');
    browserHistory.push(newUrl);
  }

  addIssue(e) {
    e.preventDefault();
    const formNode = e.target;
    if (this.state.data.issuesByNumber.hasOwnProperty(formNode.issueNumber.value)) {
      window.alert("This issue has already been created, you cannot create it again");
      return;
    }
    const children = _.map(formNode.children, (child) => {
      return child.name;
    })
    const fields = children.filter((key) => {
      return key && isNaN(parseInt(key)) && key !== "length";
    });
    const issue = {};
    fields.forEach((field) => {
      const value = formNode[field].value
      issue[field] = field === "issueNumber" ? parseInt(value) : value;
    });

    const callback = () => {
      this.safeSetState({saving: false});
      fields.forEach((field) => {
        formNode[field].value = "";
      });
    }
    this.safeSetState({
      saving: true,
    });
    this.falcorCall(['issuesByNumber', 'addIssue'], [issue],
      undefined, undefined, undefined, callback)
  }

  render() {
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
    }

    if (this.state.ready) {
      if (!this.state.data) {
        return (
          <div>
            An error occured while fetching issue data,
            please contact the development team
          </div>
        );
      }
      const issueNumber = this.props.params.issueNumber;
      if (issueNumber && isNaN(parseInt(issueNumber))) {
        return <div>Invalid URL</div>;
      }
      const data = this.state.data.issuesByNumber;
      const baseUrl = "/issues/" + issueNumber;

      const issues = Object.keys(data).map((key) => {return parseInt(key)});
      const nextIssue = Math.max(...issues)+1;
      return (
        <div>
          <h1>Issues</h1>
          <Divider />
          <Paper style={styles.paper} zDepth={2}>
            <Tabs>
              <Tab label="ADD NEW">
                <div style={styles.tabs}>
                  <h2>Add a new issue</h2>
                  <Divider />
                  {
                    this.state.saving ?
                      <div>Adding issue...</div> :
                      null
                  }
                  <form
                    onSubmit={this.addIssue}
                  >
                    <TextField
                      name="name"
                      hintText={"Issue " + nextIssue}
                      value={this.state.name}
                      floatingLabelText="Issue Name"
                      disabled={this.state.saving}
                      onChange={e => this.setState({ name: e.target.value })}
                    /><br />
                    <TextField
                      name="issueNumber"
                      hintText={nextIssue}
                      value={this.state.number}
                      floatingLabelText="Issue Number"
                      disabled={this.state.saving}
                      onChange={e => this.setState({ number: e.target.value })}
                    /><br />

                    <br />
                    <br />
                    Name of Issue:
                    <input
                      type="text"
                      name="name"
                      placeholder="Input Issue Name"
                      defaultValue={"Issue " + nextIssue}
                      disabled={this.state.saving}
                    />
                    Issue Number:
                    {/* Don't use type=number here as it had weird problems in Chrome */}
                    <input
                      type="text"
                      name="issueNumber"
                      placeholder="Input Issue Number"
                      defaultValue={nextIssue}
                      disabled={this.state.saving}
                    />
                    <input
                      type="submit"
                      className="pure-button pure-button-primary"
                      value="Create Issue"
                      disabled={this.state.saving}
                    />
                  </form>
                </div>
              </Tab>
              <Tab label="EDIT">
                <div style={styles.tabs}>
                  <h2>Edit an issue</h2>
                  <Divider />
                  <p>Choose the issue you want to edit in the dropdown here
                  and pick which type of editing you would like to do in the list below</p>
                  <select defaultValue={issueNumber ? issueNumber : "none"} onChange={this.handleChange}>
                    <option value="none" key="none">None Chosen</option>
                    {
                      _.map(data, (issue, number) => {
                        const name = issue.name;
                        return <option value={number} key={number}>{name}</option>;
                      }).reverse()
                    }
                  </select>
                </div>
              </Tab>
            </Tabs>
          </Paper>
          <Paper style={styles.paper} zDepth={2}>
            {
              this.props.params.issueNumber ?
                <ul>
                  <li><Link to={baseUrl+"/main"} activeClassName="active-link">Main</Link></li>
                  <li><Link to={baseUrl+"/articles"} activeClassName="active-link">Articles</Link></li>
                  <li><Link to={baseUrl+"/categories"} activeClassName="active-link">Categories</Link></li>
                </ul> :
                null
            }
            {this.props.children}
          </Paper>
        </div>
      );
    }
    else {
      return (
        <div className="pure-g">
          <div className="pure-u-3-8">
            <h3>Issues</h3>
            <p>loading...</p>
          </div>
          <div className="pure-u-1-8"></div>
          <div className="pure-u-1-2">
            {this.props.children}
          </div>
        </div>
      );
    }
  }
}
