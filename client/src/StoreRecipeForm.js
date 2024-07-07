// src/StoreRecipeForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';

function StoreRecipeForm({ userId, onRecipeStored }) {
  const [recipe, setRecipe] = useState({
    name: '',
    ingredients: '',
    nutrition: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipe((prevRecipe) => ({ ...prevRecipe, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending recipe to server:', recipe);
      await axios.post('https://dishmaster.azurewebsites.net/saveRecipe', {
      //await axios.post('https://localhost:4000/saveRecipe', {
        userId,
        recipe: {
          name: recipe.name,
          ingredients: recipe.ingredients.split(','),
          nutrition: recipe.nutrition
        }
      });
      onRecipeStored();
      setRecipe({ name: '', ingredients: '', nutrition: '' });
    } catch (error) {
      console.error('Error storing recipe:', error);
    }
  };

  return (
    <Paper elevation={3} style={{ padding: '16px', marginTop: '16px' }}>
      <form onSubmit={handleSubmit}>
        <Typography variant="h6">Store a Recipe</Typography>
        <Box mt={2}>
          <TextField
            fullWidth
            label="Recipe Name"
            name="name"
            value={recipe.name}
            onChange={handleChange}
            required
          />
        </Box>
        <Box mt={2}>
          <TextField
            fullWidth
            label="Ingredients (comma-separated)"
            name="ingredients"
            value={recipe.ingredients}
            onChange={handleChange}
            required
          />
        </Box>
        <Box mt={2}>
          <TextField
            fullWidth
            label="Nutritional Information"
            name="nutrition"
            value={recipe.nutrition}
            onChange={handleChange}
            required
          />
        </Box>
        <Box mt={2}>
          <Button type="submit" variant="contained" color="primary">
            Store Recipe
          </Button>
        </Box>
      </form>
    </Paper>
  );
}

export default StoreRecipeForm;
