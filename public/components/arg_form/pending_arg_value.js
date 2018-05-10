import React from 'react';
import PropTypes from 'prop-types';
import { Loading } from '../loading';
import { ArgLabel } from './arg_label';

export class PendingArgValue extends React.PureComponent {
  static propTypes = {
    label: PropTypes.string,
    argTypeInstance: PropTypes.shape({
      help: PropTypes.string.isRequired,
    }).isRequired,
    setResolvedArgValue: PropTypes.func.isRequired,
    templateProps: PropTypes.shape({
      argResolver: PropTypes.func.isRequired,
      argValue: PropTypes.object,
    }),
  };

  componentDidMount() {
    // on mount, resolve the arg value using the argResolver
    const { setResolvedArgValue, templateProps } = this.props;
    const { argResolver, argValue } = templateProps;
    if (!argValue) {
      setResolvedArgValue(null);
    } else {
      argResolver(argValue)
        .then(val => setResolvedArgValue(val != null ? val : null))
        .catch(() => setResolvedArgValue(null)); // swallow error, it's not important
    }
  }

  render() {
    const { label, argTypeInstance } = this.props;

    return (
      <div className="canvas__arg">
        <ArgLabel
          className="resolve-pending"
          label={label}
          help={argTypeInstance.help}
          expandable={false}
        >
          <div className="canvas__arg--pending">
            <Loading animated text="Loading" />
          </div>
        </ArgLabel>
      </div>
    );
  }
}
