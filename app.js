var writtenNumber = require('written-number');
var stringSimilarity = require("string-similarity");
const MinimumSimilarityScore = 0.6;
const map = {
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

function removeAccentuation(str) {


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
    var position = parseInt(input) - 1;
    let response = null;
    if (position < options.length) {
        response = {
            rating: 1,
            option: options[position].Text,
            index: position
        }
    }
    return response;
}

function addCardinalAndTextOptions(options) {
    options.forEach((element) => {
        var option = writtenNumber((parseInt(element.Index) + 1), { lang: 'pt' });
        element.Synonyms.push(option)
    });
    return options;
}

function findBestMatchBySynonyms(input, options) {
    var all_matches = [];
    options.forEach((element) => {
        let vectTextS = element.Synonyms.map((option) => {
            return clearInput(option);
        })
        all_matches.push(stringSimilarity.findBestMatch(input, vectTextS));
    });
    var matches = all_matches.reduce(function (p, v) {
        return (p.bestMatch.rating > v.bestMatch.rating ? p : v);
    });
    let index = all_matches.indexOf(matches);
    let selectedOption = options[index];
    selectedOption.rating = matches.bestMatch.rating
    return selectedOption;
}

function findBestMatch(input, options, minimumScore) {
    options = addCardinalAndTextOptions(options)
    let vectText = options.map((option) => {
        return clearInput(option.Text);
    })

    var matches = stringSimilarity.findBestMatch(input, vectText);
    let selectedOption = options[matches.bestMatchIndex];
    selectedOption.rating = matches.bestMatch.rating
    if ( selectedOption.rating <= minimumScore) {
        selectedOption = findBestMatchBySynonyms(input, options)
    }

    let response = {
        rating:  selectedOption.rating.toFixed(2),
        option: selectedOption.Text,
        index: selectedOption.Index
    }

    if ( selectedOption.rating <= minimumScore && parseInt(input) != -1) {
        response = findByint(input, options)
    }
    return response;
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
app.post('/', async (req, res) => {
    input = req.body.input;
    options = req.body.options;
    minimumScore = req.body.minimumScore ? req.body.minimumScore : MinimumSimilarityScore
   
    let resp = await findBestMatch(clearInput(input), options, minimumScore);
    if (resp == null) {
        res.sendStatus(204)
    } else {
        res.send(resp);
    }
})

// Start the Express server
app.listen(3000, () => console.log('Server running on port 3000!'))