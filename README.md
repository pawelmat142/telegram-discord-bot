## Description

Bot for automatically sending messages from a private telegram channel to a discord channel. Build with NestJS

## Installation

* open new project dictionary and name it as You wish
* open command prompt in this directory
```bash
git init
git remote add origin https://github.com/pawelmat142/telegram-discord-bot.git
git pull
git checkout main -f
git branch --set-upstream-to origin/main
npm i
npm run build
```

## Configuration
* create .env file inside project/dist directory
* provide credentials for telegram and discord channels:
```bash
TELEGRAM_API_ID=<api_id>
TELEGRAM_API_HASH=<api_hash>
TELEGRAM_PHONE_NUMBER=<phone_number>

DISCORD_BOT_TOKEN=<bot_token>
```
* to get api_id and api_hash go to (https://my.telegram.org/auth) ->  "API development tools" -> fill form
* to get bot_token for discord: (https://discordgsm.com/guide/how-to-get-a-discord-bot-token)

* to .env file also provide channel id pairs like:
```bash
TELEGRAM_CHANNEL_ID_1=<telegram_channel_id_1>
DISCORD_CHANNEL_ID_1=<discord_channel_id_1>

TELEGRAM_CHANNEL_ID_2=<telegram_channel_id_2>
DISCORD_CHANNEL_ID_2=<discord_channel_id_2>
```
* You can provide one or multiple channel pairs
* Messages from telegram_channel_id_1 will be forwarded to discord_channel_id_1 etc...

## Running the app

* open command prompt in directory ./project/dist
```bash
node main.js
```
* you will receive code in your telegram app
* command prompt will ask you for this code
* after logging in stop the app:
```bash
ctrl+c
```
* run app again
```bash
node main.js
```
* bot is running
* now you can run app with forever or another library:
```bash
forever start main.js
```
* remember that first run of app always will ask for telegram login code so to be able to put the code in prompt run the app first by:
* ```bash
node main.js
```
