// references
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

function showLoader() {
  const loader = document.getElementById("loading-spinner");
  loader.classList.remove("hidden");
  loader.classList.add("flex");
  loader.classList.add("items-center");
  loader.classList.add("justify-center");
}

function hideLoader() {
  const loader = document.getElementById("loading-spinner");
  loader.classList.add("hidden");
  loader.classList.remove("flex");
}

// ------------event handler for search button on UI------------------
searchButton.addEventListener("click", () => {
  const city = searchInput.value.trim();

  if (city === "") {
    alert("Please enter a city name.");
    return;
  }

  fetchWeather(city);
  searchInput.value = "";
});

// -----------event handler for search button on keyboard **enter key**--------------
// This allows users to press Enter to search, enhancing usability
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // optional, but avoids accidental form submits
    searchButton.click();
  }
});

// -------------------search input suggestions-------------------
const suggestionsList = document.getElementById("suggestions-list");

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();

  if (query.length < 2) {
    suggestionsList.classList.add("hidden");
    return;
  }
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        query
      )}&limit=5&appid=${API_KEY}`
    );
    const suggestions = await response.json();
    renderSuggestions(suggestions);
  } catch (error) {
    console.error("Failed to fetch city suggestions:", error);
    suggestionsList.classList.add("hidden");
  }
});

function renderSuggestions(suggestions) {
  suggestionsList.innerHTML = "";

  if (!suggestions || suggestions.length === 0) {
    suggestionsList.classList.add("hidden");
    return;
  }

  suggestions.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = `${city.name}, ${city.country}`;
    li.className = "px-4 py-2 hover:bg-teal-100 cursor-pointer";
    li.addEventListener("click", () => {
      searchInput.value = city.name;
      suggestionsList.classList.add("hidden");
      fetchWeather(city.name);
    });

    suggestionsList.appendChild(li);
  });

  suggestionsList.classList.remove("hidden");
}

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!suggestionsList.contains(e.target) && e.target !== searchInput) {
    suggestionsList.classList.add("hidden");
  }
});

const API_KEY = "4740b6e03a0c38aa982463a7fac33e1e";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

async function fetchWeather(city) {
  city = city.trim(); // Trim whitespace to avoid issues with empty strings
  // Validate city input
  if (!city || city.length === 0) {
    alert("Please enter a valid city name.");
    return;
  }

  showLoader(); // Show loader while fetching data
  searchInput.disabled = true; // Disable input to prevent multiple requests

  try {
    const response = await fetch(
      `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();

    if (response.ok && data.name) {
      saveRecentCity(data.name);
      updateCurrentWeather(data);
      await fetchForecast(data.name);
    } else {
      console.error("Error fetching weather:", data.message);
      alert(`City not found: "${city}". Please enter a valid city name.`);
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    alert("Network or API error occurred. Please try again later.");
  } finally {
    hideLoader(); // Hide loader after fetching data
    searchInput.disabled = false; // Re-enable input
    searchInput.value = ""; // Clear input field
  }
}

//-------------------Update background based on weather condition-------------------
// This function updates the background image based on the weather condition text
function updateBackground(conditionText, iconCode) {
  const body = document.body;
  const condition = conditionText.toLowerCase();
  const isday = iconCode.endsWith("d"); // Check if the icon code indicates daytime
  let image = "default.jpg";

  if (condition.includes("clear") || condition.includes("sun")) {
    image = isday ? "sunny.jpg" : "clear_night.jpg";
  } else if (condition.includes("cloud")) {
    image = isday ? "cloudy.webp" : "cloudy_night.jpg";
  } else if (condition.includes("rain") || condition.includes("drizzle")) {
    image = isday ? "rainy.jpg" : "rainy_night.jpg";
  } else if (condition.includes("storm") || condition.includes("thunder")) {
    image = isday ? "storm.jpg" : "storm_night.jpg";
  } else if (condition.includes("snow")) {
    image = isday ? "snow.jpg" : "snow_night.jpg";
  } else if (condition.includes("mist") || condition.includes("fog")) {
    image = isday ? "mist.jpg" : "fog_night.jpg";
  }

  body.style.backgroundImage = `url('../images/backgrounds_body/${image}')`;
  body.style.backgroundSize = "cover";
  body.style.backgroundPosition = "center";
  body.style.transition = "background-image 0.5s ease-in-out";
}

