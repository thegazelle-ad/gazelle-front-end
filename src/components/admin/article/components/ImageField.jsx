import React from 'react';
import PropTypes from 'prop-types';

import { ValidatedImage } from 'components/admin/form-components/validated-fields';

const ImageUrlField = (props) => {
  const onChange = (event) => {
    props.updateImage(event.target.value);
  };

  return (
    <ValidatedImage
      name="image"
      value={props.image}
      floatingLabelText="Image (Remember to use https:// not http://)"
      disabled={props.disabled}
      onChange={onChange}
      fullWidth
    />
  );
};

ImageUrlField.propTypes = {
  image: PropTypes.string,
  disabled: PropTypes.bool,
  updateImage: PropTypes.func.isRequired,
};

export default ImageUrlField;
