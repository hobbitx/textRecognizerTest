var stringSimilarity = require("string-similarity");
const MinimumSimilarityScore = 0.6;

function removeAccentuation(str) {
    var map = {
        '-': ' ',
        '-': '_',
        'a': 'á|à|ã|â|ä|À|Á|Ã|Â|Ä',
        'e': 'é|è|ê|ë|É|È|Ê|Ë',
        'i': 'í|ì|î|ï|Í|Ì|Î|Ï',
        'o': 'ó|ò|ô|õ|ö|Ó|Ò|Ô|Õ|Ö',
        'u': 'ú|ù|û|ü|Ú|Ù|Û|Ü',
        'c': 'ç|Ç',
        'n': 'ñ|Ñ'
    };

    for (var pattern in map) {
        str = str.replace(new RegExp(map[pattern], 'g'), pattern);
    };
    return str;
}

function removeEmoji(str) {
    let re = /([^\u0000-\u010F]|\n|\t|\r)+/gmi;
    str = str.replace(re, '');
    return str;
}

function trimBetween(str) {
    let re = /\s+/gmi;
    str = str.replace(re, ' ');
    return str;
}

function clearInput(str) {
    normalizedStr = removeEmoji(str);
    normalizedStr = removeAccentuation(normalizedStr);
    normalizedStr = trimBetween(normalizedStr);
    normalizedStr = normalizedStr.toLowerCase().trim();
    return normalizedStr;
}

function findByint(input, options) {
    input = input.replace(/^\D+/g, '');
    var pos = parseInt(input) - 1;
    let response = null;
    if (pos < options.length) {
        response = {
            rating: 1,
            option: options[pos].Text,
            index: pos
        }
    }
    return response;
}

function findBestMatch(input, options) {
    let vectText = options.map((option) => {
        return clearInput(option.Text);
    })
    var matches = stringSimilarity.findBestMatch(input, vectText);
    let ops = options[matches.bestMatchIndex];

    if (matches.bestMatch.rating <= MinimumSimilarityScore && options[matches.bestMatchIndex].Synonyms.length > 0) {
        let vectTextS = options[matches.bestMatchIndex].Synonyms.map((option) => {
            return clearInput(option);
        })
        matches = stringSimilarity.findBestMatch(input, vectTextS);
    }
    let ret = {
        rating: matches.bestMatch.rating.toFixed(2),
        option: ops.Text,
        index: ops.Index
    }

    if (matches.bestMatch.rating <= MinimumSimilarityScore && parseInt(input) != -1) {
        ret = findByint(input, options)
    }
    return ret;
}

const http = require('http');

// Create an instance of the http server to handle HTTP requests
const express = require('express')
const bodyParser = require('body-parser');
const { response } = require("express");

// Create Express app
const app = express()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// A sample route
app.get('/', (req, res) => res.send('Hello World!'))
app.post('/', (req, res) => {
    input = req.body.input;
    options = req.body.options;
    let resp = findBestMatch(clearInput(input), options);
    if (resp == null) {
        res.sendStatus(204)
    } else {
        res.send(resp);
    }
})

// Start the Express server
app.listen(3000, () => console.log('Server running on port 3000!'))