//-------------------update message based on weather condition-------------------
function getFriendlyMessage(condition) {
  const conditionText = condition.toLowerCase();

  if (conditionText.includes("clear") || conditionText.includes("sun")) {
    return "It's a bright and sunny day! 🌞 Don't forget your sunglasses!";
  } else if (conditionText.includes("cloud")) {
    return "A bit cloudy today. ☁️ Might be cozy to stay in!";
  } else if (
    conditionText.includes("rain") ||
    conditionText.includes("drizzle")
  ) {
    return "It's raining! ☔ Grab your umbrella and stay dry!";
  } else if (
    conditionText.includes("storm") ||
    conditionText.includes("thunder")
  ) {
    return "Looks stormy out there! ⚡ Stay safe and indoors!";
  } else if (conditionText.includes("snow")) {
    return "Snowy vibes today! ❄️ Time for some hot cocoa!";
  } else if (conditionText.includes("mist") || conditionText.includes("fog")) {
    return "It's quite misty! 🌫️ Drive carefully!";
  } else if (
    conditionText.includes("cold") ||
    conditionText.includes("freeze")
  ) {
    return "Brrr... It's cold! 🧥 Bundle up!";
  } else if (conditionText.includes("hot") || conditionText.includes("heat")) {
    return "It's quite hot today! 🥵 Stay hydrated!";
  }

  return "Stay tuned for more weather updates! 🌦️";
}

//-------------------Update current weather information on UI-------------------
function updateCurrentWeather(data) {
  // Check if data contains weather information
  if (!data.weather || !data.weather[0]) {
    alert("Weather information is unavailable for this city.");
    hideLoader();
    searchInput.disabled = false;
    return;
  }
  // Then Extract weather info
  const location = `${data.name}, ${data.sys.country}`;
  const date = new Date(data.dt * 1000).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const temperature = Math.round(data.main.temp) + "°C";
  const wind = Math.round(data.wind.speed * 3.6) + " km/h"; // Convert m/s to km/h
  const humidity = data.main.humidity + "%";
  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

  // Update DOM
  document.getElementById("location").textContent = location;
  document.getElementById("date").textContent = date;
  document.getElementById(
    "temperature"
  ).innerHTML = `<strong>Temperature:</strong> ${temperature}`;
  document.getElementById("wind").textContent = wind;
  document.getElementById("humidity").textContent = humidity;
  const iconImg = document.getElementById("weather-icon");
  iconImg.src = iconUrl;
  iconImg.alt = data.weather[0].description;
  updateBackground(data.weather[0].main, iconCode); // or .description

  // Friendly message
  const message = getFriendlyMessage(
    data.weather[0].description || data.weather[0].main
  );
  document.getElementById("weather-message").textContent = message;

  // Show the weather card if hidden
  document.getElementById("current-weather").classList.remove("hidden");
}

// -----------------Current location button functionality-----------------------
const currentLocationButton = document.getElementById("current-location");

currentLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  showLoader(); // Show loader while fetching location

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
          throw new Error("Weather data not available for your location.");
        }
        const data = await response.json();
        updateCurrentWeather(data);

        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );

        if (!forecastResponse.ok) {
          throw new Error("Forecast data not available for your location.");
        }
        fetchForecast(data.name);
      } catch (error) {
        alert(error.message);
      } finally {
        hideLoader(); // Hide loader after fetching data
        searchInput.disabled = false; // Re-enable input
      }
    },
    (error) => {
      alert("Unable to retrieve your location.");
      console.error(error);
    }
  );
});

