const fs = require('fs');
const yaml = require('js-yaml');
let path = require('path');
let trans = require('./translate_strings_with_googleAPI');

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

const myArgs = process.argv.slice(2);
let file_exists = false;




if (myArgs.length !== 3){
    console.log('Wrong parameters given: node translate_PO_YML.js [*.po | *.yml] [source_language] [target_language]. Supported files: *.po, *.yml. See example:');
    console.log("node .\translate_PO_YML.js ./domain.yml en es");
    process.exit(1);
} 


//check if file exists
fs.stat(myArgs[0], function(err, stat) {
    if (err == null) {
        file_exists = true;
        console.log(`File exists: ${myArgs[0]}, continue counting chars.`);
        count_chars(myArgs[0], myArgs[2], myArgs[1]);
    } else if (err.code === 'ENOENT') {
      // file does not exist
      console.log(`File does not exist: ${myArgs[0]}`);
      process.exit(1);
    } else {
      console.log('Some other error: ', err.code);
      process.exit(1);
    }
  });



async function count_chars(path2file, target_lang, source_lang){
  //extract file ending
  let extension = path.extname(path2file);
  console.log('Detected extension: ' + extension);
  switch (extension){
    case '.po':
        PO_file = process_PO(path2file);
        var readlineSync = require('readline-sync');
        if (readlineSync.keyInYN('Do you want to start translation of PO?')) {
            // 'Y' key was pressed.
            console.log('Translating in 2 secs...');
            await sleep(2000);
            let arrayOfStrings2BeTranslated = [];
            for (element of PO_file.msgs)
                arrayOfStrings2BeTranslated.push(element.msgid);
            if (arrayOfStrings2BeTranslated.length === 0) throw "count_chars(): nothing to be translated"
            let translated_msgid = await trans.translateString(arrayOfStrings2BeTranslated, target_lang, source_lang);
/*             for (const translation of translated_msgid.translations) {
                    console.log(`Translation: ${translation.translatedText}`);
            }  */
            if (translated_msgid.translations.length !== arrayOfStrings2BeTranslated.length)throw "array to be transalted not matches array with translations"

            for (let i = 0; i<translated_msgid.translations.length;i++){
                PO_file.msgs[i].msgstr = translated_msgid.translations[i].translatedText;
            }
            
            store_PO(PO_file, path2file, "." + target_lang);
        } else {
            // Another key was pressed.
            console.log('Canceled...');
            // Do something...
        }
        
        break;

    case '.yml':
        let arrayOfStrings2BeTranslated = process_YML(path2file);

        var readlineSync = require('readline-sync');
        if (readlineSync.keyInYN('Do you want to start translation of YAML?')) {
            // 'Y' key was pressed.
            console.log('Translating in 2 secs...');
            await sleep(2000);
            if (arrayOfStrings2BeTranslated.length === 0) throw "count_chars(): nothing to be translated"
            let translated_yaml = await trans.translateString(arrayOfStrings2BeTranslated, target_lang, source_lang);
            if (translated_yaml.translations.length !== arrayOfStrings2BeTranslated.length)throw "array to be translated not matches array with translations"
            store_YAML(translated_yaml, path2file, "." + target_lang)
        } else {
            // Another key was pressed.
            console.log('Canceled...');
            // Do something...
        }
        break;
  }
}

/**
 * loads PO file into memory and counts number of characters for each msgid
 * @param {string} path2file 
 * @returns {header: [string], msgs: [{actions: "", msgid: "", msgstr: "", msgid_strlen: 0}]} 
 */
