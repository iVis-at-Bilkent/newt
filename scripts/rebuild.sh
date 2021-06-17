#!/usr/bin/env bash
PATH=/usr/local/sbin:/usr/sbin:/usr/bin:/sbin:/bin:/home/ivis/newt

#Logging rebuild time
date >> /home/ivis/newt/rebuild.log

#update newt 
echo "Updating newt..." &>> /home/ivis/newt/rebuild.log
git fetch --all &>> /home/ivis/newt/rebuild.log
git reset --hard origin/unstable &>> /home/ivis/newt/rebuild.log

#update npm packages
echo -e "\nUpdating npm pakcages..." >> /home/ivis/newt/rebuild.log
npm update
npm install

#browserify
echo -e "\nRunning browserify..." >> /home/ivis/newt/rebuild.log
browserify /home/ivis/newt/app/main.js -o /home/ivis/newt/app/bundle.js

# minimize
#rm app/bundle.min.js

echo -e "\nMinimizing with Closure..." >> /home/ivis/newt/rebuild.log
echo -e "\nThis make take a few minutes, be patient..." >> /home/ivis/newt/rebuild.log
java -jar /home/ivis/newt/closure-compiler-v20170626.jar --js /home/ivis/newt/app/bundle.js --js_output_file /home/ivis/newt/app/bundle.min.js >/dev/null 2>&1

mv /home/ivis/newt/app/bundle.min.js /home/ivis/newt/app/bundle.js
echo "Done!" >> /home/ivis/newt/rebuild.log
echo "-------------------------------------" 

