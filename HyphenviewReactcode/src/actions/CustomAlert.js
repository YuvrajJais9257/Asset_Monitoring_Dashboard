import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function CustomAlert({ open, onClose, onAssign, title, message, options }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="custom-alert-title"
      aria-describedby="custom-alert-description"
    >
      <DialogTitle id="custom-alert-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="custom-alert-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {options.includes("Cancel") && (
          <Button onClick={() => onClose("Cancel")} color="primary">
            Cancel
          </Button>
        )}
        {options.includes("Assign") && (
          <Button onClick={() => onAssign("Assign")} color="primary">
            Assign
          </Button>
        )}
        {options.includes("OK") && (
          <Button onClick={() => onClose("OK")} color="primary" autoFocus>
            OK
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}