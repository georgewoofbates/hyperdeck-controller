//a function that pulls the weather from an api
async function getWeather() {
    //fetches the weather from the api
    await fetch('https://api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=your_api_key')
        //converts the data to json
        .then(response => response.json())
        //logs the data to the console
        .then(data => console.log(data));
}

getWeather()