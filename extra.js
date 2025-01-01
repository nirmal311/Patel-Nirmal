const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const xml2js = require('xml2js');

// Setup Express app
const app = express();
const port = 3000;

// Setup multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Where the uploaded files will be stored
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Keep the original file name
  }
});


const upload = multer({ storage: storage });

// Ensure the uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Function to convert XML to HTML using JSDOM
function convertXmlToHtml(xmlString) {
    let htmlContent = "";
    try {
      // Create a JSDOM instance with an empty document
      const dom = new JSDOM("<html><body></body></html>");
      const document = dom.window.document;
  
      // Parse XML to JSON using xml2js
      xml2js.parseString(xmlString, { explicitArray: false, strict: false }, (err, result) => {
        if (err) {
          throw new Error("Invalid XML format");
        }
  
        // Log the result to verify correct parsing
        // console.log("Parsed XML to JS object:", result);
  
        // Recursively convert XML to HTML
        htmlContent = handleXmlNode(result.DEMOCONTENT); // Access the DEMOCONTENT node
  
        // Log the generated HTML content to verify
        console.log("Generated HTML Content:", htmlContent);
  
        // Update the body of the HTML document with the converted content
        document.body.innerHTML = htmlContent;
  
        // Return the serialized HTML document
      });
    } catch (error) {
      console.error('Error during XML to HTML conversion:', error);
      return `<p>Error processing XML: ${error.message}</p>`;
    }
    return htmlContent;
  }
  
  // Recursive function to handle XML nodes and convert them to HTML
  function handleXmlNode(node) {
    let htmlContent = "";
  
    // Check if node is an object (e.g., contains properties)
    if (typeof node === 'object') {
      Object.keys(node).forEach(key => {
        // Convert the tag name to lowercase
        const tagName = key.toLowerCase();
        const content = node[key];
  
        // If the content is an array, process each item
        if (Array.isArray(content)) {
          content.forEach(item => {
            htmlContent += handleXmlNode(item);
          });
        } else {
          // If content is a string, wrap it inside the tag
          if (typeof content === 'string') {
            htmlContent += tagHandlers[tagName] ? tagHandlers[tagName](content) : `<div class="${tagName}">${content}</div>`;
          } else {
            // If content is an object, recursively handle it
            htmlContent += tagHandlers[tagName] ? tagHandlers[tagName](content) : `<div class="${tagName}">${handleXmlNode(content)}</div>`;
          }
        }
      });
    } else {
      // If node is just text, return it as-is
      htmlContent += node;
    }
  
    return htmlContent;
  }
  
  // Define handlers for different XML tags in an object for easy lookup
  const tagHandlers = {
    'html': (content) => `<html>${handleXmlNode(content)}</html>`,
    'head': (content) => `<head>${handleXmlNode(content)}</head>`,
    'title': (content) => `<title>${content}</title>`,
    'base': (content) => `<base href="${content.href}" />`,
    'link': (content) => `<link rel="${content.rel}" href="${content.href}" />`,
    'meta': (content) => `<meta name="${content.name}" content="${content.content}" />`,
    'style': (content) => `<style>${content}</style>`,
    'body': (content) => `<body>${handleXmlNode(content)}</body>`,
    'article': (content) => `<article>${handleXmlNode(content)}</article>`,
    'section': (content) => `<section>${handleXmlNode(content)}</section>`,
    'nav': (content) => `<nav>${handleXmlNode(content)}</nav>`,
    'aside': (content) => `<aside>${handleXmlNode(content)}</aside>`,
    'h1': (content) => `<h1>${content}</h1>`,
    'h2': (content) => `<h2>${content}</h2>`,
    'h3': (content) => `<h3>${content}</h3>`,
    'h4': (content) => `<h4>${content}</h4>`,
    'h5': (content) => `<h5>${content}</h5>`,
    'h6': (content) => `<h6>${content}</h6>`,
    'header': (content) => `<header>${handleXmlNode(content)}</header>`,
    'footer': (content) => `<footer>${handleXmlNode(content)}</footer>`,
    'p': (content) => `<p>${content}</p>`,
    'hr': () => `<hr />`,
    'pre': (content) => `<pre>${content}</pre>`,
    'blockquote': (content) => `<blockquote>${content}</blockquote>`,
    'ol': (content) => `<ol>${handleXmlNode(content)}</ol>`,
    'ul': (content) => `<ul>${handleXmlNode(content)}</ul>`,
    'li': (content) => `<li>${content}</li>`,
    'dl': (content) => `<dl>${handleXmlNode(content)}</dl>`,
    'dt': (content) => `<dt>${content}</dt>`,
    'dd': (content) => `<dd>${content}</dd>`,
    'a': (content) => `<a href="${content.href}">${content}</a>`,
    'em': (content) => `<em>${content}</em>`,
    'strong': (content) => `<strong>${content}</strong>`,
    'small': (content) => `<small>${content}</small>`,
    's': (content) => `<s>${content}</s>`,
    'code': (content) => `<code>${content}</code>`,
    'input': (content) => `<input type="${content.type}" value="${content.value}" />`,
    'button': (content) => `<button>${content}</button>`,
    'table': (content) => `<table>${handleXmlNode(content)}</table>`,
    'tr': (content) => `<tr>${handleXmlNode(content)}</tr>`,
    'td': (content) => `<td>${content}</td>`,
    'th': (content) => `<th>${content}</th>`,
    'form': (content) => `<form action="${content.action}" method="${content.method}">${handleXmlNode(content)}</form>`,
    'textarea': (content) => `<textarea>${content}</textarea>`,
    'img': (content) => `<img src="${content.src}" alt="${content.alt}" />`,
    'video': (content) => `<video src="${content.src}" controls></video>`,
    'audio': (content) => `<audio src="${content.src}" controls></audio>`,
    'source': (content) => `<source src="${content.src}" type="${content.type}" />`,
    'iframe': (content) => `<iframe src="${content.src}" width="${content.width}" height="${content.height}"></iframe>`,
    'div': (content) => `<div>${handleXmlNode(content)}</div>`,
    'span': (content) => `<span>${content}</span>`,
    // Default handler for unknown tags
    'default': (tagName, content) => `<div class="${tagName}">${handleXmlNode(content)}</div>`
  };
  

// POST route for XML file upload and conversion to HTML
app.post('/upload-xml', upload.single('file'), (req, res) => {
  const xmlFilePath = req.file.path;

  fs.readFile(xmlFilePath, 'utf8', (err, xmlData) => {
    if (err) {
      return res.status(500).send('Error reading XML file');
    }

    // Convert XML to HTML
    const htmlContent = convertXmlToHtml(xmlData);

    // Log to check if htmlContent is correct
    // console.log("HTML Content before writing to file:", htmlContent);

    if (!htmlContent) {
      return res.status(500).send('Failed to generate HTML content');
    }

    // Set the output path for the HTML file
    const htmlFilePath = path.join('uploads', 'converted.html');

    // Save the HTML content to a file
    fs.writeFile(htmlFilePath, htmlContent, (err) => {
      if (err) {
        return res.status(500).send('Error saving HTML file');
      }

      // Send the HTML file for download
      res.download(htmlFilePath, 'converted.html', (err) => {
        if (err) {
          return res.status(500).send('Error sending HTML file for download');
        }
      });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
