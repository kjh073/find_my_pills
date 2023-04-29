const express = require('express') //express 모듈 가져옴
const app = express() //함수를 이용해 새로운 app을 만듦
const port = 3000 //3000번 포트를 백서버로 둠
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const connection = mysql.createConnection(dbconfig)

connection.connect(function(err) {
	if (err) throw err;
	console.log('db connected')
});

app.get('/', (req, res) => {
	res.send('main')
})

app.get('/users', (req, res) => {
	connection.query('select * from pills', (err, rows) => {
		if (err) throw err;
		res.send(rows)
	})
})

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
}) //3000번 포트에서 실행

// connection.end()