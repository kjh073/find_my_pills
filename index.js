const express = require('express') 
const app = express() 
const port = 3000 
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const s3config = require('./config/s3.js')
const bodyParser = require('body-parser')
const upload = require('./modules/multer.js');
// const uploadRouter = require('./routes/uploadRouter');
// const { controller } = require('./controllers');
const connection = mysql.createConnection(dbconfig)
app.use(bodyParser.urlencoded({ extended: true }))


connection.connect(err => {
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
// app.use('/', uploadRouter);
app.post('/upload', upload.single('test'), (req, res) => { 
	const input = req.body
	// console.log(req.file);
	//db에 사용자 id와 이미지 저장된 링크 저장
	connection.query(`insert into pill_image_url values(${input.id}, '${req.file.location}')`, (err, rows) => {
		if (err) {
			return res.json({ success: false, err });
		}
		return res.status(200).json({ //200은 성공했다는 뜻
			success: true
		})
		// console.log(rows)
		// res.send(rows);
	});
});

app.post('/search', (req, res) => {
	const input = req.body
	//식별문자 앞 뒤가 있네,, 뒷편 문자는 optional한디 그러면 어쨌든 빈값 들어오는거 고려해야
	//분할선도 앞 뒤가 있네,,,
	//근데 이렇게 쓰면 유저가 앞뒤를 어떻게 구별하지?
	var sql = 'select name from pills where (char_front=? or char_back=?) \
				and (line_front=? or line_back=?) and shape=? pill_type=? and color=?'
	var params = [input.char_front, input.char_front, input.line_front, 
				input.line_back, input.shape, input.pill_type, input.color]
	if (input.char_back) {
		sql += 'and char_back=?'
		params.push(input.char_back)
	}
	//sql문 줄여야할 것 같은데 escape vs ?
	// 클라이언트로 식별번호나 약 이름 전달
	connection.query(sql, params, (err, result) => {
	// connection.query('select name from pills where char_front=? and line_front=? and shape=? pill_type=? and color=?', [input.shape, input.color], (err, result, fields) => {
	// connection.query('select name from pills where shape=?', [input.shape], (err, result, fields) => {
	if(err) return res.json({ success: false, err })
	//만약에 찾는 약이 없으면?
	//검색결과가 있다면
	if (result.length > 0) {
		res.redirect('/check?searchData=' + encodeURIComponent(JSON.stringify(result)));
	} else {
		// 검색 결과가 없으면
		res.redirect('/search-fail');
	}
})

app.get('/search-fail', (req, res) => {
	res.send('인식 실패')
})

app.get('/loading', (req, res) => {
	res.send('검색 중')
})

app.post('/check', (req, res) => {
	// /search에서 보낸 결과
	const searchData = JSON.parse(req.query.searchData);
	res.send('약 맞는지 확인')
	})
})

app.get('/info', (req, res) => {
	res.send('약 정보 출력')
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
	res.json({ index_success: false, err });
  });

// router.post('/image', upload.single('image'), controller.image.post);

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
}) 

// connection.end()
