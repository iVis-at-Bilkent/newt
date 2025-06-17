require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


const IS_LOCAL_DATABASE = process.env.LOCAL_DATABASE === 'true';
const PLUGIN_PATH = process.env.NEO4J_PLUGIN_PATH;

if (!IS_LOCAL_DATABASE) {
  console.log("LOCAL_DATABASE is not set to true. Skipping Neo4j setup.");
  return;
}

console.log("LOCAL_DATABASE is true. Installing Neo4j dependencies...");

try {
  execSync('npm install neo4j-driver', { stdio: 'inherit' });
  console.log("Successfully installed neo4j-driver.");
} catch (error) {
  console.error("Failed to install neo4j-driver:", error.message);
  process.exit(1);
}

if(!PLUGIN_PATH) {
  console.error("NEO4J_PLUGIN_PATH is not set. Please set it in your .env file.");
  process.exit(1);
}
const jarSource = path.join(__dirname, '../plugins/neo4j-custom-procedures-1.0.0.jar');
const jarTarget = path.join(PLUGIN_PATH, 'neo4j-custom-procedures-1.0.0.jar');
// Ensure the plugin directory exists
if( !fs.existsSync(jarSource)) {
    console.error(`Source JAR file does not exist: ${jarSource}`);
    process.exit(1);
}

try{   
    fs.copyFileSync(jarSource, jarTarget);
    console.log(`Successfully copied Neo4j plugin to ${jarTarget}`);
}
catch (e) {
    if (e.code === 'EACCES' || e.code === 'EPERM') {
        console.error("Permission denied while copying the JAR file. Try running as Administrator (Windows) or using sudo (Linux).");
    } else {
        console.error("Failed to copy JAR:", e.message);
    }
    process.exit(1);
}