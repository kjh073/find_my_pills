// 업로드된 사진을 이미지 서버(s3)에 올리기 위한 모듈

const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { v4 } = require('uuid');

const s3 = new AWS.S3();
const upload = multer({  
	storage: multerS3({       
		s3: s3,
		bucket: 'user-pills',
		key: function (req, file, cb) {
		const uuid = v4();
		cb(null, `${Date.now()}${uuid}`) 
		},
	}),
	limits: { filesize: 5 * 1024 * 1024 } //파일 크기 5MB 이하로 제한
});

// s3에 업로드 시 발생하는 에러 핸들러
const uploadErrorHandler = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
	  	res.status(400).json({ success: false, message: err.message });
	} else {
	  	next();
	}
};

exports.upload = upload
exports.uploadErrorHandler = uploadErrorHandler 