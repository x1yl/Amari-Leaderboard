let data = []; // Stores all fetched user data from the API
let itemsPerPage = 50; // Number of items to display per scroll
let currentEndIndex = 0; // Track the end of the current displayed range
let filteredData = []; // Store filtered data when searching

// Fetch all data at once and store it in the data variable
async function fetchData() {
  try {
    const response = await fetch("https://proxy.life23243.workers.dev/?https://amaribot.com/api/v1/guild/raw/leaderboard/835294705074962472?=", {
      "headers": {
        "Authorization": "5b735f93f73e784767619e43.4ed8a6.0d4c143979b040e440239af4560"
      }
    }); // Your endpoint here
    const result = await response.json();
    data = result.data; // Use `data` from the response object
    filteredData = data; // Initially, filtered data is the entire dataset
    renderUsers(); // Render initial set of users
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Render users in the current range
// Render users in the current range
function renderUsers() {
  const userList = document.getElementById('user-list');

  // Render the next chunk of users
  for (let i = currentEndIndex; i < currentEndIndex + itemsPerPage && i < filteredData.length; i++) {
    const user = filteredData[i];
    const userDiv = document.createElement('div');
    userDiv.className = 'user';
    userDiv.textContent = `${data.indexOf(user) + 1}. ${user.username} - Level: ${user.level}, EXP: ${user.exp}`;
    userList.appendChild(userDiv);
  }

  // Update end index
  currentEndIndex += itemsPerPage;
}


// Infinite scroll functionality
window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
    renderUsers(); // Render more users as the user scrolls down
  }
});

// Search function
document.getElementById('search').addEventListener('input', event => {
  const query = event.target.value.toLowerCase();
  const userList = document.getElementById('user-list');
  userList.innerHTML = ''; // Clear current user list
  currentEndIndex = 0; // Reset index for new filtered results

  // Filter data based on the search query
  if (query) {
    filteredData = data.filter(user => user.username.toLowerCase().includes(query));
  } else {
    filteredData = data; // If query is empty, use the entire dataset
  }

  renderUsers(); // Render filtered users
});

// Initial data load
fetchData();
