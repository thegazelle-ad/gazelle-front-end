import React from 'react';
import PropTypes from 'prop-types';
import { Editor } from 'slate-react';
import Paper from 'material-ui/Paper';
import { GazellePlugin } from './GazellePlugin';

const styles = {
  paper: {
    width: '100%',
    height: '100%',
    overflowY: 'scroll',
  },
  editor: { padding: 10, overflowY: 'scroll' },
};

export class MarkdownEditor extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.plugins = [GazellePlugin()];
  }

  onChange = ({ value }) => {
    this.props.onUpdate(value);
  };

  render() {
    return (
      <Paper style={styles.paper} zIndex={this.props.zIndex}>
        <Editor
          style={styles.editor}
          placeholder="Begin writing for the Gazelle :)"
          value={this.props.value}
          onChange={this.onChange}
          plugins={this.plugins}
          spellCheck
        />
      </Paper>
    );
  }
}

MarkdownEditor.propTypes = {
  value: PropTypes.shape({}).isRequired,
  onUpdate: PropTypes.func.isRequired,
  zIndex: PropTypes.number,
};

MarkdownEditor.defaultProps = {
  zIndex: 0,
};
