var request = require("request");
var fs = require('fs');
var _ = require('underscore');

var contents = [];
var failedContents = [];
var affected_questions = [];
var affected_content = [];
var currentIndex = 0;
var downloadedContent = [];
var dir = './content_ids';
var envURl = 'https://staging.ntp.net.in';

// var options = { method: 'POST',
//  // url: 'https://staging.ntp.net.in/action/composite/v3/search',//'https://diksha.gov.in/action/composite/v3/search',
//  url:'https://diksha.gov.in/action/composite/v3/search', 
//  headers: 
//    { 'Postman-Token': '90f73ae6-7928-434b-8437-2c8f8ef1cd3d',
//      'cache-control': 'no-cache',
//      'Accept-Encoding': 'UTF-8',
//      'user-id': 'ilimi',
//      'Content-Type': 'application/json' },
//   body: 
//    { request: 
//       { filters: 
//          {
//           contentType:["Resource"],
//           objectType: [ 'Content' ],
//            mimeType: 'application/vnd.ekstep.ecml-archive',
//            createdOn: {
//               min : '2018-08-20T00:00:00.000+0530',
//                max: '2018-11-08T00:00:00.000+0530'
//             },
//            status: [] },
//         fields: [ 'identifier', "createdOn"],
//         sort_by: {"createdOn": "asc"},
//         limit: 8000 } },
//   json: true };

// request(options, function (error, response, body) {
//   if (error) throw new Error(error);
//   _.each(body.result.content, function(key,value){
//     contents.push({identifier: key.identifier, createdOn: key.createdOn});
//     //getContentById(key.identifier,value);
//   });
//   //getContentById(contents[currentIndex++]);
//   console.log(JSON.stringify(contents));
//   fs.writeFile('./content_ids/contentID.json', JSON.stringify(contents), 'utf8');

//   // Go through number of questions affected and check in every content file
// });

fs.readFile('./content_ids/contentID.json', function(err, data) {
    if (!err) {
        var contentReadData = JSON.parse(data);
        _.each(contentReadData, function(key) {
            console.log(key);
            contents.push(key);
        })
        //currentIndex = contents.findIndex(x => x.identifier == "do_31257472318720409622503")
        getContentById(contents[currentIndex++]);
    }

});

function getContentById(content) {
    var contentID = content.identifier;
    var contentData;
    var options = {
        method: 'GET',
        url: envURl + '/action/content/v3/read/' + contentID,
        qs: { fields: 'body' },
        headers: {
            'Postman-Token': 'a78787b0-f0a0-411c-b794-40cb047af880',
            'cache-control': 'no-cache',
            'Content-Type': 'application/json'
        }
    };

    request(options, function(error, response, body) {
        if (error) {
            console.log("Request on failure: ", options);
            console.log("Body on failure:")
            // throw new Error(error);
            console.log(error, error);
            failedContents.push(content);
        }

        try {
            var str = JSON.stringify(body);
            var obj = JSON.parse(str);
            fs.writeFile('./content_body/' + contentID + '.json', obj);
            console.log("successfully downloaded - " + contentID + " createdOn - " + content.createdOn);

            if (contents.length > currentIndex) {
                getContentById(contents[currentIndex++]);
            } else {
                console.log("===== All contents donwloaded..");

                console.log("Failed contents list", JSON.stringify(failedContents));

                console.log("xxxxxxxxGet content for failed list");
                contents = _.clone(failedContents);
                currentIndex = 0;
                getContentById(contents[currentIndex++]);
            }
        } catch (e) {
            // currentIndex=contents.findIndex(x => x.identifier=="do_31257472318720409622503")
            getContentById(contents[currentIndex]);
        }

    });

}