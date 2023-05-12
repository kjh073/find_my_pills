const express = require('express') 
const app = express() 
const port = 3000 
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const connection = mysql.createConnection(dbconfig)
const s3config = require('./config/s3.js')
const bodyParser = require('body-parser')
const upload = require('./modules/multer.js');
// const uploadRouter = require('./routes/uploadRouter');
// const { controller } = require('./controllers');
app.use(bodyParser.urlencoded({ extended: true }))

connection.connect(err => {
	if (err) throw err;
	console.log('db connected')
});

app.get('/', (req, res) => {
	res.send('main')
})

// app.use('/', uploadRouter);
// app.post('/upload/front', upload.single('img'), (req, res) => { 
// 	const input = req.body
// 	// console.log(req.file)
// 	//파일 크기 5MB 제한
// 	if (req.file && req.file.size > upload.limits.fileSize) {
// 		return res.status(413).send({ error: 'File too large' });
// 	}
// 	//db에 사용자 id와 이미지 저장된 링크 저장
// 	connection.query(`insert into pill_image_url values(${input.id}, '${req.file.location}')`, (err, rows) => {
// 		if (err) {
// 			return res.json({ success: false, err });
// 		}
// 		return res.status(200).json({
// 			success: true
// 		})
// 		// res.send(rows);
// 	});
// });

app.post('/upload', upload.array('img'), (req, res) => { 
	const input = req.body
	let files  = req.files
	// return res.json({success: true})
	for (let i = 0; i < files.length ; i++ ) {
		// 파일 크기 5MB 제한
		if (files[i] && files[i].size > upload.limit) {
			return res.status(413).send({ error: 'File too large' });
		}
	}
	// db에 사용자 id와 일치하는 이미지 저장된 링크 저장
	connection.query(`insert into pill_image_url values(${input.id}, '${files[0].location}', '${files[1].location}')`, (err, rows) => {
	if (err) {
		return res.json({ success: false, err });
	}
	return res.status(200).json({
		success: true
	})
	// res.send(rows);
	});
});

app.post('/search/text', (req, res) => {
	const input = req.body
	//식별문자 앞 뒤가 있네,, 뒷편 문자는 optional한디 그러면 어쨌든 빈값 들어오는거 고려해야
	//분할선도 앞 뒤가 있네,,, '분할선' '십자분할선'으로 들어오면 like를 써야되는데 
	//근데 이렇게 쓰면 유저가 앞뒤를 어떻게 구별하지?
	var sql = 'select name from pills where shape=? pill_type=? and color=? \
	(char_front regex_like [?] or char_back regex_like [?])'
	// var sql = 'select name from pills where (char_front=? or char_back=?) \
	// 			and (line_front=? or line_back=?) and shape=? pill_type=? and color=?'
	var params = [input.shape, input.pill_type, input.color, input.char_front, input.char_front, input.line_front, 
		input.line_back]
	if (input.char_back) {
		sql += 'and char_back regex_like [?]'
		params.push(input.char_back)
	}
	// 클라이언트로 식별번호나 약 이름 전달
	connection.query(sql, params, (err, result) => {
		if(err) return res.json({ success: false, err })
		res.send(row.name)
	})
})

app.use((req, res, next) => {
	const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	res.json({ index_success: false, error });
  });
  
// app.use((err, req, res, next) => {
// 	res.locals.message = err.message;
// 	res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
// 	res.status(err.status || 500);
// 	res.json({ index_success: false, err });
// });

// router.post('/image', upload.single('image'), controller.image.post);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
}) 

// connection.end()