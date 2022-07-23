/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const projectId = '';
const location = 'global';
const source_lang = 'de';
const target_lang = 'en';
//const text = 'text to translate';

// Imports the Google Cloud Translation library
const {TranslationServiceClient} = require('@google-cloud/translate');

// Instantiates a client
const translationClient = new TranslationServiceClient();

exports.translateString = function(string2translate){
  let param;
  //check parameter, it has to be an array of strings
  if (typeof string2translate === 'string')param = [string2translate];
  else if (!Array.isArray(string2translate))throw 'exports.translateString()::uknown param to be translated';
  param = string2translate;
  return translateText(param);
}

async function translateText(string2translate) {
  // Construct request
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: string2translate,
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: source_lang,
    targetLanguageCode: target_lang,
  };

  // Run request
  const [response] = await translationClient.translateText(request);

 /*  for (const translation of response.translations) {
    console.log(`Translation: ${translation.translatedText}`);
  }  */
  return response;
}

