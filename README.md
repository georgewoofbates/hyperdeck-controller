# Hyperdeck Controller

Hyperdeck Controller is a simple Node based local controller for using the Blackmagic Hyperdeck Mini as a layout solution for broadcast. It enables users to select clips, control playback and get duration countdowns. It's based on NodeJS, ExpressJS and Bootstrap front end.

## Installation

To use Hyperdeck Controller, first clone the GitHub repository to your local machine.

Install the Node dependancies by running ```npm install``` in the root directory.

To set your Hyperdeck IP address, change it in the public/index.js in the Websocket open command

Then start the ExpressJS server with Node ```node index``` or on Windows just run the ```start.bat``` file

Navigate your browser to localhost:8999 and the controller will be available.



## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
