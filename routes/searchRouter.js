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
	}
	if (param_cnt == 0) {
		sql = 'select * from pills'
	}
	// 클라이언트로 식별번호나 약 이름 전달
	connection.query(sql, params, (err, row) => {
		if (err) return res.json({ success: false, err });
		else {
		  const searchString = input.char_front.toLowerCase();
		  const idsToUpdate = [];
	  
		  row.forEach(item => {
			let matchCount = 0;
			const charFront = item.char_front.toLowerCase();
			const charBack = item.char_back.toLowerCase();
	  
			for (let i = 0; i < searchString.length; i++) {
			  if (charFront.includes(searchString[i])) {
				if (charBack.includes(searchString[i])) {
				  matchCount++;
				}
				matchCount++;
			  }
			}
	  
			if (matchCount > 0 && matchCount <= searchString.length) {
			  idsToUpdate.push({ id: item.id, matchCount: matchCount });
			}
		  });
	  
		  const zeroQuery = 'UPDATE pills SET `match` = 0';
	  
		  connection.query(zeroQuery, (error, results) => {
			if (error) return res.json({ success: false, error });
	  
			console.log('Match reset query executed successfully.');
	  
			const secondQuery = 'UPDATE pills SET `match` = `match` + ? WHERE id = ?';
	  
			let updateCount = 0;
	  
			idsToUpdate.forEach(item => {
			  connection.query(secondQuery, [item.matchCount, item.id], (err, results) => {
				if (err) return res.json({ success: false, err });
	  
				updateCount++;
	  
				if (updateCount === idsToUpdate.length) {
				  console.log('Update queries executed successfully.');
				  const sortedRow = row.sort((a, b) => b.match - a.match);
				  res.json(sortedRow);
				}
			  });
			});
		  });
		}
	});
})

module.exports = router;