// references
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");

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
  

const API_KEY = "4740b6e03a0c38aa982463a7fac33e1e";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

async function fetchWeather(city) {

    city = city.trim(); // Trim whitespace to avoid issues with empty strings
    // Validate city input    
    if (!city || city.length === 0) {
        alert("Please enter a valid city name.");
        return;
    }
    try {
        
        const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);
        const data = await response.json();

        if (response.ok && data.name) {
            saveRecentCity(data.name);
            updateCurrentWeather(data);
        } else {
            console.error("Error fetching weather:", data.message);
            alert(`City not found: "${city}". Please enter a valid city name.`);
        }
    } 
    catch (error) {
        console.error("Error fetching weather:", error);
        alert("Network or API error occurred. Please try again later.");
    }
}

function updateCurrentWeather(data) {
    // Extract weather info
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
    document.getElementById("temperature").innerHTML = `<strong>Temperature:</strong> ${temperature}`;
    document.getElementById("wind").textContent = wind;
    document.getElementById("humidity").textContent = humidity;
    const iconImg = document.getElementById("weather-icon");
    iconImg.src = iconUrl;
    iconImg.alt = data.weather[0].description;

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
        } catch (error) {
            alert(error.message);
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
    li.className ="flex justify-between items-center px-3 py-2 hover:bg-teal-700  transition-colors cursor-pointer";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = city;
    nameSpan.classList.add("cursor-pointer");
    li.addEventListener("click", () => {
      fetchWeather(city);
    });      

    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.className = "text-red-700 hover:text-red-900 hover:cursor-pointer text-sm ml-2";
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
});
  
