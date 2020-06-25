//Require Node Modules
var express = require('express');
var app = express();
var parser = require('body-parser');
//var moment = require('moment');
var Cloudant = require('cloudant');
var unirest = require('unirest');
var path = require('path');
var remind = require('email-reminder');
var nodemailer = require("nodemailer");
//var request = require('request');
const TFARegister = require('./CloudFunctions/TFARegister');
const TFACheck = require('./CloudFunctions/TFACheck');

var watson = require('watson-developer-cloud');
var server = require('http');
var server = app.listen(process.env.PORT || 8888, function () {
	console.log("Server is running at 8888");
});
var username = '670c7140-2118-4b76-ab85-9cb7899af063-bluemix';
var password = '8ccbc6a4e9238683ae3a027230328a3528bfddcad0eedaae69de6e6b8631f293';
var cloudant = Cloudant({
	account: username,
	password: password
});
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });
////console.log("Creating document 'mydoc'");
var db = cloudant.db.use('mintz');
// specify the id of the document so you can update and delete it later

var io = require('socket.io').listen(server);

//Initialize the modules
var assistant = new watson.AssistantV1({
	iam_apikey: 'xr-f__EKZAI975Ta0uon2Rflnz32uyvGHlCrVUxRgg65',
	version: '2018-09-20',
	url: 'https://gateway.watsonplatform.net/assistant/api'
});

//Initialize Body Parser
app.use(parser.json());
app.use(parser.urlencoded({
	extended: true
}));
app.get('/fblogin', (req, res) => {
    res.sendFile(__dirname + '/Login/login.html');
})
var context;
var users_socket = [];
var name;
var username;

app.use('/', express.static('public'))
var pKey;
var rKey;
var NexmoRequestId;
//routing agent page
app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/public/chatui.html'));
	pKey = req.query.partitionKey;
	rKey = req.query.rowKey;
});

