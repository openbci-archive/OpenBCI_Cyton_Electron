// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import async from 'async';
import fs from 'fs';
import path from 'path';
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import intel_hex from 'intel-hex';
import jetpack from 'fs-jetpack'; // module loaded from npm
import SerialPort from 'serialport';
import stk500 from 'stk500-v2';
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import { getPortName } from './flash_firmware/flash_firmware'; // For uploading
import env from './env';

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

var pageSize = 256;
var delay1 = 1; //minimum is 2.5us, so anything over 1 fine?
var delay2 = 1;
var signature = new Buffer([0x1e, 0xa8, 0x02]);

var options = {
  timeout:0xc8,
  stabDelay:0x64,
  cmdexeDelay:0x19,
  synchLoops:0x20,
  byteDelay:0x00,
  pollValue:0x53,
  pollIndex:0x03
};

var uploadCode = () => {
  const port = getPortName();
  console.log(`Start.....`);
  const fp = path.join(app.getAppPath(), 'app', 'Arduino', 'DefaultBoard.ino.hex');
  console.log(`Path for hex: ${fp}`);
  const data = fs.readFileSync(fp, { encoding: 'utf8' });
  const hex = intel_hex.parse(data).data;
  console.log('Hex file ready for upload!');

  console.log(`Opening serial port ${port}`);
  var serialPort = new SerialPort(port, {
    // autoOpen: false,
    baudrate: 115200,
    parser: SerialPort.parsers.raw
  }, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('serial port opened!');
    }
  });

  var programmer = new stk500(serialPort);
  console.log('Programmer created');

  // debug
  programmer.parser.on('rawinput',function(buf){
    console.log("->",buf.toString('hex'));
  })

  programmer.parser.on('raw',function(buf){
    console.log("<-",buf.toString('hex'));
  })

  // do it!
  programmer.sync(5,function(err,data){
    console.log('callback sync',err," ",data)
  });

  programmer.verifySignature(signature,function(err,data){
    console.log('callback sig',err," ",data);
  });

  // programmer.enterProgrammingMode(options,function(err,data){
  //   console.log('enter programming mode.',err,data);
  // });

  // programmer.upload( hex, pageSize,function(err,data){
  //   console.log('upload> ',err,data);
  //
  //   programmer.exitProgrammingMode(function(err,data){
  //     console.log('exitProgrammingMode> ',err,data)
  //   })
  // });
};

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('greet').innerHTML = greet();
  document.getElementById('platform-info').innerHTML = os.platform();
  document.getElementById('env-name').innerHTML = env.name;
  document.getElementById("btnUpload").addEventListener("click", uploadCode);
});

