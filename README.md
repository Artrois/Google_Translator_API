# Google_Translator_API
Scripts to parse PO and YML files and push it to google translator and then store the results

## Project setup
```sh
sudo apt install nodejs npm
npm run install
```
Open translate_strings_with_googleAPI.js and get_supported_langs.js and update your projectID.

## Usage
You can check supported languages by google with:
```sh
node get_supported_langs.js
```

The main script to load POs/YMLs and to translate is translate_strings_with_googleAPI.

To run:
```sh
node .\translate_PO_YML.js ./domain.yml
```

This will create another file with .en extension: ./domain.en.yml 