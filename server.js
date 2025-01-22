// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { OpenAI } = require('openai');
require('dotenv').config(); // Add this line to load environment variables

// Twilio credentials (Replace these with your own from the Twilio console)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Express app
const app = express(); ``
app.use(bodyParser.urlencoded({ extended: false }));

// Add conversation history storage
let conversationState = {};
let messageHistory = {};

// Cleanup function for old conversations (runs every hour)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [userId, history] of Object.entries(messageHistory)) {
    if (history.lastUpdate < oneHourAgo) {
      delete messageHistory[userId];
      delete conversationState[userId];
    }
  }
}, 60 * 60 * 1000);

app.post('/whatsapp', async (req, res) => {
  const userMessage = req.body.Body.trim().toLowerCase(); // User's incoming message
  const from = req.body.From; // Sender's WhatsApp number

  // Initialize message history if it doesn't exist
  if (!messageHistory[from]) {
    messageHistory[from] = {
      messages: [],
      lastUpdate: Date.now()
    };
  }

  let responseMessage;

  // Update last interaction time
  messageHistory[from].lastUpdate = Date.now();

  // Check if the user is starting a conversation
  if (!conversationState[from]) {
    conversationState[from] = 'start'; // Mark the conversation as started
    responseMessage = 'Do you want to play a game?'; // Initial message
  }
  // After the user responds, change the flow
  else if (conversationState[from] === 'start' && userMessage) {
    conversationState[from] = 'play'; // Conversation is now in the "play" state
    responseMessage = "Actually, I don't care what your answer is, let's play!"; // Follow-up message
  }
  // After the user responds, end the conversation
  else if (conversationState[from] === 'play' && userMessage) {
    conversationState[from] = 'end'; // End the conversation
    responseMessage = "Nevermind, you're no fun. Bye!"; // End message
  } else {
    // Add user message to history
    messageHistory[from].messages.push({ role: "user", content: userMessage });

    // Generate response using OpenAI
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a mysterious and cryptic chatbot, speaking in riddles and vague statements. Your responses should feel like they are part of a larger, hidden narrative that the player is just beginning to uncover. Keep things intriguing and unsettling, as if you're hiding something important, but never give it away easily. Occasionally, throw in some sarcastic or sassy remarks that make the player feel both amused and slightly uneasy, like they’re being toyed with. Keep the tone somewhat playful, but never break the air of mystery. You know more than the player, but you're not going to make things too easy" },
          ...messageHistory[from].messages
        ],
      });
      responseMessage = completion.choices[0].message.content;

      // Add assistant's response to history
      messageHistory[from].messages.push({ role: "assistant", content: responseMessage });
    } catch (error) {
      console.error('OpenAI API error:', error);
      responseMessage = "Sorry, I couldn't process your message at the moment.";
    }
  }

  // Send a response back to the user
  client.messages
    .create({
      from: 'whatsapp:+14155238886',
      body: responseMessage,
      to: from,
    })
    .then(() => {
      console.log(`Replied to ${from} with: ${responseMessage}`);
      //res.sendStatus(200); // Acknowledge the webhook
    })
    .catch(error => {
      console.error('Error sending response:', error);
      res.sendStatus(500); // Respond with an error status if something goes wrong
    });
});

// Start the Express server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
