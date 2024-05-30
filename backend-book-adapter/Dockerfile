FROM node:14

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install Tesseract OCR
RUN apt-get update && apt-get install -y tesseract-ocr

COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
