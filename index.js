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
// const uploadRouter = require('./routes/uploadRouter');
// const { controller } = require('./controllers');

app.use(bodyParser.urlencoded({ extended: true }))
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
		if (files[i] && files[i].size > img_function.upload.limit) {
			return res.status(413).send({ error: 'File is too large' });
		}
	}
	connection.query(`insert into pill_image_url values('${uuid}', '${files[0].location}', '${files[1].location}')`, (err, rows) => {
	if (err) {
		return res.json({ success: false, err });
	}
	return res.status(200).json({ success: true })
	// res.send(rows);
	});
});

app.post('/search/text', (req, res) => {
	const input = req.body
	//char_front로 들어오는 알파벳에서 그 알파벳이 필수로 포함되면서 떨어져 있어도 되는 그런 식 없나?
	// var sql = 'select name from pills where shape=? and pill_type=? and color_front=?'
	// 	// and (char_front regexp \'[?]\' or char_back regexp \'[?]\')'
	// var sql = 'select name from pills where (char_front=? or char_back=?) and (line_front=? or line_back=?) and shape=? pill_type=? and color=?'
	// var params = [input.shape, input.pill_type, input.color, input.char_front, input.char_front]
	var sql = 'SELECT name FROM pills WHERE shape=? AND pill_type=? AND color_front=? AND (char_front regexp "[?]" OR char_back regexp "[?]")';
	var params = [input.shape, input.pill_type, input.color, input.char_front, input.char_front];

	if (input.line != '-') {
		sql += 'and (char_front regexp ? OR char_back regexp ?)'
		params.push(input.line)
		params.push(input.line)
	}
	if (input.char_back) {
		sql += 'and (char_front=? OR char_back=?)'
		params.push(input.char_back)
		params.push(input.char_back)
	}
	// 클라이언트로 식별번호나 약 이름 전달
	connection.query(sql, params, (err, row) => {
		if(err) return res.json({ success: false, err })
		res.send(row)
	})
	// 만약에 검색해서 나온게 2개 이상이면 그 때 문자 뒷면 검색하면 될듯?
	// 사람들한테 여러개 보여줄거면 할 필요 없음
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