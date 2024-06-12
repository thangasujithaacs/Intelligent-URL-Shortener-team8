import { Client, Databases, Storage } from 'node-appwrite';
import QRCode from 'qrcode';
import { promises as fs } from 'fs';

/**
 * @typedef {Object} URLEntry
 * @property {string} url
 *
 * @typedef {import('node-appwrite').Models.Document & URLEntry} URLEntryDocument
 */

class AppwriteService {
  constructor() {
    const client = new Client();
    client
      .setEndpoint(
        process.env.APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
      )
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    this.databases = new Databases(client);
    this.storage = new Storage(client);
  }

  async generateQRCode(shortenedURL) {
    try {
        // Generate QR code image
        const qrCodeBuffer = await QRCode.toBuffer(shortenedURL);

        // Save QR code image to file
        await fs.writeFile('/tmp/qrcode.png', qrCodeBuffer);

        // Upload QR code image to Appwrite storage
        // const file = await storage.createFile('/tmp/qrcode.png', ['*'], ['*']);
      //   const file = storage.createFile(
      //     '66696eca000cdd114a29',
      //     ID.unique(),
      //     document.getElementById('uploader').files[0]
      // );
        const qrCodeStream = new Readable();
        qrCodeStream.push(qrCodeBuffer);
        qrCodeStream.push(null); // Signal end of stream

        const file = await this.storage.createFile('[66696eca000cdd114a29', 'qrcode.png', qrCodeStream, 'image/png');
        return file.$id; // Return the file ID of the uploaded image
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
  }
 
  /**
   * @param {string} shortCode
   * @returns {Promise<URLEntryDocument | null>}
   */
  async getURLEntry(shortCode) {
    try {
      const document = /** @type {URLEntryDocument} */ (
        await this.databases.getDocument(
          "666926460035dca8000d",
          "6669267e000a824e00b9",
          shortCode
        )
      );

      return document;
    } catch (err) {
      if (err.code !== 404) throw err;
      return null;
    }
  }

  /**
   * @param {string} url
   * @param {string} shortCode
   * @returns {Promise<URLEntryDocument | null>}
   */
  async createURLEntry(url, shortCode) {
    try {
      console.log('Attempting to create document with URL:', url, 'and shortCode:', shortCode);
      console.log('Using Database ID:', process.env.APPWRITE_DATABASE_ID);
      console.log('Using Collection ID:', process.env.APPWRITE_COLLECTION_ID);
      const document = /** @type {URLEntryDocument} */ (
        await this.databases.createDocument(
          "666926460035dca8000d",
          "6669267e000a824e00b9",
          shortCode,
          {
            url,
          }
        )
      );
      console.log('Document created successfully:', document);
      return document;
    } catch (err) {
      if (err.code !== 409) throw err;
      return err;
    }
  }

  /**
   * @returns {Promise<boolean>}
   */
  async doesURLEntryDatabaseExist() {
    try {
      await this.databases.get(process.env.APPWRITE_DATABASE_ID);
      return true;
    } catch (err) {
      if (err.code !== 404) throw err;
      return false;
    }
  }

  async setupURLEntryDatabase() {
    try {
      await this.databases.create(
        process.env.APPWRITE_DATABASE_ID,
        'URL Shortener'
      );
    } catch (err) {
      // If resource already exists, we can ignore the error
      if (err.code !== 409) throw err;
    }
    try {
      await this.databases.createCollection(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_COLLECTION_ID,
        'URLs'
      );
    } catch (err) {
      if (err.code !== 409) throw err;
    }
    try {
      await this.databases.createUrlAttribute(
        process.env.APPWRITE_DATABASE_ID,
        process.env.APPWRITE_COLLECTION_ID,
        'url',
        true
      );
    } catch (err) {
      if (err.code !== 409) throw err;
    }
  }

  
}

export default AppwriteService;
