document.getElementById("start").addEventListener("click", () => {
  const subreddits = document
    .getElementById("subreddits")
    .value.split(",")
    .map((s) => s.trim());
  const criteria = document
    .getElementById("criteria")
    .value.split(",")
    .map((c) => c.trim());

  chrome.storage.local.set({ subreddits, criteria }, () => {
    document.getElementById("status").innerText = "Gathering usernames...";
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js"],
      });
    });
  });
});

document.getElementById("download").addEventListener("click", () => {
  chrome.storage.local.get(["usernames"], ({ usernames }) => {
    if (usernames && usernames.length > 0) {
      const csvContent = "data:text/csv;charset=utf-8," + usernames.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "usernames.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      document.getElementById("status").innerText = "No usernames to download.";
    }
  });
});

document
  .getElementById("csvUpload")
  .addEventListener("change", handleCSVUpload);

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const content = e.target.result;
      const usernames = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      chrome.storage.local.set({ usernames }, () => {
        document.getElementById(
          "usernames-preview"
        ).innerText = `Loaded ${usernames.length} usernames.`;
        document.getElementById("sendMessages").disabled = false;
      });
    };
    reader.readAsText(file);
  }
}

document.getElementById("sendMessages").addEventListener("click", () => {
  chrome.storage.local.get(["accessToken"], async ({ accessToken }) => {
    if (!accessToken) {
      await initiateOAuthFlow();
      chrome.storage.local.get(["accessToken"], ({ accessToken }) => {
        if (accessToken) {
          sendMessages(accessToken);
        } else {
          document.getElementById("sendStatus").innerText =
            "No access token available.";
        }
      });
    } else {
      sendMessages(accessToken);
    }
  });
});

async function initiateOAuthFlow() {
  console.log("Initiating OAuth flow...");
  const clientId = "OzSQsqXVwJVCJk8Hwa3avw";
  const clientSecret = "qGdEseB3KLnrRF9cyQ5QHrhJfU7F5w";
  const state = "random_state_string";
  const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/oauth2`;
  const scopes = ["identity", "privatemessages"];

  console.log(
    `Authorization URL: https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=temporary&scope=${scopes.join(
      ","
    )}`
  );

  chrome.runtime.sendMessage({
    type: "oauth2",
    clientId,
    clientSecret,
    state,
    redirectUri,
    scopes,
  });
}

document.getElementById("sendMessages").addEventListener("click", () => {
  console.log("Send Messages button clicked.");
  chrome.storage.local.get(["accessToken"], async ({ accessToken }) => {
    console.log("Current access token:", accessToken);
    if (!accessToken) {
      await initiateOAuthFlow();
      chrome.storage.local.get(["accessToken"], ({ accessToken }) => {
        console.log("Access token after OAuth flow:", accessToken);
        if (accessToken) {
          sendMessages(accessToken);
        } else {
          document.getElementById("sendStatus").innerText =
            "No access token available.";
        }
      });
    } else {
      sendMessages(accessToken);
    }
  });
});

function sendMessages(accessToken) {
  const selectedMessage = document.getElementById("message").value;
  const customMessage = document.getElementById("customMessage").value;
  const message = customMessage || selectedMessage;

  document.getElementById("sendStatus").innerText = "Sending messages...";

  chrome.storage.local.get(["usernames"], async ({ usernames }) => {
    if (usernames && usernames.length > 0) {
      const allMessagesSent = await sendMessagesToUsers(
        usernames,
        message,
        accessToken
      );
      if (allMessagesSent) {
        document.getElementById("sendStatus").innerText =
          "Messages sent successfully!";
      } else {
        document.getElementById("sendStatus").innerText =
          "Failed to send messages.";
      }
    } else {
      document.getElementById("sendStatus").innerText =
        "No usernames available.";
    }
  });
}

async function sendMessagesToUsers(usernames, message, accessToken) {
  let allMessagesSent = true;

  for (const username of usernames) {
    try {
      const response = await fetch(`https://oauth.reddit.com/api/compose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${accessToken}`,
        },
        body: new URLSearchParams({
          api_type: "json",
          subject: "Message from Reddit AutoMessenger",
          text: message,
          to: username,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message to ${username}`);
      }
    } catch (error) {
      console.error(error);
      allMessagesSent = false;
    }
  }

  return allMessagesSent;
}
