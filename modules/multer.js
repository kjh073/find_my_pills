const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

// 파일 이름을 위한 uuid 생성
const { v4 } = require('uuid');

// 이미지 저장할 곳
const s3 = new AWS.S3();
const upload = multer({  
	storage: multerS3({       
		s3: s3,
		bucket: 'user-pills',
		key: function (req, file, cb) {
			const uuid = v4(); 
			cb(null, `${Date.now()}${uuid}` + `${file.originalname}`);
		},
	}),
	limits: { filesize: 5 * 1024 * 1024 } //파일 크기 5MB 이하
});

const uploadErrorHandler = (err, req, res, next) => {
	if (err instanceof multer.MulterError) {
	  res.status(400).json({ success: false, message: err.message });
	} else {
	  next();
	}
  };

exports.upload = upload
exports.uploadErrorHandler = uploadErrorHandler 
