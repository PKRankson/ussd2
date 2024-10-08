import express, { json } from "express";
import morgan from "morgan";

const app = express();
const sessions = {}; // In-memory session storage

// For logging to console
app.use(morgan("combined"));

// Define a custom token for logging request headers
morgan.token("req-headers", function (req, _res) {
  return JSON.stringify(req.headers);
});

app.use(json());

// Handle USSD requests
app.post("/ussd", (req, res) => {
  const { USERID, MSISDN, USERDATA, MSGTYPE, SESSIONID } = req.body;
  const sessionId = SESSIONID;

  // Initialize session if it doesn't exist
  if (!sessions[sessionId]) {
    sessions[sessionId] = { stage: 1, feeling: "", reason: "" };
  }

  let userSession = sessions[sessionId];

  // First screen
  if (MSGTYPE) {
    const message = `Welcome to ${USERID} application\nHow are you feeling today?\n1. Feeling fine\n2. Feeling frisky\n3. Not well`;
    userSession.stage = 1; // Set the stage to 1

    res.json({
      USERID,
      MSISDN,
      USERDATA,
      MSG: message,
      MSGTYPE: true,
    });
  } else {
    // Handle the interaction based on the current stage
    if (userSession.stage === 1) {
      let feeling = "";
      if (USERDATA === "1") {
        feeling = "Feeling fine";
      } else if (USERDATA === "2") {
        feeling = "Feeling frisky";
      } else if (USERDATA === "3") {
        feeling = "Not well";
      } else {
        // Invalid input, repeat the first screen
        res.json({
          USERID,
          MSISDN,
          USERDATA,
          MSG: "Invalid input, please try again.\n1. Feeling fine\n2. Feeling frisky\n3. Not well",
          MSGTYPE: true,
        });
        return;
      }

      userSession.feeling = feeling;
      userSession.stage = 2; // Move to stage 2

      const message = `Why are you ${feeling}?\n1. Money\n2. Relationship\n3. A lot`;
      res.json({
        USERID,
        MSISDN,
        USERDATA,
        MSG: message,
        MSGTYPE: true,
      });
    } else if (userSession.stage === 2) {
      let reason = "";
      if (USERDATA === "1") {
        reason = "because of money";
      } else if (USERDATA === "2") {
        reason = "because of relationship";
      } else if (USERDATA === "3") {
        reason = "because of a lot";
      } else {
        // Invalid input, repeat the second screen
        res.json({
          USERID,
          MSISDN,
          USERDATA,
          MSG: `Invalid input, please try again.\nWhy are you ${userSession.feeling}?\n1. Money\n2. Relationship\n3. A lot`,
          MSGTYPE: true,
        });
        return;
      }

      userSession.reason = reason;

      // Final message, summarize and end session
      const finalMessage = `You are ${userSession.feeling} ${userSession.reason}.`;

      res.json({
        USERID,
        MSISDN,
        USERDATA,
        MSG: finalMessage,
        MSGTYPE: false, // Final message, end session
      });

      // Delete the session after the interaction is completed
      delete sessions[sessionId];
    }
  }
});

app.listen(3000, () => {
  console.log("USSD app running on port 3000");
});
