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

// Endpoint to handle incoming WhatsApp messages
app.post('/whatsapp', (req, res) => {
  const userMessage = req.body.Body.trim().toLowerCase(); // Get the user's message
  const from = req.body.From; // Get the sender's phone number

  let responseMessage;

  // Simple logic based on user input
  if (userMessage === 'does this work?') {
    responseMessage = 'Okay, now I can tell it works!';
  } else {
    responseMessage = "I didn't understand that. Can you ask 'Does this work?'";
  }

  // Send a response back to the user via WhatsApp
  client.messages
    .create({
      from: 'whatsapp:+14155238886',  // This is your Twilio sandbox WhatsApp number
      body: responseMessage,         // The message to send
      to: from                        // Send to the user who sent the message
    })
    .then(() => {
      console.log(`Replied to ${from} with: ${responseMessage}`);
      res.sendStatus(200);  // Acknowledge the Twilio webhook
    })
    .catch(error => {
      console.error('Error sending response:', error);
      res.sendStatus(500);  // Error handling if something goes wrong
    });
});

// Start the Express server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