function process_PO(path2file){
    let POfile_parsed = {header: [], msgs: []};
    //POfile_parsed.header = [];//array of strings
    //POfile_parsed.msgs = []; //array of {actions: "", msgid: "", msgstr: "", msgid_strlen: 0};
    let state_machine = 0;//0: initial/empty/comment/skip, 1: header, 2: actions, 3: msgid, 4: msgstr
    let current_msg_part = {actions: "", msgid: "", msgstr: "", msgid_strlen: 0};

    const nReadlines = require('n-readlines');
    const broadbandLines = new nReadlines(path2file);

    let line;
    let lineNumber = 0;

    while (line = broadbandLines.next()) {
        lineNumber++;
        let cur_line = line.toString('utf8').trim();
        console.log(`${lineNumber}: ${cur_line}`);

        //skip empty lines
        if (cur_line === "")continue;
        //process action lines
        else if (cur_line.substring(0,2) === "#:"){
            state_machine = 2;
            current_msg_part.actions = cur_line.slice(3);
        }
        //skip commented lines
        else if (cur_line.substring(0,1) === "#")continue;
        //process msgid tag
        else if ((cur_line.substring(0,5) === "msgid")){
            //skip empty msgid
            if (cur_line.split(" ")[1] === '""')continue;
            if ((state_machine === 0) || (state_machine === 2) || (state_machine === 4)){
                state_machine = 3;
                current_msg_part.msgid = cur_line.slice(6);
            }
        }
        //process msgstr tag
        else if (cur_line.substring(0,6) === "msgstr"){
            //skip empty msgstr
            if (cur_line.split(" ")[1] === '""')continue;
            if (state_machine === 3){
                state_machine = 4;
                current_msg_part.msgstr = cur_line.slice(7);
                current_msg_part.msgid_strlen = current_msg_part.msgstr.length;
                POfile_parsed.msgs.push(current_msg_part);
                current_msg_part = {actions: "", msgid: "", msgstr: "", msgid_strlen: 0};
                state_machine = 0;
            }
        }
        //process header
        else if (cur_line.startsWith('"') && cur_line.endsWith('"') && (state_machine === 0 || state_machine === 1)){
            state_machine = 1;
            POfile_parsed.header.push(cur_line);
        }
        //this one we should not reach
        else {
            console.log('Awkward line skipped, reading as: ' + cur_line);
        }

        
    }

    let total_chars = 0;
    POfile_parsed.msgs.forEach(element => {total_chars += element.msgid_strlen;});

    console.log('end of file.');
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
   console.log("Header lines: " + POfile_parsed.header.length);
   console.log("msgid triples: " + POfile_parsed.msgs.length);
   console.log("Total chars to translate: " + total_chars);
   return POfile_parsed;
}

function process_YML(path2file){
     // Get document, or throw exception on error
/*     try {
        const ymldoc = yaml.load(fs.readFileSync(path2file, 'utf8'));
        console.log(ymldoc);
    } catch (e) {
        throw "process_YML(): Processing of YAML failed with: " + e;
    }  */
    const nReadlines = require('n-readlines');
    const broadbandLines = new nReadlines(path2file);

    let line;
    let lineNumber = 0;
    let arrayOfStrings2BeTranslated = [];
    let totalNumChars2Translate = 0;
    let regex_quotes = /(?<=:[ ]+)"?(.+)"?/;

    while (line = broadbandLines.next()) {
        lineNumber++;
        let cur_line = line.toString('utf8');

        //check regex
        let match_quotes = cur_line.match(regex_quotes);

        //skip empty lines
        if (cur_line === "")continue;
        //skip commented lines
        else if (cur_line.trim().substring(0,1) === "#")continue;
        //process text lines
        else if (cur_line.startsWith("  - text:")){
            let tmp = cur_line.slice(10);
            arrayOfStrings2BeTranslated.push(tmp);
            totalNumChars2Translate += tmp.length;
            console.log(`${lineNumber}: ${cur_line} T:` + tmp.length);
        }
        //process example lines
        else if (cur_line.startsWith("    - ")){
            let tmp = cur_line.slice(6);
            arrayOfStrings2BeTranslated.push(tmp);
            totalNumChars2Translate += tmp.length;
            console.log(`${lineNumber}: ${cur_line} T:` + tmp.length);
        }
        //process lines matching /(?<=:[ ]+)"?(.+)"?/g
        else if (match_quotes !== null){
            let tmp = match_quotes[0];//.replace('/&quot;/g',"'");
            arrayOfStrings2BeTranslated.push(tmp);
            totalNumChars2Translate += tmp.length;
            console.log(`${lineNumber}: ${cur_line} T:` + tmp.length);
        }
        else{
            console.log(`${lineNumber}: ${cur_line}`);
        }
    }

    console.log("Total number chars to be translated: " + totalNumChars2Translate);
    return arrayOfStrings2BeTranslated;
}

