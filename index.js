const express = require('express') 
const app = express() 
const port = 3000 //ssh에서는 3001
const mysql = require('mysql')
const dbconfig = require('./config/database.js')
const connection = mysql.createConnection(dbconfig)
const s3config = require('./config/s3.js') //ssh에서는 없앰
const bodyParser = require('body-parser')
const cors = require('cors')
const searchRouter = require('./routes/searchRouter')
const uploadRouter = require('./routes/uploadRouter')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())

connection.connect(err => {
	if (err) throw err;
	console.log('db connected')
})

app.get('/', (req, res) => {
	res.send('main')
})

app.use('/', uploadRouter)

app.use('/', searchRouter)

app.use((req, res, next) => {
	const err =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`)
	err.status = 404;
	res.json({ index_success: false, err })
  })

app.listen(port, () => {
	console.log(`Example app listening on port ${port}!`)
}) 

// connection.end()