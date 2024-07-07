// App.js
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  CssBaseline,
  AppBar,
  Toolbar,
  Switch,
  Tooltip,
  Avatar,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send"; // Corrected import statement
import MenuIcon from "@mui/icons-material/Menu";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import StoreRecipeForm from "./StoreRecipeForm";
import UserRecipes from "./UserRecipes";
import TypingIndicator from "./TypingIndicator"; // Import TypingIndicator
import "./App.css";
import { alignProperty } from "@mui/material/styles/cssUtils";

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.palette.mode === "dark" ? "#333" : "#fff",
    "& fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#444" : "#ccc",
    },
    "&:hover fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#666" : "#888",
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.mode === "dark" ? "#888" : "#1976d2",
    },
    "& input": {
      color: theme.palette.mode === "dark" ? "#fff" : "#000",
    },
  },
  flexGrow: 1, // Make the input field take up the remaining space
}));

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#333" : "#fff",
  padding: "8px",
  borderRadius: "4px",
  display: "flex", // Use flexbox
  alignItems: "center", // Align items vertically in the center
}));

const MessageBubble = styled(Box)(({ theme, from }) => ({
  maxWidth: "60%",
  padding: "8px 16px",
  borderRadius: "15px",
  backgroundColor:
    from === "user"
      ? theme.palette.primary.main
      : theme.palette.background.paper,
  color: from === "user" ? "#fff" : theme.palette.text.primary,
  marginBottom: "8px",
}));

const socket = io("https://dishmaster.azurewebsites.net"); //ensure it same with the server
//const socket = io("https://localhost:4000");

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId] = useState(
    () => `user_${Math.random().toString(36).substr(2, 9)}`
  );
  const [showStoreRecipeForm, setShowStoreRecipeForm] = useState(false);
  const [showUserRecipes, setShowUserRecipes] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false); // New state for typing indicator
  const [drawerOpen, setDrawerOpen] = useState(false); // State for Drawer
  const [drawerContent, setDrawerContent] = useState(null); // State for Drawer content
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socket.on("message", (message) => {
      console.log("Message received from server:", message);
      setIsTyping(true); // Show typing indicator
      setTimeout(() => {
        setIsTyping(false); // Hide typing indicator
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: message.text, from: "bot", name: "Dish Master" },
        ]);
      }, 1500); // Delay before showing the bot's message
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("message");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (input.trim()) {
      console.log("Sending message to server:", input);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, from: "user", name: "You" },
      ]);
      socket.emit("message", { userId, message: input });
      setInput("");
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const toggleStoreRecipeForm = () => {
    setDrawerContent(
      <StoreRecipeForm userId={userId} onRecipeStored={closeDrawer} />
    );
    setDrawerOpen(true);
  };

  const toggleUserRecipes = () => {
    setDrawerContent(<UserRecipes userId={userId} />);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: {
        main: darkMode ? "#90caf9" : "#1976d2",
      },
      secondary: {
        main: darkMode ? "#f48fb1" : "#d32f2f",
      },
      background: {
        default: darkMode ? "#121212" : "#f5f5f5",
        paper: darkMode ? "#1e1e1e" : "#ffffff",
      },
    },
    typography: {
      fontFamily: "Roboto, sans-serif",
    },
    shadows: Array(25).fill("none"),
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth="xl"
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "16px",
          position: "relative", // Ensure the container is positioned relative for absolute positioning of buttons
        }}
      >
        <Box
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            height: "90vh",
            maxWidth: "1200px",
            width: "100%",
            borderRadius: "8px",
            backgroundColor: darkMode
              ? "rgba(0, 0, 0, 0.6)"
              : "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Paper
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: "0",
              borderRadius: "8px",
              backgroundColor: "transparent",
              boxShadow: "none",
            }}
          >
            <AppBar
              position="static"
              color="primary"
              style={{ borderRadius: "8px 8px 0 0" }}
            >
              <Toolbar>
                <Switch checked={darkMode} onChange={toggleDarkMode}/>
                <Typography variant="h6" style={{ flexGrow: 1, textAlign: "center"}}>
                  Recipe Chatbot
                </Typography>
                
              </Toolbar>
            </AppBar>
            <Box
              style={{
                flexGrow: 1,
                overflowY: "auto",
                padding: "16px",
                backgroundImage: `url(${process.env.PUBLIC_URL}/food.png)`,
                backgroundSize: "auto",
                backgroundRepeat: "repeat",
                backgroundPosition: "center",
                borderRadius: "0 0 8px 8px",
              }}
            >
              {messages.map((msg, index) => (
                <Box
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.from === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  {msg.from === "bot" && (
                    <Tooltip title={msg.name} placement="top">
                      <Avatar style={{ marginRight: "8px" }}>B</Avatar>
                    </Tooltip>
                  )}
                  <MessageBubble from={msg.from}>
                    <Typography variant="body2" color="textSecondary">
                      {msg.name}
                    </Typography>
                    <Typography
                      variant="body1"
                      style={{ wordWrap: "break-word" }}
                    >
                      {msg.text}
                    </Typography>
                  </MessageBubble>
                  {msg.from === "user" && (
                    <Tooltip title={msg.name} placement="top">
                      <Avatar style={{ marginLeft: "8px" }}>U</Avatar>
                    </Tooltip>
                  )}
                </Box>
              ))}
              {isTyping && <TypingIndicator />} {/* Show typing indicator */}
              <div ref={messagesEndRef} />
            </Box>
            <StyledBox
              className="input-container"
              style={{ padding: "16px", borderRadius: "0 0 8px 8px" }}
            >
              <StyledTextField
                fullWidth
                variant="outlined"
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                InputProps={{
                  style: {
                    color: darkMode ? "#fff" : "#000",
                  },
                }}
              />
              <IconButton color="primary" onClick={sendMessage}>
                <SendIcon />
              </IconButton>
            </StyledBox>
          </Paper>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setDrawerOpen(true)}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 1000, // Ensure the button is above other elements
          }}
        >
          <MenuIcon />
        </Button>
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={closeDrawer}
          PaperProps={{
            style: {
              width: "80%",
              maxWidth: "400px",
            },
          }}
        >
          <Box
            role="presentation"
            style={{
              padding: "16px",
              height: "100%",
              backgroundColor: darkMode ? "#2c2c2c" : "#e0e0e0",
            }}
          >
            <IconButton
              onClick={closeDrawer}
              style={{ marginBottom: "16px" }}
            >
              <Typography variant="h6">Close</Typography>
            </IconButton>
            <Divider />
            <List>
              <ListItem button onClick={toggleStoreRecipeForm}>
                <ListItemText primary="Store Recipe Form" />
              </ListItem>
              <ListItem button onClick={toggleUserRecipes}>
                <ListItemText primary="Your Recipes" />
              </ListItem>
            </List>
            <Divider />
            {drawerContent}
          </Box>
        </Drawer>
      </Container>
    </ThemeProvider>
  );
}

export default App;
