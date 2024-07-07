   // TypingIndicator.js
   import React from 'react';
   import { Box, Typography } from '@mui/material';
   import './TypingIndicator.css';

   function TypingIndicator() {
     return (
       <Box className="typing-indicator">
         <Typography variant="body2">Dish Master is typing...</Typography>
         <Box className="dot" />
         <Box className="dot" />
         <Box className="dot" />
       </Box>
     );
   }

   export default TypingIndicator;