// -----------------Recent cities dropdown functionality-----------------------
const recentCitiesContainer = document.getElementById(
  "recent-cities-container"
);
const recentCitiesList = document.getElementById("recent-cities-list");
const clearCitiesButton = document.getElementById("clear-cities");

function loadRecentCities() {
  const cities = JSON.parse(localStorage.getItem("recentCities")) || [];

  if (cities.length === 0) {
    recentCitiesContainer.classList.add("hidden");
    return;
  }

  recentCitiesList.innerHTML = "";

  cities.forEach((city) => {
    const li = document.createElement("li");
    li.className =
      "flex justify-between items-center px-3 py-2 hover:bg-teal-700  transition-colors cursor-pointer";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = city;
    nameSpan.classList.add("cursor-pointer");
    li.addEventListener("click", () => {
      fetchWeather(city);
    });

    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.className =
      "text-red-700 hover:text-red-900 hover:cursor-pointer text-sm ml-2";
    delBtn.addEventListener("click", (event) => {
      event.stopPropagation(); // <-- stops the click from bubbling up to the li
      removeRecentCity(city);
    });

    li.appendChild(nameSpan);
    li.appendChild(delBtn);
    recentCitiesList.appendChild(li);
  });

  recentCitiesContainer.classList.remove("hidden");
}

function saveRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  cities = cities.filter((c) => c.toLowerCase() !== city.toLowerCase());
  cities.unshift(city);
  localStorage.setItem("recentCities", JSON.stringify(cities));
  loadRecentCities();
}

function removeRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem("recentCities")) || [];
  cities = cities.filter((c) => c.toLowerCase() !== city.toLowerCase());
  localStorage.setItem("recentCities", JSON.stringify(cities));
  loadRecentCities();
}

clearCitiesButton.addEventListener("click", () => {
  localStorage.removeItem("recentCities");
  loadRecentCities();
});

document.addEventListener("DOMContentLoaded", () => {
  loadRecentCities();
  updateBackground("default", "01d"); // shows default.jpg on initial load
});

// -----------------forecast functionality-----------------------
async function fetchForecast(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      city
    )}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      console.error("Forecast fetch failed:", data.message);
      return;
    }
    const dailyForecasts = getOneForecastPerDay(data.list);
    renderForecastCards(dailyForecasts);
  } catch (error) {
    console.error("Error fetching forecast:", error);
  }
}

//helper function to get one forecast per day
function getOneForecastPerDay(list) {
  const map = new Map();

  list.forEach((entry) => {
    const date = new Date(entry.dt * 1000);
    const day = date.toDateString();
    const hour = date.getHours();

    // Prefer forecast closest to midday
    if (!map.has(day) || (hour >= 11 && hour <= 13)) {
      map.set(day, entry);
    }
  });

  return Array.from(map.values()).slice(0, 5);
}

// Function to render forecast cards
function renderForecastCards(forecastList) {
  const container = document.getElementById("forecast-container");
  const forecastHeading = document.getElementById("forecast-heading");
  container.innerHTML = ""; // Clear previous forecast

  if (!forecastList || forecastList.length === 0) {
    container.innerHTML =
      "<p class='text-center bg-white/90 backdrop-blur-md text-black'>No forecast data available.</p>";
    return;
  }
  forecastList.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      weekday: "short",
    });
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;
    const temp = Math.round(item.main.temp);
    const wind = Math.round(item.wind.speed * 3.6);
    const humidity = item.main.humidity;

    const card = document.createElement("div");
    card.className =
      "bg-white/80 backdrop-blur-md text-black rounded-2xl shadow-md p-4 flex flex-col items-center space-y-2";

    card.innerHTML = `
        <p class="text-sm font-semibold">${day}</p>
        <div class="w-16 h-16 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm shadow">
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" class="w-10 h-10">
        </div>
        <p class="text-sm">🌡 ${temp}°C</p>
        <p class="text-sm">💨 ${wind} km/h</p>
        <p class="text-sm">💧 ${humidity}%</p>
        `;

    container.appendChild(card);
  });
  forecastHeading.classList.remove("hidden");
}
