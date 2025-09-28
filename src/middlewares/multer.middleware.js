import multer from 'multer';
import { ApiError } from '../utils/ApiError.util.js';


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        
        cb(null, './public/temp'); 
    },
    filename: function (req, file, cb) {
        
        cb(null, file.originalname); 
    }
});


const csvFileFilter = (req, file, cb) => {
    
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'application/csv') {
        cb(null, true); 
    } else {
        
        cb(new ApiError(400, "Only CSV files are allowed for product import."), false); 
    }
};


export const uploadCSV = multer({ 
    storage: storage,
    fileFilter: csvFileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 
    }
});