const sendMessagesToUsers = async (usernames, message) => {
    for (const username of usernames) {
      try {
        const response = await fetch(`https://www.reddit.com/api/compose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${YOUR_ACCESS_TOKEN}` // Replace with your actual access token
          },
          body: new URLSearchParams({
            api_type: 'json',
            subject: 'Message from Reddit AutoMessenger',
            text: message,
            to: username
          })
        });
  
        if (!response.ok) {
          throw new Error(`Failed to send message to ${username}`);
        }
  
        chrome.runtime.sendMessage({ sendStatus: `Message sent to ${username}` });
      } catch (error) {
        chrome.runtime.sendMessage({ sendStatus: `Error: ${error.message}` });
      }
    }
  
    chrome.runtime.sendMessage({ sendStatus: 'All messages sent.' });
  };
  
  chrome.storage.local.get(['usernames', 'message'], ({ usernames, message }) => {
    if (usernames && message) {
      sendMessagesToUsers(usernames, message);
    }
  });
  