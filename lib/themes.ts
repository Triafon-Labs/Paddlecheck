import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5', // A blue color for headers, etc.
    },
    background: {
      default: '#212121',
      paper: '#424242',
    },
  },
});
