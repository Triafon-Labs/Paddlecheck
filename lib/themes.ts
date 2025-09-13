import { createTheme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';

// A custom theme for this app
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#005AC1', // A vibrant blue
    },
    secondary: {
      main: '#4CAF50', // A vibrant green
    },
    background: {
      default: '#F4F9FF',
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64B5F6', // A less saturated blue
    },
    secondary: {
      main: '#81C784', // A vibrant green for dark mode
    },
    background: {
      default: '#0A1929', // A darker, more navy blue
      paper: '#132F4C', // A darker paper blue
    },
    text: {
      primary: '#FFFFFF',
      secondary: grey[400],
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
});
