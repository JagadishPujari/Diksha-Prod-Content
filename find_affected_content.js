var request = require("request");
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var dir = './content_body';
var qs_existdir = './qs_exist'
var qs_affecteddir = './qs_affected'

var affected_content = [];
fs.readdir(dir, function(err, files) {
    _.each(files, function(key, val) {
        fs.readFile('./content_body/' + key, function(err, data) {
            if (!err) {

                var content_data = JSON.parse(data);
                if (content_data && content_data.result && content_data.result.content && content_data.result.content.body) {
                    try {
                        var content_body = JSON.parse(JSON.parse(data).result.content.body);
                        var body_str = JSON.parse(data).result.content.body;
                        if (content_body && content_body.theme && content_body.theme.stage) {
                            if (content_body.theme['plugin-manifest']) {
                                var pluginArr = content_body.theme['plugin-manifest']['plugin'];
                                var qsExist = _.findWhere(pluginArr, { 'id': 'org.ekstep.questionset' })
                                if (qsExist) {
                                    if (!fs.existsSync(qs_existdir)) {
                                        fs.mkdirSync(qs_existdir);
                                    }
                                    copyFile('./content_body/' + key, qs_existdir + '/');
                                    findContentMediaMismatchForQS(content_body, content_data.result.content.identifier);
                                }
                            }
                        }
                    } catch (e) {
                        console.log("Parsing Error", e, content_data.result.content.identifier);
                    }
                }
            }
        });
    });
});



//copy the $file to $dir2
function copyFile(file, dir2) {
    //gets file name and adds it to dir2
    var f = path.basename(file);
    var source = fs.createReadStream(file);
    var dest = fs.createWriteStream(path.resolve(dir2, f));

    source.pipe(dest);
    source.on('end', function() { console.log('Succesfully copied'); });
    source.on('error', function(err) { console.log(err); });
};

function findContentMediaMismatchForQS(data, contentId) {
    var stage_data = data.theme.stage;
    var count = [];
    _.each(data.theme.stage, function(stage) {
        _.each(stage['org.ekstep.questionset'], function(qsSet, index) {
            _.each(qsSet["org.ekstep.question"], function(question, qindex) {
                if (question.pluginId == 'org.ekstep.questionset.quiz') {
                    console.log('not applicable')
                    return
                }
                var content_body = JSON.stringify(data);
                if(content_body.includes("https:\/\/ntpstagingall.blob.core.windows.net\/ntp-content-staging/")){
                    copyFile('./content_body/' + contentId + '.json', qs_affecteddir + '/');
                    return false;
                }else{
                    var mismatch = findQuestionMediaMismatch(question, data, qindex)
                    if (mismatch) {
                        copyFile('./content_body/' + contentId + '.json', qs_affecteddir + '/');
                        return false;
                    }
                }
            });
        });
    });
}

function findQuestionMediaMismatch(question, data, qindex) {
    var questionData = JSON.parse(question.data.__cdata);
    var questionMedia = questionData.media;
    var mediaGeneratedFromQuestion = [];
    var affected = false;
    if (questionData.question.image) {
        mediaGeneratedFromQuestion.push({
            'type': 'image',
            'url': questionData.question.image
        })
    }
    if (questionData.question.audio) {
        mediaGeneratedFromQuestion.push({
            'type': 'audio',
            'url': questionData.question.audio
        })
    }

    switch (question.pluginId) {
        case 'org.ekstep.questionunit.mcq':
            _.each(questionData.options, function(o) {
                if (o.image) mediaGeneratedFromQuestion.push({
                    'type': 'image',
                    'url': o.image
                })
                if (o.audio) mediaGeneratedFromQuestion.push({
                    'type': 'audio',
                    'url': o.audio
                })
            })
            break;
        case 'org.ekstep.questionunit.mtf':
            _.each(questionData.option.optionsLHS, function(o) {
                if (o.image) mediaGeneratedFromQuestion.push({
                    'type': 'image',
                    'url': o.image
                })
                if (o.audio) mediaGeneratedFromQuestion.push({
                    'type': 'audio',
                    'url': o.audio
                })
            })
            _.each(questionData.option.optionsRHS, function(o) {
                if (o.image) mediaGeneratedFromQuestion.push({
                    'type': 'image',
                    'url': o.image
                })
                if (o.audio) mediaGeneratedFromQuestion.push({
                    'type': 'audio',
                    'url': o.audio
                })
            })
            break;
    }

    // comparing generated media and actual media
    _.each(mediaGeneratedFromQuestion, function(mG) {
        //if mediaGeneratedFromQuestion.length(UNIQUE RESOURCE) != questionMedia.length, then the question is affected,
        // Update the question media array
        var url = mG.url;
        var mediaExist = _.find(questionMedia, function(m) {
            return m.src == url;
        })
        if (!mediaExist) affected = true;
        return false;
    })
    return affected;

}