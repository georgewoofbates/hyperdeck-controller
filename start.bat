SET mypath=%~dp0
cd %mypath:~0,-1%
node index
start "" http://localhost:8999