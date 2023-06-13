const express = require('express') 
const router = express.Router();
const mysql = require('mysql')
const dbconfig = require('../config/database.js')
const connection = mysql.createConnection(dbconfig)

router.post('/search/text', (req, res) => {
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
	if (input.line != '전체' && input.line != '-') {
		if (param_cnt != 0) {
			sql += ' AND '
		}
		sql += '(char_front regexp ? OR char_back regexp ?)'
		params.push(input.line)
		params.push(input.line)
		prop.push('line')
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
		console.log(input.char_front[0])
	}
	// if (input.char_back) {
	// 	if (param_cnt != 0) {
	// 		sql += ' AND '
	// 	}
	// 	sql += '(char_front=? OR char_back=?)'
	// 	params.push(input.char_back)
	// 	params.push(input.char_back)
	// 	prop.push('char_back')
	// 	param_cnt += 1
	// }
	if (param_cnt == 0) {
		sql = 'select * from pills'
	}
	// 클라이언트로 식별번호나 약 이름 전달
	connection.query(sql, params, (err, row) => {
		if (err) return res.json({ success: false, err })
		else {
			const secondQuery = 'UPDATE pills SET `match` = `match` + 1 WHERE id IN (?)';
		
			const idsToUpdate = row.map(item => item.id);
		
			connection.query(secondQuery, [idsToUpdate], (error, results) => {
			  if (error) return res.json({ success: false, error });
		
			  console.log('Update query executed successfully.');
			  console.log(row[0].match);
			  res.json(row);
			});
		  }
		// row.match += 1
		// console.log(row[0].char_front)
	})
})

module.exports = router;