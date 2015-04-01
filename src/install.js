
/*
 * React Extensions Manager
 * install command
 */

'use strict';

var initialize = require("./init.js");
var fs = require('fs');
var sys = require('sys');
var cp = require('child_process');
var exec = cp.exec;

// Define Podfile markers for REM
var podFileGeneratedText = "# @generated by React Extension Manager\n# Reference the local pods that live in node_modules";

module.exports = {
  init: function() {
    // Check for initialization
    var isRemInstalled = initialize.isInstalled;
    if (isRemInstalled){
      // REM has installed environment
      var podfile;
      try {
        podfile = fs.readFileSync("./REM-Podfile", 'utf8');
      } catch(err) {
        if (err.code === 'ENOENT') {
          initialize.init();
          podfile = fs.readFileSync("./REM-Podfile", 'utf8')
        } else {
          throw err;
        }
      }

      // Traverse each node module
      console.log("Installing available React Native modules...\nSearching for available modules...\n");

      var files;
      try {
        files = fs.readdirSync("./node_modules/");
      } catch(err) {
        throw err;
      }

      files.forEach(function(file) {
        // Check to see if this is a directory
        if (file.charAt(0) != ".") {
          var isDirectory;
          try {
            isDirectory = fs.lstatSync("./node_modules/" + file).isDirectory()
          } catch(err) {
            throw err;
          }

          if (isDirectory) {
            // File is directory try to read package.json
            var filePackage = "./node_modules/" + file + "/package.json";
            var packageText;
            try {
              packageText = fs.readFileSync(filePackage, 'utf8');
            } catch (err) {
              throw err;
            }

            // Try to parse file as json
            var packageJSON = JSON.parse(packageText);

            // check to see if this is a React Native Module
            if (packageJSON["react-native-module"] != null) {
              // File is a React Native Module
              console.log("React Native Module Found: " + file);

              // Try to get Podfile Path
              var podfilePath = packageJSON["react-native-module"]["podfile"];
              if (podfilePath != null) {
                if (podfile.indexOf(file) != -1) {
                  console.log(file + " is already included as a dependency.\n");
                } else {
                  var newDependency = "pod '" + file + "', :path => 'node_modules/" + file + "/'\n";
                  try {
                    fs.appendFileSync('./REM-Podfile', newDependency);
                  } catch(err) {
                    throw err;
                  }

                  console.log("Added dependency: " + file);
                }
              } else {
                throw new Error("podfile path is required for node module: " + file);
              }
            }
          }
        }
      });

      // Run pod install on all new dependencies
      console.log("Installing dependencies...");
      exec("pod install", function(error, stdout, stderr) {
        console.log(stdout);
      });
    } else {
      initialize.init();
    }
  }
};
