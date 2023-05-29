const express = require('express') 
const app = express() 
const port = 3000 //ssh에서는 3001
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const connection = mysql.createConnection(dbconfig)
const s3config = require('./config/s3.js') //ssh에서는 없앰
const bodyParser = require('body-parser')
const img_function = require('./modules/multer.js');
const cors = require('cors')
const { v4 } = require('uuid');
var request = require('request');
// const { PythonShell } = require('python-shell');
// const uploadRouter = require('./routes/uploadRouter');
// const { controller } = require('./controllers');

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
app.post('/upload', img_function.upload.array('img'), img_function.uploadErrorHandler, (req, res) => { 
	const input = req.body;
	const files  = req.files;
	const uuid = v4(); 
	// 파일 업로드 실패
	if (!files) {
		return res.status(400).json({ success: false, message: 'File upload failed' });
	}
	for (let i = 0; i < files.length; i++) {
		// 파일 크기 5MB 제한
		if (files[i] && (files[i].size > img_function.upload.limits)) {
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
			uri: "http://127.0.0.1:5000/test",
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
		connection.query(sql, param, (err, row) => {
			// var json = JSON.parse(input);
			if(err) return res.json({ success: false, err })
			return res.status(200).json({ success: true, name : `${json.result}`, pill_img : `${row[0].pill_img}` })
			console.log(row.name)
			res.json({ row_count : row, name : `${row.name}` })
			// res.json({ input_line : input.line, sql : sql, input : input, search_prop : prop })
	})

	})
	


	// return res.status(200).json({ success: true, name : '가스디알정50밀리그램(디메크로틴산마그네슘)', pill_img : 'https://nedrug.mfds.go.kr/pbp/cmn/itemImageDownload/147426403087300104' })



	});
});

app.post('/search/text', (req, res) => {
	const input = req.body
	var param_cnt = 0;
	var sql = 'SELECT * FROM pills WHERE ';
	var params = [];
	var prop = []

	if (input.shape != '전체') {
		if (param_cnt != 0) {
			sql += ' AND '
		}
		sql += 'shape=?'
		params.push(input.shape)
		prop.push('shape')
		param_cnt += 1
	}
	if (input.pill_type != '전체') {
		if (param_cnt != 0) {
			sql += ' AND '
		}
		if (input.pill_type == '기타') {
			sql += 'pill_type not in ("정제", "경질캡슐제", "연질캡슐제")'
		} else {
			sql += 'pill_type regexp ?'
			params.push(input.pill_type)
			prop.push('pill_type')
		}
		param_cnt += 1
	}
	if (input.color != '전체') {
		if (param_cnt != 0) {
			sql += ' AND '
		}
		sql += 'color_front=?'
		params.push(input.color)
		prop.push('color')
		param_cnt += 1
	}
	if (input.char_front) {
		if (param_cnt != 0) {
			sql += ' AND '
		}
		sql += '(char_front regexp "[?]" OR char_back regexp "[?]")'
		params.push(input.char_front)
		params.push(input.char_front)
		prop.push('char_front')
		param_cnt += 1
	}
	if (input.line != '전체' || input.line != '-') {
		if (param_cnt != 0) {
			sql += ' AND '
		}
		sql += '(char_front regexp ? OR char_back regexp ?)'
		params.push(input.line)
		params.push(input.line)
		prop.push('line')
		param_cnt += 1
	}
	if (input.char_back) {
		if (param_cnt != 0) {
			sql += ' AND '
		}
		sql += '(char_front=? OR char_back=?)'
		params.push(input.char_back)
		params.push(input.char_back)
		prop.push('char_back')
		param_cnt += 1
	}
	// 클라이언트로 식별번호나 약 이름 전달
	connection.query(sql, params, (err, row) => {
		if(err) return res.json({ success: false, err })
		// console.log(row[0].name)
		res.json({ row_count : row, sql: sql })
		// res.json({ input_line : input.line, sql : sql, input : input, search_prop : prop })
	})
})

app.use((req, res, next) => {
	const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	res.json({ index_success: false, error });
  });

// router.post('/image', upload.single('image'), controller.image.post);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
}) 

// connection.end()