const express = require('express') 
const router = express.Router()
const mysql = require('mysql')
const dbconfig = require('../config/database.js')
const connection = mysql.createConnection(dbconfig)
const s3config = require('../config/s3.js') //ssh에서는 없앰
const image = require('../modules/multer.js')
const { v4 } = require('uuid')
var request = require('request')

router.post('/upload', image.upload.array('img'), image.uploadErrorHandler, (req, res) => { 
	const files  = req.files
	const uuid = v4() 
	// 파일 업로드 실패
	if (!files) {
		return res.status(400).json({ success: false, message: 'File upload failed' })
	}

	for (let i = 0; i < files.length; i++) {
		// 파일 크기 5MB 제한
		if (files[i] && (files[i].size > image.upload.limits)) {
			return res.status(413).send({ error: 'File is too large' })
		}
	}

	connection.query(`insert into pill_image_url values('${uuid}', '${files[0].location}', '${files[1].location}')`, (err, rows) => {
    if (err) {
      return res.json({ success: false, err })
    }

    const modelResult = (callback) => {
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
        })
      })
    }

    modelResult((err, {result} = {}) => {
      if(err) {
        console.log("error!")
        res.send({
          message: "fail",
          status: "fail"
        })
      }
      let json = JSON.parse(result)
      var results = [json.result1, json.result2, json.result3, json.result4, json.result5]
        var queryResults = []

      function queryDatabase(index) {
        if (index >= results.length) {
          return res.status(200).json(queryResults)
        }

        var sql = 'SELECT * FROM pills WHERE name = ?';
        var param = [results[index]]

        connection.query(sql, param, (err, row) => {
        if (err) {
          return res.json({ success: false, err })
        }

        if (row[0]) {
          queryResults.push({
            name: `${results[index]}`,
            pill_img: `${row[0].pill_img}`,
            id: `${row[0].id}`
          })
        }
        queryDatabase(index + 1)
        })
      }
      queryDatabase(0)
      })
    })
})

module.exports = router