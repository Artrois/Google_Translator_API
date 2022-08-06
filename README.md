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

## Examples that are currently supported

*.po where header in quotes and msgstr will be consumed for translation:
```
"Project-Id-Version: PACKAGE VERSION\n"
"POT-Creation-Date: 2021-07-18 15:33+0200\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\n"
"Language-Team: LANGUAGE <LL@li.org>\n"
"MIME-Version: 1.0\n"
"Content-Type: text/plain; charset=UTF-8\n"
"Content-Transfer-Encoding: 8bit\n"
"Generated-By: pygettext.py 1.5\n"

#: actions.py:267
msgid "Derzeit haben wir keine Angebote."
msgstr "Currently we have no offers."

#: actions.py:269
msgid "Aktuell haben wir noch folgende Angebote: "
msgstr "We currently have the following offers: "

#: actions.py:344 actions.py:1427
msgid "heute"
msgstr "today"

#: actions.py:346 actions.py:1429
msgid "am "
msgstr "at the "

#: actions.py:630 actions.py:635
msgid "montag"
msgstr "Monday"
```

*.yml any trailing text after '- text:' will be consumed for translation:
```
responses:  
  #necessary for base action
  utter_offerhelp:
  - text: How can I help you?
  - text: What can I do for you?
  - text: Can I do something for you?
  utter_whatcanido4y:
  - text: I can reserve, change or cancel a table for you. I also will tell you our opening hours and how to reach us.
  utter_nofansfer_configured:
  - text: Unfortunately I cannot forward your call. Please try again later.
  utter_ask_addtask:
  - text: Still need help?
  - text: Is there anything else I can do for you?
  - text: Is there anything else I can do for you?
  - text: How else can I help you?
  - text: What else can I do for you?
```

*.yml any trailing text after ':' and that is matchin regex /(?<=:[ ]+)"?(.+)"?/ will be consumed for translation:
```
en:
  sdg:
    goals:
      goal_1:
        title: "No Poverty"
        title_in_two_lines: "No\nPoverty"
        description: "End poverty in all its forms, everywhere."
```

## ToDo
- [ ] add regex parameter for custom pattern recognition
- [ ] add source language auto detection
- [ ] add option to split the message to google translate API in chunks to meet API limits
