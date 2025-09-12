'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  Link,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface LinksModalProps {
  open: boolean;
  onClose: () => void;
}

const links = [
  {
    name: 'GOV.UK River Level',
    url: 'https://check-for-flooding.service.gov.uk/station/2092',
  },
];

const LinksModal: React.FC<LinksModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="links-dialog-title">
      <DialogTitle id="links-dialog-title">
        <Box display="flex" alignItems="center">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Useful Links
          </Typography>
          <IconButton aria-label="close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <List>
          {links.map((link) => (
            <ListItem
              key={link.name}
              component={Link}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Typography sx={{ flexGrow: 1 }}>{link.name}</Typography>
              <OpenInNewIcon fontSize="small" />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default LinksModal;
