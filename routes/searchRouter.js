const express = require('express') 
const router = express.Router()
const mysql = require('mysql')
const dbconfig = require('../config/database.js')
const connection = mysql.createConnection(dbconfig)

router.post('/search/text', async (req, res) => {
	try {
		const input = req.body
		let param_cnt = 0
		let sql = 'SELECT * FROM pills WHERE ';
		const params = []
		const prop = []
		let matchCount = 0
		
		// 유저가 입력하는 알약 속성이 optional하기에 해당 속성이 들어온다면 sql문에 추가
		if (input.shape !== '전체') {
			if (param_cnt !== 0) {
			sql += ' AND ';
			}
			sql += 'shape=?';
			params.push(input.shape);
			prop.push('shape');
			param_cnt += 1;
		}
		if (input.pill_type !== '전체') {
			if (param_cnt !== 0) {
			sql += ' AND ';
			}
			if (input.pill_type === '기타') {
			sql += 'pill_type not in ("정제", "경질캡슐제", "연질캡슐제")';
			} else {
			sql += 'pill_type regexp ?';
			params.push(input.pill_type)
			prop.push('pill_type')
			}
			param_cnt += 1
		}
		if (input.color !== '전체') {
			if (param_cnt !== 0) {
			sql += ' AND ';
			}
			sql += 'color_front=?';
			params.push(input.color)
			prop.push('color')
			param_cnt += 1
		}
		if (input.line !== '전체' && input.line !== '-') {
			if (param_cnt !== 0) {
			sql += ' AND ';
			}
			sql += '(char_front regexp ? OR char_back regexp ?)';
			params.push(input.line)
			params.push(input.line)
			prop.push('line')
			param_cnt += 1;
		}
		if (input.char_front) {
			if (param_cnt !== 0) {
			sql += ' AND ';
			}
			sql += '(char_front regexp "[?]" OR char_back regexp "[?]")';
			params.push(input.char_front)
			params.push(input.char_front)
			prop.push('char_front')
			param_cnt += 1
		}
		// 속성이 아무것도 입력되지 않으면 전체 검색
		if (param_cnt === 0) {
			sql = 'SELECT * FROM pills';
		}
		// 형태, 제형, 색, 분할선, 각인에 대한 쿼리 검색
		const row = await new Promise((resolve, reject) => {
			connection.query(sql, params, (err, rows) => {
				if (err) {
					reject(err)
				} else {
					resolve(rows)
				}
			});
		});

	// 인덱스를 사용해 input각인과 db에 있는 각인 비교, 일치하는 수만큼 matchCount 증가
	const searchString = input.char_front.toLowerCase()
	const idsToUpdate = []
  
	row.forEach(item => {
		let matchCountF = 0
		let matchCountB = 0
		
		const charFront = item.char_front.toLowerCase()
		const charBack = item.char_back.toLowerCase()
  
		let currentIndexF = 0
		let currentIndexB = 0
		let searchIndexF = 0
		let searchIndexB = 0
		
		console.log(charFront, charBack)
		while ((currentIndexF < charFront.length && searchIndexF < searchString.length) 
				&& (currentIndexB < charBack.length && searchIndexB < searchString.length)) {
		  	if (charFront[currentIndexF] === searchString[searchIndexF]) {
				matchCountF++
				searchIndexF++
				currentIndexF++
			}
			else if (charBack[currentIndexB] === searchString[searchIndexB]) {
				matchCountB++
				searchIndexB++
				currentIndexB++
			}
			else {
				currentIndexF++
				currentIndexB++
			}
			if (searchIndexF > matchCountF || searchIndexB > matchCountB) {
				if (searchIndexF > matchCountF) {
					matchCountF = 0
					searchIndexF = 0
				}
				if (searchIndexB > matchCountB) {
					matchCountB = 0
					searchIndexB = 0
				}
			}
		}
		if ((searchIndexF === searchString.length && matchCountF > 0 && matchCountF <= searchString.length)
				|| (searchIndexB === searchString.length && matchCountB > 0 && matchCountB <= searchString.length)) {
			matchCount = Math.max(matchCountF, matchCountB)
			idsToUpdate.push({ id: item.id, match: matchCount})
		}
	})
		// 일치하는 input각인이 없다면 각인을 제외한 속성들과 일치하는 알약 반환
		if (idsToUpdate.length === 0) {
			return res.json(row)
		}
		
		// 검색하기 전 알약들의 match 값을 0으로 변경
		await new Promise((resolve, reject) => {
			const zeroQuery = 'UPDATE pills SET `match` = 0';
			connection.query(zeroQuery, (err) => {
				if (err) {
					reject(err)
				} else {
					resolve()
				}
			});
		});
		
		// db의 각 알약에 해당하는 matchCount값을 match attribute에 저장 
		const secondQuery = 'UPDATE pills SET `match` = `match` + ? WHERE id = ?';
	
		for (const item of idsToUpdate) {
			await new Promise((resolve, reject) => {
			connection.query(secondQuery, [matchCount, item.id], (err) => {
				if (err) {
					reject(err)
				} else {
					resolve()
				}
			})
			})
		}
		
		// match값이 0이 아닌 알약 반환
		const updatedRow = await new Promise((resolve, reject) => {
			const finalQuery = 'SELECT * FROM pills WHERE `match` != 0';
			connection.query(finalQuery, (err, updatedRows) => {
			if (err) {
				reject(err)
			} else {
				resolve(updatedRows)
			}
			});
		});
		// 알파벳이 일치하는 개수가 많은 순으로 내림차순 정렬
		const sortedRow = updatedRow.sort((a, b) => b.match - a.match)
		res.json(sortedRow)
	} catch (err) {
		res.json({ success: false, err })
	}
})
  
module.exports = router
