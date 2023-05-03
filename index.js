const express = require('express') //express 모듈 가져옴
const app = express() //함수를 이용해 새로운 app을 만듦
const port = 3000 //3000번 포트를 백서버로 둠
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const bodyParser = require('body-parser')
// const router = express.Router();
// const upload = require('./modules/multer');
// const { controller } = require('./controllers');
const connection = mysql.createConnection(dbconfig)
// app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }))


connection.connect(function(err) {
	if (err) throw err;
	console.log('db connected')
});

app.get('/', (req, res) => {
	res.send('main')
})

app.get('/select', (req, res) => {
	res.send('검색방법 선택')
})

app.get('/upload', (req, res) => {
	res.send('이미지 업로드')
})

app.post('/search', (req, res) => {
	const input = req.body
	res.send(input)
})

app.get('/search-fail', (req, res) => {
	res.send('인식 실패')
})

app.get('/loading', (req, res) => {
	res.send('검색 중')
})

app.post('/check', (req, res) => {
	const input = req.body
	connection.query('select * from pills where shape=? and color=?', [input.shape, input.color], (err, rows, fields) => {
		if (err) throw err;
		res.send(rows)
	// 클라이언트로 사진 전달
	})
})

app.get('/info', (req, res) => {
	res.send('검색 중')
})

// router.post('/image', upload.single('image'), controller.image.post);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
}) 



// connection.end()