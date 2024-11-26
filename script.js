const apiKey = "";

const container = document.querySelector(".display");

const search = document.querySelector(".search-button");
const input = document.getElementById("city");

let sunrisedate;
let sunsetdate;
let latitude;
let longitude;
let point;
let aqiIndex;
let pollution;
let aqi;
let HTML;
let forecastHtml;
const hourlyContainer = document.getElementById("hourly-forecast");
const weatherContainer = document.querySelector(".weather-container");

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

function updateBackground(weatherCondition) {
  // Remove all existing classes
  weatherContainer.classList.remove("sunny", "cloudy", "rainy", "snowy");

  // Add the appropriate class based on the weather condition
  switch (weatherCondition.toLowerCase()) {
    case "clear":
      weatherContainer.classList.add("sunny");
      break;
    case "clouds":
      weatherContainer.classList.add("cloudy");
      break;
    case "rain":
    case "drizzle":
      weatherContainer.classList.add("rainy");
      break;
    case "snow":
      weatherContainer.classList.add("snowy");
      break;
    default:
      // Default to cloudy if condition is unknown
      weatherContainer.classList.add("cloudy");
  }
}

async function getAirPollution(lat, lon) {
  airAPI = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

  let html = ""; // Initialize html here
  try {
    const response = await fetch(airAPI);

    if (!response.ok) {
      throw new Error("Response not OK");
    }
    const data = await response.json();
    const aqi = Math.round(data.list[0].components.pm2_5);
    const aqiIndex = data.list[0].main.aqi;

    let pollution = "";
    switch (aqiIndex) {
      case 1:
        pollution = "Good";
        break;
      case 2:
        pollution = "Fair";
        break;
      case 3:
        pollution = "Moderate";
        break;
      case 4:
        pollution = "Poor";
        break;
      case 5:
        pollution = "Very Poor";
        break;
      default:
        pollution = "Unknown";
    }
    html = `
        <div class="air-quality">
          <h6>AQI</h6>
          <p id="aqi">${aqi} (${pollution})</p>
          <div class="progress">
            <div class="progress-done" style="left:${
              aqi < 75 ? aqi * 2.7 : 194
            }px"></div>
          </div>
        </div>
      `;
  } catch (error) {
    console.error(error);
    html = "<p>Error fetching air quality data.</p>";
  }
  return html; // Return the HTML content
}

function getHourlyWeather(city) {
  const forecastAPI = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  return fetch(forecastAPI)
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error("Response not OK");
      }
    })
    .then((data) => {
      const next24Hours = data.list.slice(0, 8); // Get the next 8 items (24 hours of forecast)
      let forecastHtml = ""; // Initialize the HTML string
      // Populate the hourly container
      next24Hours.forEach((item) => {
        const dateTime = new Date((item.dt + data.city.timezone) * 1000); // Convert timestamp to milliseconds
        const hour = dateTime.toISOString().slice(11, 16);
        const temperature = Math.round(item.main.temp); // Temperature in Celsius
        const iconCode = item.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;

        forecastHtml += `
          <div class="hourly-item">
            <span>${hour}</span>
            <img src="${iconUrl}" alt="Hourly Weather Icon">
            <span>${temperature}°C</span>
          </div>
        `;
      });

      return forecastHtml; // Return the generated HTML
    })
    .catch((err) => {
      console.error("Fetch error:", err);
    });
}
async function getWeather(city) {
  try {
    let weatherAPI;

    if (city.includes(",")) {
      const country = city.split(",")[1].trim();

      // Fetch country data
      const countriesRes = await fetch("countries.json");
      const countriesData = await countriesRes.json();

      // Match the country
      const match = countriesData.find(
        (item) => item.name === toTitleCase(country)
      );

      if (match) {
        weatherAPI = `https://api.openweathermap.org/data/2.5/weather?q=${
          city.split(",")[0]
        },${match.code}&appid=${apiKey}&units=metric`;
      } else {
        throw new Error("Please write correct country name");
      }
    } else {
      // Fallback for single-city queries
      weatherAPI = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    }

    // Fetch weather data
    const weatherRes = await fetch(weatherAPI);
    if (!weatherRes.ok) {
      throw new Error("Invalid city or API error");
    }
    const weatherData = await weatherRes.json();
    const weatherCondition = weatherData.weather[0].main; // e.g., "Clear", "Clouds", etc.

    // Update the background theme
    updateBackground(weatherCondition);

    // Process weather data
    const latitude = weatherData.coord.lat;
    const longitude = weatherData.coord.lon;
    const sunrise = new Date(
      (weatherData.sys.sunrise + weatherData.timezone) * 1000
    );
    const sunset = new Date(
      (weatherData.sys.sunset + weatherData.timezone) * 1000
    );
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

    // Construct HTML for weather data
    const weatherHTML = `
      <div class="city-container">
        <h3 id="city-name">${weatherData.name}, ${regionNames.of(
      weatherData.sys.country
    )}</h3>
        <img id="weather-icon" alt="" src="http://openweathermap.org/img/wn/${
          weatherData.weather[0].icon
        }@4x.png"/>
        <p id="temperature">${Math.round(weatherData.main.temp)}°C</p>
        <p id="description">${weatherData.weather[0].main}</p>
        <p id="feels-like">${Math.round(
          weatherData.main.temp_min
        )}°C / ${Math.round(
      weatherData.main.temp_max
    )}°C Feels Like ${Math.round(weatherData.main.feels_like)}°C</p>
        <div class="details">
            <div class="col">
                <img src="images/humidity.png" alt="">
                <div>
                    <p>Humidity</p>
                    <p id="humidity">%${weatherData.main.humidity}</p>
                </div>
            </div>
            <div class="col">
                <img src="images/wind.png" alt="">
                <div>
                    <p>Wind</p>
                    <p id="wind">${Math.round(weatherData.wind.speed)} km/h</p>
                </div>
            </div>
        </div>
        <div class="suntime">
          <p id="sunrise">Sunrise ${sunrise.toISOString().slice(11, 16)}</p>
          <p id="sunset">Sunset ${sunset.toISOString().slice(11, 16)}</p>
        </div>
      </div>`;

    // Fetch additional data and append to the container
    const airPollutionHTML = await getAirPollution(latitude, longitude);
    const hourlyForecastHTML = await getHourlyWeather(city);

    container.innerHTML = `
      ${weatherHTML}
      ${airPollutionHTML}
      <div id="hourly-forecast">${hourlyForecastHTML}</div>`;
    input.value = "";
  } catch (error) {
    // Handle errors gracefully
    alert(error.message || "An unexpected error occurred");
    console.error(error);
  }
}

input.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    getWeather(input.value);
  }
});

search.addEventListener("click", () => {
  getWeather(input.value);
});
