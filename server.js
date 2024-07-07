const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Load SSL certificates
const privateKey = fs.readFileSync('dishmaster.key', 'utf8');
const certificate = fs.readFileSync('dishmaster.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials, app);
const io = socketIo(server, {
  cors: {
    origin: "https://dishmaster.azurewebsites.net",
    //origin: "https://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(bodyParser.json());
app.use(cors({
  origin: "https://dishmaster.azurewebsites.net"
  //origin: "https://localhost:3000"
}));




const PORT = process.env.PORT || 4000;

//PRODUCTION MODE
// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client', 'build')));
// Catch-all handler to serve the React app for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

//DEVELOPMENT MODE
// Serve static files from the React app
//app.use(express.static('public'));


// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send initial greeting
  socket.emit('message', { text: "Hi! I'm your recipe assistant. I'll ask you a series of questions that will help me in personalizing my output for you. Let's start with the first question." });

  // Handle incoming messages
  socket.on('message', (data) => {
    console.log('Message received:', data);
    const response = handleUserMessage(data);
    console.log('Response:', response);
    socket.emit('message', response);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Load intents
const intents = require('./intents.json');
const ingredientSubstitutionIntents = require('./ingredient_substitution_intents.json');
const nutritionalInformation = require('./nutritional_information.json');
const recipes = require('./recipes.json');
const menuIntents = require('./menuIntents.json');
const userRecipes = {};
const conversationHistory = {};
const fallbackCount = {};
const userAnswers = {}; // Store user answers
const userQuestions = {}; // Track asked questions
const currentContext = {}; // Track current context
var ingCheck = "";
var allergyCheck = "";


function handleUserMessage(data) {
  const { userId, message } = data;
  console.log('Handling message for user:', userId);
  if (!conversationHistory[userId]) {
    conversationHistory[userId] = [];
    fallbackCount[userId] = 0;
    userAnswers[userId] = {}; // Initialize user answers
    userQuestions[userId] = new Set(); // Initialize asked questions as a Set to avoid duplicates
    currentContext[userId] = null; // Initialize current context
  }
  conversationHistory[userId].push(message);//Save User Message

  //Recognize Intent
  const intent = recognizeIntent(message, userId);

  if (intent) {
    fallbackCount[userId] = 0; // Reset fallback count on successful intent recognition   
    console.log('Recognized intent:', intent);
    console.log('Recognized context:', intent.context);
    console.log('CURRENT CONTEXT:', currentContext[userId]);

    if(intent.intent == "ingredient_preference"){
      ingCheck += message;
    }
    if(intent.intent == intent.intent == "allergies"){
      allergyCheck += message;
    }


    // Handle Q/A Session
    if(intent.context != 'menu'){
      return generateResponse(intent, userId);
    }
    // Handle Action Tasks
    currentContext[userId] = 'menu';
    const task = intent.intent;
    console.log("TASK:", task);
    return { text: handleTask(task, message, userId) };

  } else {
    fallbackCount[userId]++;
    if (fallbackCount[userId] >= 5 && currentContext[userId] != 'menu') {
      console.log('Hard fallback triggered for user:', userId);
      fallbackCount[userId] = 0; // Reset fallback count after hard fallback
      conversationHistory[userId] = []; // Clear conversation history
      delete userAnswers[userId]; // Clear user answers
      userQuestions[userId] = new Set(); // Clear asked questions
      currentContext[userId] = null; // Clear current context
      return { text: "I'm having trouble understanding. Let's start over. Hi! I'm your recipe assistant. How can I help you today?" };
    } else {
      console.log('Soft fallback triggered for user:', userId);
      return { text: "I'm sorry, I didn't understand that. Can you please rephrase?" };
    }
  }
}

function recognizeIntent(message, userId) {
  const lowerCaseMessage = message.toLowerCase();
  let bestMatch = null;

  if (currentContext[userId] === null || currentContext[userId] === 'initial_greeting') {
    // Recognize initial greeting
    for (const intent of intents) {
      if (intent.intent === 'initial_greeting') {
        console.log("Greetings Intent Recognized");
        for (const keyword of intent.keywords) {
          if (lowerCaseMessage.includes(keyword)) {
            bestMatch = intent;
            break;
          }
        }
      }
      if (bestMatch) break;
    }
  } else if (currentContext[userId] !== 'menu') {
    console.log("Q/A INTENT RECOGNIZED");
    console.log("context to match----------:", currentContext[userId]);
    // Specialized intent recognition for Q/A session
    for (const intent of intents) {
      console.log("searched intent:", intent.intent);
      console.log("searched intent context:", intent.context);
      if (intent.context === currentContext[userId]) {
        console.log("-----------CONTEXT MATCH FOUND------------:", intent.context);
        for (const keyword of intent.keywords) {
          if (lowerCaseMessage.includes(keyword)) {
            console.log("-----------KEYWORD MATCH FOUND------------:", keyword);
            bestMatch = intent;
            console.log("bestMatch Intent:", bestMatch);
            break;
          }
        }
      }
      if (bestMatch) break;
    }
  } else {
    // Simplified intent recognition for the menu and other tasks
    if (!bestMatch) {
      for (const intent of menuIntents) {
        for (const keyword of intent.keywords) {
          if (lowerCaseMessage.includes(keyword)) {
            console.log("MENU INTENT RECOGNIZED:",intent.intent);
            bestMatch = intent;
            break;
          }
        }
        if (bestMatch) break;
      }
    }

    // Check ingredient substitution intents if no match found in main intents
    if (!bestMatch) {
      for (const intent of ingredientSubstitutionIntents) {
        for (const keyword of intent.keywords) {
          if (lowerCaseMessage.includes(keyword)) {
            console.log("SUBSTITUTION INTENT RECOGNIZED:",intent.intent);
            bestMatch = intent;
            break;
          }
        }
        if (bestMatch) break;
      }
    }

    // Check nutritional information if no match found in main and substitution intents
    if (!bestMatch) {
      for (const info of nutritionalInformation) {
        if (lowerCaseMessage.includes(info.ingredient)) {
          console.log("NUTRITIONAL INFORMATION INTENT RECOGNIZED:",info.ingredient);
          bestMatch = {
            intent: `nutrition_${info.ingredient}`,
            response: info.nutrition
          };
          break;
        }
      }
    }
  }

  console.log('Best match intent:', bestMatch);
  return bestMatch;
}

function findNextIntent(currentIntent) {
  const response = currentIntent.response;
  for (const intent of intents) {
    if (intent.question === response) {
      return intent;
    }
  }
  return null;
}

function generateResponse(intent, userId) {
  console.log("generate Response currentIntent:", intent.intent);
  console.log("CONTEXT:", intent.context);

  if(intent.context != 'menu' && currentContext[userId] != 'menu'){
    // GREETING
    if (intent.intent === 'initial_greeting') {
      // Start asking questions after greeting
      currentContext[userId] = 'diet';
      return { text: intents.find(i => i.intent === 'cuisine_preference').question };
    }

    // Save user's answer
    const currentQuestion = intents.find(q => q.intent === intent.intent);
    console.log("old currentQuestion:", currentQuestion);
    if (currentQuestion) {
      userAnswers[userId][currentQuestion.context] = conversationHistory[userId].slice(-1)[0];
      userQuestions[userId].add(currentQuestion.context); // Mark question as asked
      console.log('Saved answer for user:', userId, 'Context:', currentContext[userId], 'Answer:', userAnswers[userId][currentQuestion.context]);
    }

    // Respond with the intent's response
    // Update context to the context of the response
    console.log("previousContext:", currentContext[userId]);
    currentContext[userId] = intent.context;
    console.log("newContext:", currentContext[userId]);
    // Find the next intent based on the current intent's response
    const nextIntent = findNextIntent(intent);
    if(nextIntent)
  {
    console.log("*********userQuestions:", userQuestions[userId]);
    var check = false;

    if(userQuestions[userId].has(nextIntent.context)){
      check = true;
    }
    console.log("*********intent found in userQuestions:", check);
    console.log("next question:", nextIntent);

    if (!userQuestions[userId].has(nextIntent.context)) {
      currentContext[userId] = nextIntent.context;
      return { text: nextIntent.question };
    } 
  }
  else{
    currentContext[userId] = 'menu';
  }
  }
  // If all questions have been asked, present the menu
  currentContext[userId] = 'menu'; // Set context to menu
  return { text: "Now that I know more about you, I can perform various actions that cater to your preferences such as, I can search for a specific recipe, I can give you suggestions regarding ingredient substitution and provide you with various calorie counts for different items. Let me know what you'd like me to do."};
}

function handleTask(task, message, userId) {
  console.log('Handling task for user:', userId, 'Task:', task);
  switch (task) {
    case 'recipe_search':
      return handleRecipeSearch(userId, message);
    case 'ingredient_substitution':
      return handleIngredientSubstitution(userId, message);
    case 'nutritional_information':
      return handleNutritionalInformation(userId, message);
    //case 'meal_planning':
      //return handleMealPlanning(userId);
    //case 'cooking_tips':
      //return 'Always preheat your oven before baking.';
    case 'quit':
      return 'Goodbye! If you need further assistance, feel free to start a new conversation.';
    default:
      return "I'm not sure how to handle that task.";
  }
}

function handleRecipeSearch(userId, message) {
  console.log('Handling recipe search for user:', userId);
  const recipesRefresh = require('./recipes.json');
  const userRecipesList = userRecipes[userId] || [];
  const allRecipes = [...recipesRefresh, ...userRecipesList];
  const tokens = message.toLowerCase().split(' ');

  console.log("Handling MESSAGE:", message);
  console.log("UNFILTERED RECIPES:", allRecipes);

  const filteredRecipes = allRecipes.filter(recipe => {
    const recipeName = recipe.name.toLowerCase();
    const includesName = tokens.some(token => recipeName.includes(token));
    console.log(`Checking recipe name: ${recipeName}, includes: ${includesName}`);
    return includesName;
  });

  var includesDislikedIngredient = false;
  const filteredRecipesByIngredients = allRecipes.filter(recipe => {
    const includesIngredient = recipe.ingredients.some(ingredient => {
      const lowerCaseIngredient = ingredient.toLowerCase();
      const includesIngredient = tokens.some(token => lowerCaseIngredient.includes(token));
      console.log(`Checking ingredient: ${lowerCaseIngredient}, includes: ${includesIngredient}`);
      if(includesIngredient == true){
        if(ingCheck.trim().toLowerCase().includes(lowerCaseIngredient) || allergyCheck.trim().toLowerCase().includes(lowerCaseIngredient)){
          includesDislikedIngredient = true;
        }
      }
      return includesIngredient;
    });
    return includesIngredient;
  });

  console.log("FILTERED RECIPES:", filteredRecipes);
  console.log("FILTERED INGREDIENT RECIPES:", filteredRecipesByIngredients);
  console.log("IngCheck:", ingCheck);



  if(includesDislikedIngredient){
    return `I'm sorry, but considering your preferences, I am not supposed to give you recipes based on that.`
  }
  if (filteredRecipes.length > 0) {
    return `Here are some recipes based on your input: ${filteredRecipes.map(r => r.name).join(', ')}`;
  } else if (filteredRecipesByIngredients.length > 0) {
    return `Here are some recipes based on ingredients: ${filteredRecipesByIngredients.map(r => r.name).join(', ')}`;
  } else {
    return `My apologies, I cannot seem to find that recipe in my database. You can however use my recipe-saving functionality to save that recipe.`;
  }
}



function handleIngredientSubstitution(userId, message) {
  console.log('Handling ingredient substitution for user:', userId);
  const lowerCaseMessage = message.toLowerCase();
  for (const intent of ingredientSubstitutionIntents) {
    for (const keyword of intent.keywords) {
      if (lowerCaseMessage.includes(keyword)) {
        return intent.response;
      }
    }
  }
  return "My apologies, I cannot seem to find the substitute for that ingredient.";
}

function handleNutritionalInformation(userId, message) {
  console.log('Handling nutritional information for user:', userId);
  const lowerCaseMessage = message.toLowerCase();
  for (const info of nutritionalInformation) {
    if (lowerCaseMessage.includes(info.ingredient)) {
      return info.nutrition;
    }
  }
  return "My apologies, I cannot seem to find that item in my database.";
}

app.post('/saveRecipe', (req, res) => {
  const { userId, recipe } = req.body;
  console.log('Saving recipe for user:', userId, 'Recipe:', recipe);

  // Load existing recipes
  const recipes = JSON.parse(fs.readFileSync('./recipes.json', 'utf8'));

  // Generate new recipe ID
  const newId = recipes.length > 0 ? Math.max(...recipes.map(r => parseInt(r.id))) + 1 : 1;
  const newRecipe = {
    id: newId.toString(),
    userId: userId, // Add userId to the recipe
    name: recipe.name,
    ingredients: recipe.ingredients,
    nutrition: recipe.nutrition
  };

  // Add new recipe to the list
  recipes.push(newRecipe);

  // Save updated recipes
  fs.writeFileSync('./recipes.json', JSON.stringify(recipes, null, 2));

  res.status(200).send({ message: 'Recipe saved successfully' });
});


app.get('/getUserRecipes', (req, res) => {
  const { userId } = req.query;
  console.log('Fetching recipes for user:', userId);

  // Load existing recipes
  const recipes = JSON.parse(fs.readFileSync('./recipes.json', 'utf8'));
  // Filter recipes by userId
  //const userRecipes = recipes.filter(recipe => recipe.userId === userId);

  res.status(200).send(recipes);
});
