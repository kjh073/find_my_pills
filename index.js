const express = require('express') 
const app = express() 
const port = 3000 //ssh에서는 3001
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const connection = mysql.createConnection(dbconfig)
const s3config = require('./config/s3.js') //ssh에서는 없앰
const bodyParser = require('body-parser')
const image = require('./modules/multer.js');
const cors = require('cors')
const { v4 } = require('uuid');
var request = require('request');
const searchRouter = require('./routes/searchRouter');
// const uploadRouter = require('./routes/uploadRouter');

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

connection.connect(err => {
	if (err) throw err;
	console.log('db connected')
});

app.get('/', (req, res) => {
	res.send('main')
})

// app.use('/', uploadRouter);
app.post('/upload', image.upload.array('img'), image.uploadErrorHandler, (req, res) => { 
	const input = req.body;
	const files  = req.files;
	const uuid = v4(); 
	// 파일 업로드 실패
	if (!files) {
		return res.status(400).json({ success: false, message: 'File upload failed' });
	}
	for (let i = 0; i < files.length; i++) {
		// 파일 크기 5MB 제한
		if (files[i] && (files[i].size > image.upload.limits)) {
			return res.status(413).send({ error: 'File is too large' });
		}
	}
	connection.query(`insert into pill_image_url values('${uuid}', '${files[0].location}', '${files[1].location}')`, (err, rows) => {
	if (err) {
		return res.json({ success: false, err });
	}

	const modelResult = (callback)=>{
		const options = {
			method: 'POST',
			uri: "http://127.0.0.1:5000/search/image",
			qs: {
				file_name: `${files[0].location},${files[1].location}`
			}
		}
		request(options, function (err, res, body) {
			callback(undefined, {
				result:body
			});
		});
	}

	modelResult((err, {result}={})=>{
		if(err){
			console.log("error!!!!");
			res.send({
				message: "fail",
				status: "fail"
			});
		}
		let json = JSON.parse(result);
		// res.send({
		// 	message: "from flask",
		// 	status: "success",
		// 	data:{
		// 		json
		// 	}
		// });
		var sql = 'SELECT * FROM pills WHERE name=?';
		var param = [json.result]
		// connection.query(sql, param, (err, row) => {
		// 	if(err) return res.json({ success: false, err })
		// 	return res.status(200).json({ success: true, name : `${json.result}`, pill_img : `${row[0].pill_img}`, id : `${row[0].id}`, res_type : `${json.res_type}` })
		// 	})
		return res.status(200).json({ name : `${json.result}` })
		})
	});
});

app.use('/', searchRouter);

app.use((req, res, next) => {
	const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	res.json({ index_success: false, error });
  });

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
}) 

// connection.end()