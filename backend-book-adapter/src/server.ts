import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import tesseract from 'node-tesseract-ocr';
import cors from 'cors';
import axios from 'axios';

const config = {
  lang: "fra",
  oem: 1,
  psm: 6,
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

app.get('/api/getBookPagesInfos', (req: Request<{}, {}, {}, ParamsBookName>, res: Response) => {
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

const ocrMethodeEnum = {
  Tesseract: 'Tesseract',
  OpenAiVision: 'OpenAiVision'
}

interface ParamsTextOfImage {
  bookName: string;
  imageName: string;
  isForceOcr?: string;
  ocrMethode?: string;
  language?: string;
  oem?: number;
  psm?: number;
}

app.get('/api/getTextOfDisplayedImage', async (req: Request<{}, {}, {}, ParamsTextOfImage>, res: Response) => {
  try {

    const { bookName, imageName, isForceOcr, ocrMethode, language, oem, psm } = req.query;

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
    if (fs.existsSync(textFilePath)) {
      const text = fs.readFileSync(textFilePath, 'utf-8');
      const isFromLocal = true;
      return res.json({ text: text, isFromLocal: isFromLocal });
    }

    // var base64str = base64_encode(imagePath);
    // var imageAsBase64 = fs.readFileSync(imagePath, 'base64');
    // var ddsds = image2ToBase64(imagePath);

    // const data = {
    //   model: "llava",
    //   prompt: "tu es un OCR , renvoie le texte  qui est ecrit en Français",
    //   stream: false,
    //   images: [
    //     ddsds  
    //   ]
    // };

    // postData(data);


    const isForceOcrBool = isForceOcr === 'true';
    if (isForceOcrBool === true) {
      try {
        if (!ocrMethode || ocrMethode === ocrMethodeEnum.Tesseract) {
          let configTesseract = {
            lang: language || 'fra',
            oem: oem || 1,
            psm: psm || 6,
          };
          const text = await tesseract.recognize(imagePath, configTesseract);
          fs.writeFileSync(textFilePath, text, 'utf8');

          let result = { text: text, isFromLocal: false }
          console.log(`Created text file for ${textFilePath}`);
          res.json(result);
        }
      } catch (error) {
        console.error(`Error processing ${textFilePath}:`, error);
        res.status(500).json({ error: 'Failed to process image with OCR' });
      }

    } else {
      if (!fs.existsSync(textFilePath)) {
        return res.json({ text: '', isFromLocal: true });
      }
    }
  } catch (error) {
    console.error('Error processing api/getTextOfImage', error);
    res.status(500).json({ error: 'Failed to process image with OCR' });
  }
});


const ocrMethode = {
  Tesseract: 'Tesseract',
  OpenAiVision: 'OpenAiVision'
}

interface ParamsGetTesseractText {
  documentName: string;
  imageName: string;
  language: string;
  oem: number;
  psm: number;
}

app.get('/api/getTesseractText/:documentName/:imageName/:language/:oem/:psm', async (req: Request<ParamsGetTesseractText>, res: Response) => {
  const { documentName, imageName, language, oem, psm } = req.params;

  if (!documentName || !imageName || !language || !oem || !psm) {
    return res.status(400).json({ error: 'documentName, imageName, language, oem, and psm parameters are required' });
  }

  const bookDirectory = path.join(BOOK_DIR, documentName);
  if (!fs.existsSync(bookDirectory)) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const imgDirectory = path.join(bookDirectory, 'images');
  const imagePath = path.join(imgDirectory, `${imageName}.png`);
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  const textFilePath = path.join(bookDirectory, 'texts', `${imageName}.txt`);
  try {
    const config = {
      lang: language,
      oem: oem,
      psm: psm,
    };

    const text = await tesseract.recognize(imagePath, config);
    res.json({ text: text, isFromLocal: false});
  }
  catch (error) {
    console.error(`Error processing ${textFilePath}:`, error);
    res.status(500).json({ error: 'Failed to process image with OCR' });
  }

});

async function postData(data: any) {
  try {
    const response = await axios.post('http://localhost:11434/api/generate', data);
    console.log('Réponse du serveur:', response.data);
  } catch (error: any) {
    console.error('Erreur lors de la requête:', error.message);
  }
}

app.get('/api/getBooksNames', (req, res) => {
  if (!fs.existsSync(BOOK_DIR)) {
    fs.mkdirSync(BOOK_DIR);
  }
  const booksNames = fs.readdirSync(BOOK_DIR);
  return res.json(booksNames);
});

function base64_encode(file: any) {
  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString('base64');
}



function base64_encode2(file: any) {
  // read binary data
  const bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return bitmap.toString('base64');
}


function image2ToBase64(imagePath: string) {
  try {
    // Lire le fichier image
    const imageBuffer = fs.readFileSync(imagePath);

    // Convertir le buffer en base64
    const imageAsBase64 = imageBuffer.toString('base64');

    // Optionnel: vérifier la validité de la chaîne base64
    if (!isBase64(imageAsBase64)) {
      throw new Error("La chaîne base64 n'est pas valide");
    }

    return imageAsBase64;
  } catch (err: any) {
    console.error("Erreur lors de la conversion de l'image en base64:", err.message);
    return null;
  }
}

function isBase64(str: string) {
  const base64Regex = /^(?:[A-Za-z0-9+\/]{4})*?(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
  return base64Regex.test(str);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
