const fetchUsernames = async (subreddits, criteria) => {
    let usernames = new Set();
  
    for (const subreddit of subreddits) {
      for (const criterion of criteria) {
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${criterion}&restrict_sr=on&sort=relevance&t=all`;
  
        const response = await fetch(url);
        const data = await response.json();
        
        data.data.children.forEach(post => {
          usernames.add(post.data.author);
        });
      }
    }
  
    return Array.from(usernames);
  };
  
  chrome.storage.local.get(['subreddits', 'criteria'], async ({ subreddits, criteria }) => {
    if (subreddits && criteria) {
      const usernames = await fetchUsernames(subreddits, criteria);
  
      chrome.storage.local.set({ usernames }, () => {
        chrome.runtime.sendMessage({ statusUpdate: 'Completed' });
      });
    }
  });
  