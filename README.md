## Description

Bot for automatically sending messages from a private telegram channel to a discord channel

## Installation

* open new project dictionary
```bash
$ git init
$ git clone <url> .
$ npm i
```
* create .env file inside
* provide telegram channel API key:
```bash
TELEGRAM_API_ID=<api_id>
TELEGRAM_API_HASH=<api_hash>
TELEGRAM_CHANNEL_ID=<listened_channel_id>
TELEGRAM_PHONE_NUMBER=<phone_number>
```
* to get api_id and api_hash go to 


clone repository to chosen dictionary 
```bash
$ npm install
```

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