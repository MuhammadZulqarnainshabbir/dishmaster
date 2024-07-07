// src/UserRecipes.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, TextField, Typography, Paper, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './UserRecipes.css';

function UserRecipes({ userId }) {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const response = await axios.get('https://dishmaster.azurewebsites.net/getUserRecipes', {
        //const response = await axios.get('https://localhost:4000/getUserRecipes', {
          params: { userId }
        });
        setRecipes(response.data);
        setFilteredRecipes(response.data);
      } catch (error) {
        console.error('Error fetching user recipes:', error);
      }
    };

    fetchRecipes();
  }, [userId]);

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = recipes.filter(recipe =>
      recipe.name.toLowerCase().includes(query)
    );
    setFilteredRecipes(filtered);
  };

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleClosePopup = () => {
    setSelectedRecipe(null);
  };

  return (
    <Paper elevation={3} style={{ padding: '16px', marginTop: '16px' }}>
      <Typography variant="h6">Your Stored Recipes</Typography>
      <Box mt={2}>
        <TextField
          fullWidth
          label="Search recipes..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-bar"
        />
      </Box>
      <List>
        {filteredRecipes.map((recipe) => (
          <ListItem button key={recipe.id} onClick={() => handleRecipeClick(recipe)}>
            <ListItemText primary={recipe.name} />
          </ListItem>
        ))}
      </List>
      <Dialog open={selectedRecipe !== null} onClose={handleClosePopup}>
        <DialogTitle>
          {selectedRecipe?.name}
          <IconButton aria-label="close" onClick={handleClosePopup} style={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom><strong>Ingredients:</strong> {selectedRecipe?.ingredients.join(', ')}</Typography>
          <Typography gutterBottom><strong>Nutritional Information:</strong> {selectedRecipe?.nutrition}</Typography>
        </DialogContent>
      </Dialog>
    </Paper>
  );
}

export default UserRecipes;
