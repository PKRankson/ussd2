import express from "express";
import morgan from "morgan";

const app = express();
const sessions = {}; 

// For logging to console
app.use(morgan("combined"));

app.use(express.json());

// Helper function to process USSD input string
function processUssdInput(ussdString) {
  const parts = ussdString.replace("#", "").split("*"); // Remove # and split by *
  return parts.slice(3); // Remove first three parts (*920*1801) and return remaining choices
}

// Handle USSD requests
app.post("/ussd", (req, res) => {
  const { USERID, MSISDN, USERDATA, MSGTYPE, SESSIONID } = req.body;
  const sessionId = SESSIONID;

  // Initialize session if it doesn't exist
  if (!sessions[sessionId]) {
    sessions[sessionId] = { stage: 1, feeling: "", reason: "" };
  }

  let userSession = sessions[sessionId];

  // Check if USERDATA contains a full or partial USSD string like "*920*1801*1#" or "*920*1801*1*1#"
  const inputs = processUssdInput(USERDATA); 

  // Case 3: If there is only one input (e.g., "*920*1801*1#"), skip to the second screen
  if (inputs.length === 1) {
    const feelingChoice = inputs[0]; 

    // Process feeling choice
    if (feelingChoice === "1") {
      userSession.feeling = "feeling fine";
    } else if (feelingChoice === "2") {
      userSession.feeling = "feeling frisky";
    } else if (feelingChoice === "3") {
      userSession.feeling = "not well";
    } else {
      console.log (({ USERID, MSISDN, MSG: "Invalid input for feeling. Please try again.", MSGTYPE: true }));
      return res.json({
        USERID,
        MSISDN,
        MSG: "Invalid input for feeling. Please try again.\nHow are you feeling today?\n1. Feeling fine\n2. Feeling frisky\n3. Not well",
        MSGTYPE: true
      });
    }

    // Move directly to the second screen (reason selection)
    userSession.stage = 2; 
    const message =  `Why are you ${userSession.feeling}?\n1. Money\n2. Relationship\n3. A lot`
    console.log(req.body);
    return res.json({
      USERID,
      MSISDN,
      MSG: message,
      MSGTYPE: true 
    });
  }

  // Case 2: Full USSD string with pre-selected options ("*920*1801*1*1#")
  else if (inputs.length >= 2) {
    const feelingChoice = inputs[0]; 
    const reasonChoice = inputs[1];  
    
    if (feelingChoice === "1") {
      userSession.feeling = "feeling fine";
    } else if (feelingChoice === "2") {
      userSession.feeling = "feeling frisky";
    } else if (feelingChoice === "3") {
      userSession.feeling = "not well";
    } else {
      console.log(({ USERID, MSISDN, USERDATA, MSG:"Invalid input for feeling.", MSGTYPE: true }));
      return res.json({
        USERID,
        MSISDN,
        MSG: "Invalid input for feeling. Please try again.n\nHow are you feeling today?\n1. Feeling fine\n2. Feeling frisky\n3. Not well",
        MSGTYPE: true
      });
    }

    if (reasonChoice === "1") {
      userSession.reason = "because of money";
    } else if (reasonChoice === "2") {
      userSession.reason = "because of relationship";
    } else if (reasonChoice === "3") {
      userSession.reason = "because of a lot";
    } else {
      console.log(({ USERID, MSISDN, USERDATA, MSG: "Invalid input for reason. Please try again.", MSGTYPE: true }))
      return res.json({
        USERID,
        MSISDN,
        MSG: `Invalid input for reason. Please try again.\nWhy are you ${userSession.feeling}?\n1. Money\n2. Relationship\n3. A lot`,
        MSGTYPE: true
      });
    }

    // Final message, summarize and end session
    const finalMessage = `You are ${userSession.feeling} ${userSession.reason}.`
    console.log(req.body);
      return res.json({
      USERID,
      MSISDN,
      MSG: finalMessage,
      MSGTYPE: false 
    });
  
    delete sessions[sessionId];
  }
  // Case 1: Step-by-step interaction ("*920*1801#")
  else if (MSGTYPE) {
    
    const message = `Welcome to ${USERID} application\nHow are you feeling today?\n1. Feeling fine\n2. Feeling frisky\n3. Not well`
    userSession.stage = 1; 
    console.log(req.body);
    return res.json({
      USERID,
      MSISDN,
      MSG: message,
      MSGTYPE: true, 
    });
  } else {
    // Handle the interaction based on the current stage
    if (userSession.stage === 1) {
      let feeling = "";
      if (USERDATA === "1") {
        feeling = "feeling fine";
      } else if (USERDATA === "2") {
        feeling = "feeling frisky";
      } else if (USERDATA === "3") {
        feeling = "not well";
      } else {

        console.log(({ USERID, MSISDN, MSG: "Invalid input, please try again", MSGTYPE: true }));
        
        return res.json({
          USERID,
          MSISDN,
          MSG: "Invalid input, please try again.\nHow are you feeling today?\n1. Feeling fine\n2. Feeling frisky\n3. Not well",
          MSGTYPE: true,
        });
      }

      userSession.feeling = feeling;
      userSession.stage = 2; 

      const message = `Why are you ${feeling}?\n1. Money\n2. Relationship\n3. A lot`
      res.json({
        USERID,
        MSISDN,
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

        console.log(({ USERID, MSISDN, MSG: "Invalid input, please try again", MSGTYPE: true }));

        return res.json({
          USERID,
          MSISDN,
          MSG: `Invalid input, please try again.\nWhy are you ${userSession.feeling}?\n1. Money\n2. Relationship\n3. A lot`,
          MSGTYPE: true,
        });
        return;
      }

      userSession.reason = reason;

      // Final message, summarize and end session
      const finalMessage = `You are ${userSession.feeling} ${userSession.reason}.`

      res.json({
        USERID,
        MSISDN,
        MSG: finalMessage,
        MSGTYPE: false, 
      });

      delete sessions[sessionId];
    }
  }
});

app.listen(3000, () => {
  console.log("USSD app running on port 3000");
});