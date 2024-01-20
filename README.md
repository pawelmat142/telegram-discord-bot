## Description

Bot for automatically sending messages from a private telegram channel to a discord channel

## Installation

* open new project dictionary and name it as You wish
* open command prompt in this directory
```bash
$ git init
$ git clone https://github.com/pawelmat142/telegram-discord-bot.git .
$ npm i
```

## Configuration
* create .env file inside project directory
* provide credentials for telegram and discord channels:
```bash
TELEGRAM_API_ID=<api_id>
TELEGRAM_API_HASH=<api_hash>
TELEGRAM_PHONE_NUMBER=<phone_number>

DISCORD_BOT_TOKEN=<bot_token>
```
* to get api_id and api_hash go to (https://my.telegram.org/auth) ->  "API development tools" -> fill form
* to get bot_token for discord: (https://discordgsm.com/guide/how-to-get-a-discord-bot-token)

  to .env file also provide channel id pairs like:
```bash
TELEGRAM_CHANNEL_ID_1=<telegram_channel_id_1>
DISCORD_CHANNEL_ID_1=<discord_channel_id_1>

TELEGRAM_CHANNEL_ID_2=<telegram_channel_id_2>
DISCORD_CHANNEL_ID_2=<discord_channel_id_2>
```
* You can provide one or multiple channel pairs
* Messages from telegram_channel_id_1 will be forwarded to discord_channel_id_1 etc...

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test
