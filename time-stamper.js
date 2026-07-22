const fs = require('fs');
const path = require('path');
const {JSDOM} = require('jsdom');

const filePath = path.join(__dirname, 'index.html');

const buildDate = new Date();
const timestampString = `Last Update: ${buildDate.toLocaleString('tr-TR', { timeZone: 'Europe/Athens' })} (Türkiye)`;

fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
        console.error('Error reading the HTML file:', err);
        return;
    }

    const dom = new JSDOM(data);
    const document = dom.window.document;
    const timestampElement = document.getElementById('build-timestamp');
    if (timestampElement) {
        timestampElement.textContent = timestampString;
    } else {
        console.error('Element with ID "build-timestamp" not found.');
        return;
    }
    const updatedHtml = dom.serialize();
    fs.writeFile(filePath, updatedHtml, 'utf8', (err) => {
        if (err) {
            console.error('Error writing the HTML file:', err);
            return;
        }
        console.log('Timestamp added successfully!');
    });
});
