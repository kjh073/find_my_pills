const express = require('express') 
const app = express() 
const port = 3000 
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const s3config = require('./config/s3.js')
const bodyParser = require('body-parser')
// const router = express.Router();
const upload = require('./modules/multer.js');
// const { controller } = require('./controllers');
const connection = mysql.createConnection(dbconfig)
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

//db에 링크랑 아이디 저장해야돼서 /upload/:id로 아이디를 받아야 할듯?
app.post('/upload', upload.single('test'), (req, res) => { 
	const input = req.body
	console.log(req.file);
	//file.location이 이미지 저장된 링크
	connection.query(`insert into pill_image_url values(${ input.id }, '${ req.file.location }')`), (err, rows, fields) => {
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
	connection.query('select * from pills where char_front=? and line_front=? and shape=? pill_type=? and color=?', [input.shape, input.color], (err, rows, fields) => {
		if(err) return res.json({ success: false, err })
		res.send(row.name)
	// 클라이언트로 식별번호나 약 이름 전달
	})
})

app.get('/info', (req, res) => {
	res.send('검색 중')
})

app.use((req, res, next) => {
	const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
	error.status = 404;
	next(error);
  });
  
  app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
	res.status(err.status || 500);
	res.render('error');
  });

// router.post('/image', upload.single('image'), controller.image.post);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
}) 

// connection.end()
