const fs = require('fs');
let path = require('path');

const myArgs = process.argv.slice(2);
let file_exists = false;

let POfile_parsed;


if (myArgs.length == 0){
    console.log('no parameter given. Expected path to file to translate. Supported files: *.po, *.yml')
    process.exit(1);
} 


//check if file exists
fs.stat(myArgs[0], function(err, stat) {
    if (err == null) {
        file_exists = true;
        console.log(`File exists: ${myArgs[0]}, continue counting chars.`);
        count_chars(myArgs[0]);
    } else if (err.code === 'ENOENT') {
      // file does not exist
      console.log(`File does not exist: ${myArgs[0]}`);
      process.exit(1);
    } else {
      console.log('Some other error: ', err.code);
      process.exit(1);
    }
  });



function count_chars(path2file){
  //extract file ending
  let extension = path.extname(path2file);
  console.log('Detected extnsion: ' + extension);
  switch (extension){
    case '.po':
        process_PO(path2file);
        break;

    case '.yml':
        process_YML(path2file);
        break;
  }
}

function process_PO(path2file){
    POfile_parsed = {header: [], msgs: []};
    //POfile_parsed.header = [];//array of strings
    //POfile_parsed.msgs = []; //array of {actions: "", msgid: "", msgstr: "", msgid_strlen: 0};
    let state_machine = 0;//0: initial/empty/comment/skip, 1: header, 2: actions, 3: msgid, 4: msgstr
    current_msg_part = {actions: "", msgid: "", msgstr: "", msgid_strlen: 0};

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
        else if (cur_line.substring(0,5) === "msgid"){
            //skip empty msgid
            if (cur_line.split(" ")[1] === '""')continue;
            if (state_machine === 2){
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
                current_msg_part.msgid = cur_line.slice(7);
                current_msg_part.msgid_strlen = current_msg_part.msgid.length;
                POfile_parsed.msgs.push(current_msg_part);
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

}

function process_YML(path2file){

}

function print_counts(){

}
