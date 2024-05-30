"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_tesseract_ocr_1 = __importDefault(require("node-tesseract-ocr"));
const cors_1 = __importDefault(require("cors"));
const config = {
    lang: "fra",
    oem: 1,
    psm: 4,
};
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const IMAGES_DIR = path_1.default.join(__dirname, 'images');
const TEXT_DIR = path_1.default.join(__dirname, 'texts');
// Ensure the TEXT_DIR exists
if (!fs_1.default.existsSync(TEXT_DIR)) {
    fs_1.default.mkdirSync(TEXT_DIR);
}
app.use('/images', express_1.default.static(IMAGES_DIR));
app.use('/texts', express_1.default.static(TEXT_DIR));
app.get('/api/getMetaInfos', (req, res) => {
    fs_1.default.readdir(IMAGES_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read images directory' });
        }
        files = files.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
        const metaInfos = files.map((file, index) => {
            const imageName = path_1.default.parse(file).name;
            return {
                name: imageName,
                index: index + 1
            };
        });
        return res.json(metaInfos);
    });
});
app.get('/api/getText', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const imageName = req.query.name;
    if (!imageName) {
        return res.status(400).json({ error: 'Image name is required' });
    }
    const textFilePath = path_1.default.join(TEXT_DIR, `${imageName}.txt`);
    if (!fs_1.default.existsSync(textFilePath)) {
        const imagePath = path_1.default.join(IMAGES_DIR, `${imageName}.png`);
        // Process the image with Tesseract
        try {
            const text = yield node_tesseract_ocr_1.default.recognize(imagePath, config);
            // Write the OCR result to a text file
            fs_1.default.writeFileSync(textFilePath, text, 'utf8');
            console.log(`Created text file for ${textFilePath}`);
            res.json({ text });
        }
        catch (error) {
            console.error(`Error processing ${textFilePath}:`, error);
            res.status(500).json({ error: 'Failed to process image with OCR' });
        }
    }
    else {
        const text = fs_1.default.readFileSync(textFilePath, 'utf-8');
        res.json({ text });
    }
}));
app.post('/api/saveText', (req, res) => {
    const { name, text } = req.body;
    if (!name || !text) {
        return res.status(400).json({ error: 'Image name and text are required' });
    }
    const textFilePath = path_1.default.join(TEXT_DIR, `${name}.txt`);
    fs_1.default.writeFileSync(textFilePath, text, 'utf8');
    res.json({ message: 'Text saved successfully' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
