document.getElementById('start').addEventListener('click', () => {
    const subreddits = document.getElementById('subreddits').value.split(',').map(s => s.trim());
    const criteria = document.getElementById('criteria').value.split(',').map(c => c.trim());
  
    chrome.storage.local.set({ subreddits, criteria }, () => {
      document.getElementById('status').innerText = 'Gathering usernames...';
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      });
    });
  });
  
  document.getElementById('download').addEventListener('click', () => {
    chrome.storage.local.get(['usernames'], ({ usernames }) => {
      if (usernames && usernames.length > 0) {
        const csvContent = "data:text/csv;charset=utf-8," + usernames.map(e => e).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "usernames.csv");
        document.body.appendChild(link); // Required for FF
        link.click();
        document.body.removeChild(link);
      } else {
        document.getElementById('status').innerText = 'No usernames to download.';
      }
    });
  });
  
  document.getElementById('csvUpload').addEventListener('change', handleCSVUpload);
  
  function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const content = e.target.result;
        const usernames = content.split('\n').map(line => line.trim()).filter(line => line);
        chrome.storage.local.set({ usernames }, () => {
          document.getElementById('usernames-preview').innerText = `Loaded ${usernames.length} usernames.`;
          document.getElementById('sendMessages').disabled = false;
        });
      };
      reader.readAsText(file);
    }
  }
  
  document.getElementById('sendMessages').addEventListener('click', () => {
    const selectedMessage = document.getElementById('message').value;
    const customMessage = document.getElementById('customMessage').value;
    const message = customMessage || selectedMessage;
  
    document.getElementById('sendStatus').innerText = 'Sending messages...';
  
    chrome.storage.local.get(['usernames'], ({ usernames }) => {
      if (usernames && usernames.length > 0) {
        chrome.storage.local.set({ message }, () => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.executeScript({
              target: { tabId: tabId },
              files: ['sendMessages.js']
            });
          });
        });
      } else {
        document.getElementById('sendStatus').innerText = 'No usernames available.';
      }
    });
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.statusUpdate) {
      document.getElementById('status').innerText = request.statusUpdate;
      if (request.statusUpdate === 'Completed') {
        document.getElementById('download').disabled = false;
      }
    }
    if (request.sendStatus) {
      document.getElementById('sendStatus').innerText = request.sendStatus;
    }
  });
  