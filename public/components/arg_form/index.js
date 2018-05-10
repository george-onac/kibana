import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose, withState, lifecycle } from 'recompose';
import { getWorkpadInfo } from '../../state/selectors/workpad';
import { ArgForm as Component } from './arg_form';

export const ArgForm = compose(
  withState('label', 'setLabel', ({ label, argTypeInstance }) => {
    return label || argTypeInstance.displayName || argTypeInstance.name;
  }),
  withState('expand', 'setExpand', ({ argTypeInstance }) => argTypeInstance.expanded),
  withState('resolvedArgValue', 'setResolvedArgValue'),
  withState('renderError', 'setRenderError', false),
  lifecycle({
    componentDidUpdate(prevProps) {
      if (prevProps.templateProps.argValue !== this.props.templateProps.argValue) {
        this.props.setRenderError(false);
        this.props.setResolvedArgValue();
      }
    },
  }),
  connect(state => ({ workpad: getWorkpadInfo(state) }))
)(Component);

ArgForm.propTypes = {
  label: PropTypes.string,
  argTypeInstance: PropTypes.shape({
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    expanded: PropTypes.bool,
  }).isRequired,
};
