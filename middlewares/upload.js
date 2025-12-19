import multer from 'multer';
import path from 'path';
import fs from 'fs'; // thư viện fs để làm việc với hệ thống file


// tạo thư mục nếu chưa có 
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ của multer
const storage = multer.diskStorage({
    destination: (req, file, cd) => {
        cd(null, uploadDir);
    },
    filename: (req, file, cd) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cd(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Lọc file để chỉ chấp nhận các định dạng hình ảnh
const fileFilter = (req, file, cd) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLocaleLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cd(null, true);
    } else {
        cd(new Error('Invalid file type. Only images and documents are allowed.'));

    }
}

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});
