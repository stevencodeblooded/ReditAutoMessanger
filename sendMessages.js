const sendMessagesToUsers = async (usernames, message, accessToken) => {
  console.log('ACCESS TOKEN', accessToken);
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
};