var localSocket = "";
//Handle Button Click Events
io.on('connection', function (socket) {
	var outputd = [];
	// if(localSocket!= ""){
	// 	socket = localSocket;
	// }
	// localSocket = socket;
	console.log("id")
	app.post('/checkCredentials', (req, res) => {
		//console.log("inside checkCredentials");	
		if(req.body.userName =="clokam@miraclesoft.com" && req.body.userPassword == "Miracle@123"){
			// outputd={
			// 	"data":"You are Succefully logged in"
			// }
			console.log("into success");
			console.log("id in api", socket.id)
			TFARegister({ phoneNo: 9866010831 }).then((respData) => {
				if (respData.resData.result.status == 0) {
					NexmoRequestId = respData.resData.result.request_id;
					io.emit('planMsg', { "output": "You are successfully logged in! You will get a verification code to your mobile. Please enter the verification code." })
				} else if (respData.resData.result.status == 3) {
					console.log("invalid phone number")
					io.emit('planMsg', { "output": "Your registered phone number doesn't exist. Please check the number and try again!" })
				} else if (respData.resData.result.status == 9) {
					console.log("Your nexmo account does not have sufficient credit to process this request")
					io.emit('planMsg', { "output": "Our server is busy now. Please try again!" })
				} else if (respData.resData.result.status == 10) {
					console.log("Concurrent verifications to the same number are not allowed")
					io.emit('planMsg', { "output": "Our server is busy now. Please try again after 5 minutes" })
				} else if (respData.resData.result.status == 15) {
					console.log("The destination number is not in a supported network")
					io.emit('planMsg', { "output": "Please check your registered phone number and try again!" })
				} else {
					io.emit('planMsg', { "output": "Our server is busy now. Please try again after some time" })
				}
				// else{
				//     loginSuccessMessage(req.body.href,"You are successfully logged in! Server is busy now, please try agian after 5 minutes for verification.")

				// }
				res.send({ key: 'success', value: "success" });

			})	
		}
		else
		{
			// 	outputd={
			// 	"data":" Please check your credentials"
			// }
			console.log("into not success");
			io.emit('send message', { "output": " Please check your credentials" })
			res.send({ key: 'Wrong Credentials', value: "Wrong Credentials" });
		}
	});

	
		
		socket.on('chat message', function (msg) {
				var payload = {
					workspace_id: '0693f46e-5e4e-4d48-88b7-faf08c6c3131',
					input: {
						"text": msg.input
					},
					context: context
				}
				assistant.message(payload, function (err, response) {
					if (err) {
						//console.log('error:', err);
					}
					else {
						context = response.context;
						//context.username = name;
						
						////console.log("JSON.parse(response.output.text[0])",JSON.parse(response));
						//response.output.name = name;
						//console.log("response",response);
						
						if(!response.output.text[0].includes("action")){
						////console.log("response.output.text[0]",JSON.parse(response.output.text[0]));
							outputd =
								{
									"message":response.output.text[0]
								}
								
							

							socket.emit('send message', { "output": outputd })
						}
						else if(JSON.parse(response.output.text[0]).action == 'forward')
						{
							console.log("inside forward");
							outputd = JSON.parse(response.output.text[0]);
							//console.log("inside forward",outputd);
							socket.emit('send message', { "output": outputd })
						}
						else if(JSON.parse(response.output.text[0]).action == 'process')
						{
							//console.log("inside else");
							if(JSON.parse(response.output.text[0]).data.function == 'Prepaid')
							{
								outputd = JSON.parse(response.output.text[0]);
							//console.log("inside Prepaid",outputd.data);
							socket.emit('send message', { "output": outputd.data })
							}
							else if(JSON.parse(response.output.text[0]).data.function == 'Postpaid')
							{
								outputd = JSON.parse(response.output.text[0]);
							//console.log("inside Postpaid",outputd.data);
							socket.emit('send message', { "output": outputd.data })
							}
							else if(JSON.parse(response.output.text[0]).data.function == 'Broadband')
							{
								outputd = JSON.parse(response.output.text[0]);
							//console.log("inside Broadband",outputd.data);
							socket.emit('send message', { "output": outputd.data })
							}
							else if(JSON.parse(response.output.text[0]).data.function == 'SimCard')
							{
								outputd = JSON.parse(response.output.text[0]);
							//console.log("inside SimCard",outputd.data);
							socket.emit('send message', { "output": outputd.data })
							}
							else if(JSON.parse(response.output.text[0]).data.function == 'AddOns')
							{
								//console.log("inside addon");
								outputd = JSON.parse(response.output.text[0]);
							   socket.emit('send message', { "output": outputd.data })
							}else if(JSON.parse(response.output.text[0]).data.function == 'OTP'){

								TFACheck({ requestId: NexmoRequestId, pin: msg.input }).then((respData) => {
									if (respData.resData == 0) {
										outputd = JSON.parse(response.output.text[0]);
										console.log("outputd inside OTP",outputd);
										socket.emit('send message', { "output": outputd.data })
											//  messageLocal=afterOtpProcess;
									} else if (respData.resData == 2) {
										console.log("Missed the mandatory parameter")
										outputd = {}
										outputd.message = "You have entered wrong Verification code. Please try again!"
										socket.emit('send message', { "output": outputd })
									} else if (respData.resData == 6) {
										outputd = {}
										outputd.message = "You have entered wrong Verification code. Please try again!y";
										console.log('verification code has been expired');
										socket.emit('send message', { "output": outputd })
									} else if (respData.resData == 16) {
										outputd = {}
										outputd.message = "That is an invalid verification code, please try again!";
										console.log('Invalid verification code');
										socket.emit('send message', { "output": outputd })
									} else if (respData.resData == 17) {
										outputd = {}
										outputd.message = "No of wrong attempts reached, your account is locked out for 5 min from now.";
										socket.emit('send message', { "output": outputd })
									} else {
										outputd = {}
										outputd.message = "Server is busy now, please try again after 10 minutes";
										socket.emit('send message', { "output": outputd })			
									}
								});
							}
							
							
						}
					}
				});


			})
	
	socket.on('disconnect', function () {
		//console.log("bot disconnected");
	});
});
