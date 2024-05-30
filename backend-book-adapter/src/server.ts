import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import tesseract from 'node-tesseract-ocr';
import cors from 'cors';

const config = {
  lang: "fra",
  oem: 1,
  psm: 4,
};

const app = express();

app.use(cors());
app.use(express.json());

const BOOK_DIR = path.join(__dirname, '../books');

interface ParamsBookNameAndImageName {
  bookName: string;
  imageName: string;
}

app.get('/api/getBookImage/:bookName/:imageName', (req: Request<ParamsBookNameAndImageName>, res: Response) => {
  const { bookName, imageName } = req.params;

  const bookDirectory = path.join(BOOK_DIR, bookName);
  const imagePath = path.join(bookDirectory, 'images', `${imageName}`);

  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.sendFile(imagePath);
});

interface ParamsUpdatePageText {
  bookName: string;
  imageName: string;
  newText: string;
}

app.post('/api/updateTextOfPage', (req: Request<{}, {}, ParamsUpdatePageText>, res: Response) => {
  try {
    const { bookName, imageName, newText } = req.body;

    if (!bookName || !imageName || !newText) {
      return res.status(400).json({ error: 'bookName, imageName, and newText parameters are required' });
    }

    const bookDirectory = path.join(BOOK_DIR, bookName);
    if (!fs.existsSync(bookDirectory)) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const textDirectory = path.join(bookDirectory, 'texts');
    if (!fs.existsSync(textDirectory)) {
      fs.mkdirSync(textDirectory);
    }

    const textFilePath = path.join(textDirectory, `${imageName}.txt`);
    fs.writeFileSync(textFilePath, newText, 'utf8');
    console.log(`Updated text file for ${textFilePath}`);

    res.json({ message: 'Text updated successfully' });
  } catch (error) {
    console.error('Error processing /api/updateTextOfPage', error);
    res.status(500).json({ error: 'Failed to update text' });
  }
});

interface ParamsBookName {
  bookName: string;
}

app.get('/api/getBookMetaInfos', (req: Request<{}, {}, {}, ParamsBookName>, res: Response) => {
  const { bookName } = req.query;

  if (bookName) {
    const bookDirectory = path.join(BOOK_DIR, bookName);
    if (!fs.existsSync(bookDirectory)) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const imgDirectory = path.join(bookDirectory, 'images');
    if (!fs.existsSync(imgDirectory)) {
      fs.mkdirSync(imgDirectory);
    }
    const imgsNames = fs.readdirSync(imgDirectory);
    imgsNames.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    const metaInfos = imgsNames.map((file, index) => {
      const imageName = path.parse(file).name;

      return {
        name: imageName,
        index: index + 1
      };
    });

    return res.json(metaInfos);
  } else {
    res.status(400).send('bookName parameter is required');
  }
});

interface ParamsBookNamePageName {
  bookName: string;
  imageName: string;
}

app.get('/api/getTextOfImage', async (req: Request<{}, {}, {}, ParamsBookNamePageName>, res: Response) => {
  try {
    const { bookName, imageName } = req.query;

    if (!bookName || !imageName) {
      return res.status(400).json({ error: 'bookName and imageName parameters are required' });
    }

    const bookDirectory = path.join(BOOK_DIR, bookName);
    if (!fs.existsSync(bookDirectory)) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const imgDirectory = path.join(bookDirectory, 'images');
    const imagePath = path.join(imgDirectory, `${imageName}.png`);
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const textFilePath = path.join(bookDirectory, 'texts', `${imageName}.txt`);
    if (!fs.existsSync(textFilePath)) {
      try {
       
        const text = await tesseract.recognize(imagePath, config);
        fs.writeFileSync(textFilePath, text, 'utf8');
        console.log(`Created text file for ${textFilePath}`);
        res.json({ text });
      } catch (error) {
        console.error(`Error processing ${textFilePath}:`, error);
        res.status(500).json({ error: 'Failed to process image with OCR' });
      }
    } else {
      const text = fs.readFileSync(textFilePath, 'utf-8');
      res.json({ text });
    }
  } catch (error) {
    console.error('Error processing api/getTextOfImage', error);
    res.status(500).json({ error: 'Failed to process image with OCR' });
  }
});


app.get('/api/getBooksNames', (req, res) => {
  if (!fs.existsSync(BOOK_DIR)) {
    fs.mkdirSync(BOOK_DIR);
  }
  const booksNames = fs.readdirSync(BOOK_DIR);
  return res.json(booksNames);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
