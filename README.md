# Google_Translator_API
Scripts to parse PO and YML files and push it to google translator and then store the results

## Project setup
```sh
sudo apt install nodejs npm
npm install
```
Open translate_strings_with_googleAPI.js and get_supported_langs.js and update your projectID.

## Usage
The script uses Google Cloud Translation library. 
To use client libs put path to key.json to env path:

PowerShell: `$env:GOOGLE_APPLICATION_CREDENTIALS="KEY_PATH"`

CMD: `set GOOGLE_APPLICATION_CREDENTIALS=KEY_PATH`

bash: `export GOOGLE_APPLICATION_CREDENTIALS=KEY_PATH`

You can check supported languages by google with:
```sh
node get_supported_langs.js
```
Edit translate_strings_with_googleAPI.js and amend these vars:
const projectId = '';
const location = 'global';

The main script to load POs/YMLs and to translate is translate_strings_with_googleAPI.

To run:
```sh
node translate_PO_YML.js ./domain.yml en es
```
This will produce domain.en.yml assuming (en)glish is the source languange and (es)paniol as target languange. 