/**
 * stores the content of PO_file array to a new file with new extension e.g. .en.po
 * @param {PO_file}, {header: [string], msgs: [{actions: "", msgid: "", msgstr: "", msgid_strlen: 0}]}
 * @param {path2file}, path to original file
 * @param {suffix}, suffix that will be attached right before the .po extension
 */
function store_PO(PO_file, path2file, suffix){
    let extension = path.extname(path2file);
    let basename = path.basename(path2file, extension);//extracts file name only without extension
    let dirname = path.dirname(path2file);

    //construct new file name and path
    let new_path2file = dirname + "/" + basename + suffix + extension;


    //PO_file.header.forEach(element => {total_chars += element.msgid_strlen;});
    //PO_file.msgs.forEach(element => {total_chars += element.msgid_strlen;});
    //write headers
    try{
        fs.writeFileSync(new_path2file, PO_file.header.join('\r\n') + "\r\n", { flag: 'w+' });
    }
    catch (err){
        console.log("Writing headers failed with: " + err);
    }
    //write messages
    let full_buffer2bewritten ="";
    let single_line ="";
    console.log("Num msgs: " + PO_file.msgs.length);

    for (let i=0;i<PO_file.msgs.length;i++)
    {
        single_line = "\r\nmsgid " + PO_file.msgs[i].msgid + "\r\nmsgstr " + PO_file.msgs[i].msgstr;
        if(PO_file.msgs[i].actions !== "") single_line = "\r\n#: " + PO_file.msgs[i].actions + single_line;
        full_buffer2bewritten += single_line + "\r\n";
    }
    //PO_file.msgs.forEach(element => {full_buffer2bewritten.concat("\r\n", element.actions, "\r\n", element.msgid, "\r\n", element.msgstr)});
    try{
        fs.writeFileSync(new_path2file, full_buffer2bewritten, { flag: 'a+' });
        console.log("New PO file name: " + new_path2file);
    }
    catch (err){
        console.log("Writing msgstrings failed with: " + err);
    }
}

/**
 * stores the content of translatedArray  to a new file with new extension e.g. .en.yml
 * @param {yml_file}, []
 * @param {path2file}, path to original file
 * @param {suffix}, suffix that will be attached right before the .po extension
 */
 function store_YAML(translatedArray, path2file, suffix){
    let extension = path.extname(path2file);
    let basename = path.basename(path2file, extension);//extracts file name only without extension
    let dirname = path.dirname(path2file);
    let regex_quotes = /([ ]+(.+))(:[ ]+)("?(.+)"?)/;

    //construct new file name and path
    let new_path2file = dirname + "/" + basename + suffix + extension;

    const nReadlines = require('n-readlines');
    const broadbandLines = new nReadlines(path2file);

    let line;
    let lineNumber = 0;
    let arrayOfStrings2BeWritten = [];
    let index_in_translated_array = 0;

    console.log("Num translated lines: " + translatedArray.translations.length);

    while (line = broadbandLines.next()) {
        lineNumber++;
        let cur_line = line.toString('utf8');

        //check regex
        let match_quotes = cur_line.match(regex_quotes);

        //process text lines
        if (cur_line.startsWith("  - text:")){
            arrayOfStrings2BeWritten.push("  - text: " + translatedArray.translations[index_in_translated_array].translatedText);
            index_in_translated_array++;
        }
        //process example lines
        else if (cur_line.startsWith("    - ")){
            arrayOfStrings2BeWritten.push("    - " + translatedArray.translations[index_in_translated_array].translatedText);
            index_in_translated_array++;
        }
        //process lines matching /([ ]+(.+))(:[ ]+)("?(.+)"?)/g
        else if(match_quotes !== null){
            let tmp = match_quotes[1] + match_quotes[3] + translatedArray.translations[index_in_translated_array].translatedText;
            arrayOfStrings2BeWritten.push(tmp);
            index_in_translated_array++;
        }
        else{
            arrayOfStrings2BeWritten.push(cur_line);
        }

        console.log(`${lineNumber}: ${arrayOfStrings2BeWritten[lineNumber - 1]}`);
    }
  
   
    try{
        fs.writeFileSync(new_path2file, arrayOfStrings2BeWritten.join('\r\n'), { flag: 'w+' });
        console.log("New YML file name: " + new_path2file);
    }
    catch (err){
        console.log("Writing YML failed with: " + err);
    }
}
