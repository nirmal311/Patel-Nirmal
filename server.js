const express = require('express');
const xml2js = require('xml2js');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const alternativeDir = path.join(__dirname, 'tempUploads');
if (!fs.existsSync(alternativeDir)) {
    fs.mkdirSync(alternativeDir);
}

// Set up multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir); // Use the 'uploads' folder for storing uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // original file name
    },
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/xml' || file.mimetype === 'text/xml') {
            cb(null, true);
        } else {
            cb(new Error('Only XML files are allowed!'), false);
        }
    }
});

// Function to generate HTML dynamically based on XML content
function generateHtmlFromXml(parsedData) {
    let html = '<html><head><style>body { font-family: Arial, sans-serif; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px; } th { background-color: #f2f2f2; }</style></head><body>';

    function traverseXml(obj) {
        if (Array.isArray(obj)) {
            obj.forEach(item => traverseXml(item));
        } else if (typeof obj === 'object') {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    html += `<h3>${key}</h3>`;
                    
                    // Handle specific tags
                    if (key === 'img') {
                        html += `<img src="${value}" alt="Image" style="max-width: 100%; height: auto;"/><br>`;
                    } else if (key === 'email') {
                        html += `<p>Email: <a href="mailto:${value}">${value}</a></p>`;
                    } else if (key === 'phone' || key === 'mobile') {
                        html += `<p>${key.charAt(0).toUpperCase() + key.slice(1)}: <a href="tel:${value}">${value}</a></p>`;
                    } else if (typeof value === 'object') {
                        traverseXml(value); // Recursively traverse the value
                    } else {
                        html += `<p>${value}</p>`; // Default handling for other tags
                    }
                }
            }
        } else {
            html += `<p>${obj}</p>`; // Handle string values
        }
    }

    traverseXml(parsedData);
    html += '</body></html>';
    return html;
}

// POST route for XML file upload and conversion to HTML
app.post('/upload-xml', upload.single('file'), (req, res) => {
    const xmlFilePath = req.file.path;

    fs.readFile(xmlFilePath, 'utf8', (err, xmlData) => {
        if (err) {
            return res.status(500).send('Error reading XML file');
        }

        xml2js.parseString(xmlData, { explicitArray: false, strict: false }, (err, result) => {
            if (err) {
                return res.status(400).send('Invalid XML format');
            }

            const htmlContent = generateHtmlFromXml(result);
            const htmlFilePath = path.join(alternativeDir, 'converted.html');

            fs.writeFile(htmlFilePath, htmlContent, (err) => {
                if (err) {
                    return res.status(500).send('Error saving HTML file');
                }

                res.download(htmlFilePath, 'converted.html', (err) => {
                    if (err) {
                        return res.status(500).send('Error sending HTML file for download');
                    }
                });
            });
        });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});