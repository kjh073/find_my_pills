const express = require('express') 
const app = express() 
const port = 3000 
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const s3config = require('./config/s3.js')
const bodyParser = require('body-parser')
// const router = express.Router();
// const upload = require('./modules/multer');
// const { controller } = require('./controllers');
const connection = mysql.createConnection(dbconfig)
// app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }))
const AWS = require('aws-sdk');


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


const { v4 } = require('uuid');
console.log(v4());
const uuid = v4();

const multer = require('multer');
const multerS3 = require('multer-s3');

const s3 = new AWS.S3();
const upload = multer({  
	storage: multerS3({       
		s3: s3,
		bucket: 'user-pills',
		key: function (req, file, cb) {
		cb(null, `${Date.now()}${uuid}`);
		},
	}),
});

app.post('/upload', upload.single('test'), (req, res) => {
	const input = req.body
	console.log(req.file);
	// res.json({ url: req.file.location }); //file.location이 이미지 저장된 링크
	connection.query(`insert into pill_image_url values(${input.id}, '${req.file.location}')`), (err, rows, fields) => {
		if (err) {
			return res.json({ success: false, err });
		}
		res.send(rows);
	}
});

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
	//식별문자 앞 뒤가 있네,, 뒷편 문자는 optional한디 그러면 어쨌든 빈값 들어오는거 고려해야
	//분할선도 앞 뒤가 있네,,,
	//sql문 줄여야할 것 같은데 escape vs ?
	connection.query('select * from pills where char_front=? and line_front=? and shape=? pill_type=?and color=?', [input.shape, input.color], (err, rows, fields) => {
		if(err) return res.json({ success: false, err })
		res.send(rows)
	// 클라이언트로 식별번호나 약 이름 전달
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