chrome.runtime.onInstalled.addListener(() => {
  console.log("Reddit AutoMessenger installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "oauth2") {
    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${request.clientId}&response_type=code&state=${request.state}&redirect_uri=${request.redirectUri}&duration=temporary&scope=${request.scopes.join(',')}`;
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true
      },
      (redirectUrl) => {
        if (redirectUrl) {
          const urlParams = new URLSearchParams(new URL(redirectUrl).search);
          const code = urlParams.get("code");

          if (code) {
            // Exchange the authorization code for an access token
            fetch("https://www.reddit.com/api/v1/access_token", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${btoa(`${request.clientId}:${request.clientSecret}`)}`,
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: request.redirectUri,
              }),
            })
            .then(response => response.json())
            .then(data => {
              if (data.access_token) {
                chrome.storage.local.set({ accessToken: data.access_token }, () => {
                  sendResponse({ success: true, accessToken: data.access_token });
                });
              } else {
                console.error("No access token in response:", data);
                sendResponse({ success: false, error: "No access token in response" });
              }
            })
            .catch(error => {
              console.error("Error fetching access token:", error);
              sendResponse({ success: false, error });
            });
          } else {
            console.error("No authorization code in URL:", redirectUrl);
            sendResponse({ success: false, error: "No authorization code in URL" });
          }
        } else {
          console.error("Authorization failed or was canceled by the user.");
          sendResponse({ success: false, error: "Authorization failed or was canceled by the user." });
        }
      }
    );
    return true;  // Keep the message channel open for sendResponse
  }
});
