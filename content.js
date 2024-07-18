console.log("Content script loaded.");

// Function to gather usernames based on specified criteria
function gatherUsernames() {
  const criteria = new Set(chrome.storage.local.get("criteria"));
  const usernames = new Set();

  // Select all author elements
  document.querySelectorAll(".author").forEach(author => {
    const username = author.textContent.trim();
    // Check if the post or comment content includes any of the criteria
    const content = author.closest(".entry").querySelector(".usertext-body").textContent;
    if (Array.from(criteria).some(criterion => content.includes(criterion))) {
      usernames.add(username);
    }
  });

  return Array.from(usernames);
}

// Run the gatherUsernames function and store the result
chrome.storage.local.get(["usernames"], ({ usernames }) => {
  const gatheredUsernames = gatherUsernames();
  const allUsernames = usernames ? [...new Set([...usernames, ...gatheredUsernames])] : gatheredUsernames;
  chrome.storage.local.set({ usernames: allUsernames }, () => {
    chrome.runtime.sendMessage({ type: "usernamesGathered", usernames: allUsernames });
  });
});
