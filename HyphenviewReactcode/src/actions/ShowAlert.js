import React from 'react';
import ReactDOM from 'react-dom';
import CustomAlert from './CustomAlert';

function ShowAlert({ title, message, options }) {
  return new Promise((resolve) => {
    const modalRoot = document.createElement('div');
    document.body.appendChild(modalRoot);

    const handleClose = (response) => {
      resolve(response);
      ReactDOM.unmountComponentAtNode(modalRoot);
      document.body.removeChild(modalRoot);
    };

    ReactDOM.render(
      <CustomAlert
        open={true}
        onClose={handleClose}
        onAssign={handleClose}
        title={title}
        message={message}
        options={options}
      />,
      modalRoot
    );
  });
}

export default ShowAlert;