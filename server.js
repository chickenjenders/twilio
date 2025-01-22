// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
require('dotenv').config(); // Add this line to load environment variables

// Twilio credentials (Replace these with your own from the Twilio console)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Initialize Express app
const app = express(); ``
app.use(bodyParser.urlencoded({ extended: false }));

let conversationState = {};

app.post('/whatsapp', (req, res) => {
  const userMessage = req.body.Body.trim().toLowerCase(); // User's incoming message
  const from = req.body.From; // Sender's WhatsApp number

  let responseMessage;

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
      res.sendStatus(200); // Acknowledge the webhook
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
