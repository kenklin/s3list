"use strict";

var program	= require("commander");
var AWS		= require("aws-sdk");
var config	= require("./config.json");

program
	.version("0.0.1")
	.description("List the AWS S3 bucket's items with the specified prefix.")
	.option("--bucket [bucket]",	"Optional S3 bucket name.")
	.option("--prefix [prefix]",	"Optional S3 item key prefix.")
	.option("--b",			"Bare: item key only, without index.")
	.option("--al",			"All object information in JSON.")
	.parse(process.argv);

AWS.config.update({region: config.REGION});
var s3 = new AWS.S3();

var params = {
	Bucket: program.bucket ? program.bucket : config.REPORTS_BUCKET,
	Prefix: program.prefix ? program.prefix : null
};

var s3DataContents = [];	// Single array of all combined S3 data.Contents

function s3Print() {
	if (program.al) {
		// --al: Print all objects
		console.log(JSON.stringify(s3DataContents, null, "    "));
	} else {
		// --b: Print key only, otherwise also print index 
		var i;
		for (i = 0; i < s3DataContents.length; i++) {
			var head = !program.b ? (i+1) + ": " : "";
			console.log(head + s3DataContents[i].Key);
		}
	}
}

function s3ListObjects(params, cb) {
	s3.listObjects(params, function(err, data) {
		if (err) {
			console.log("listS3Objects Error:", err);
		} else {
			var contents = data.Contents;
			s3DataContents = s3DataContents.concat(contents);
			if (data.IsTruncated) {
				// Set Marker to last returned key
				params.Marker = contents[contents.length-1].Key;
				s3ListObjects(params, cb);
			} else {
				cb();
			}
		}
	});
}

try {
	s3ListObjects(params, s3Print);
} catch(e) {
	console.log(e + "\n" + e.stack);
}
