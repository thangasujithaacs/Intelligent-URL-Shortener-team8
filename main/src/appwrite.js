import { Client, Databases, Storage } from 'node-appwrite';
import QRCode from 'qrcode';
import { promises as fs } from 'fs';
import { Readable } from 'stream';

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
      .setProject('666920d300249f8d0648')
      .setKey('758864a5964046685133c6d8a55d320ea493de1b0edc9492231883554e5a7200dfd2e6d9aed00defdec0ca3d32830c761c48c6b2626659abb1d09bcc992f98f84a73ce31566400d77f70c696e56b02e5f219ae8d9030771780771d96b7b540bbf884661a02313d4845ec3057530842e35f06f743e215588b0aa483913c5abc5f');

    this.databases = new Databases(client);
    this.storage = new Storage(client);
  }

  async generateQRCode(shortenedURL) {
    try {
        // Generate QR code image
        const qrCodeBuffer = await QRCode.toBuffer(shortenedURL);
        const fileName = 'qr_code.png';
        // Save QR code image to file
        // await fs.writeFile('/tmp/qrcode.png', qrCodeBuffer);
        const file = await this.storage.createFile('66696eca000cdd114a29', fileName, qrCodeBuffer, 'image/png');
      // );
       // Signal end of stream
        // const file = await this.storage.createFile('[66696eca000cdd114a29', '/tmp/qrcode.png', qrCodeStream, 'image/png');
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
          '666926460035dca8000d',
          '6669267e000a824e00b9',
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
  async createURLEntry(url, shortCode, expirationDate) {
    try {
      console.log('Attempting to create document with URL:', url, 'and shortCode:', shortCode);
      console.log('Using Database ID:', '666926460035dca8000d');
      console.log('Using Collection ID:', '6669267e000a824e00b9');
      const document = /** @type {URLEntryDocument} */ (
        await this.databases.createDocument(
          '666926460035dca8000d',
          '6669267e000a824e00b9',
          shortCode,
          {
            url,
            clicks: 0,
            geoLocation: '',
            deviceType: '',
            referrer: ''
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

  // /**
  //  * @returns {Promise<URLEntryDocument[]>}
  //  */
  // async listURLEntries() {
  //   try {
  //     const response = await this.databases.listDocuments(
  //       process.env.APPWRITE_DATABASE_ID,
  //       process.env.APPWRITE_COLLECTION_ID
  //     );
  //     return response.documents;
  //   } catch (err) {
  //     console.error('Error listing URL entries:', err);
  //     throw err;
  //   }
  // }

  /**
   * @param {string} shortId
   * @param {Object} updates
   * @param {string} [updates.newShortCode]
   * @param {string} [updates.expirationDate]
   * @returns {Promise<URLEntryDocument | null>}
   */
  async updateURLEntry(shortId, updates) {
    try {
      const document = /** @type {URLEntryDocument} */ (
        await this.databases.updateDocument(
          process.env.APPWRITE_DATABASE_ID,
          process.env.APPWRITE_COLLECTION_ID,
          shortId,
          updates
        )
      );
      return document;
    } catch (err) {
      console.error('Error updating URL entry:', err);
      throw err;
    }
  }

  /**
   * @returns {Promise<boolean>}
   */
  async doesURLEntryDatabaseExist() {
    try {
      await this.databases.get('666926460035dca8000d');
      return true;
    } catch (err) {
      if (err.code !== 404) throw err;
      return false;
    }
  }

  async setupURLEntryDatabase() {
    try {
      await this.databases.create(
        '666926460035dca8000d',
        'URL Shortener'
      );
    } catch (err) {
      // If resource already exists, we can ignore the error
      if (err.code !== 409) throw err;
    }
    try {
      await this.databases.createCollection(
        '666926460035dca8000d',
        '6669267e000a824e00b9',
        'URLs'
      );
    } catch (err) {
      if (err.code !== 409) throw err;
    }
    try {
      await this.databases.createUrlAttribute(
        '666926460035dca8000d',
        '6669267e000a824e00b9',
        'url',
        true
      );
      await this.databases.createIntegerAttribute(
        '666926460035dca8000d',
        '6669267e000a824e00b9',
        'clicks',
        false,
        0
      );
      await this.databases.createStringAttribute(
        '666926460035dca8000d',
        '6669267e000a824e00b9',
        'geoLocation',
        false
      );
      await this.databases.createStringAttribute(
        '666926460035dca8000d',
        '6669267e000a824e00b9',
        'deviceType',
        false
      );
      await this.databases.createStringAttribute(
        '666926460035dca8000d',
        '6669267e000a824e00b9',
        'referrer',
        false
      );
    } catch (err) {
      if (err.code !== 409) throw err;
    }
  }

  
  /**
   * @param {string} shortCode
   * @param {Object} analyticsData
   * @param {string} analyticsData.geoLocation
   * @param {string} analyticsData.deviceType
   * @param {string} analyticsData.referrer
   * @returns {Promise<void>}
   */
  async logClick(shortCode, analyticsData) {
    try {
      const urlEntry = await this.getURLEntry(shortCode);
      if (!urlEntry) {
        throw new Error('URL entry not found');
      }

      const updatedDocument = await this.databases.updateDocument(
        '666926460035dca8000d',
        '6669267e000a824e00b9',
        shortCode,
        {
          clicks: urlEntry.clicks + 1,
          geoLocation: analyticsData.geoLocation,
          deviceType: analyticsData.deviceType,
          referrer: analyticsData.referrer
        }
      );
      return updatedDocument;
    } catch (err) {
      console.error('Failed to log click:', err);
    }
  }

  /**
   * @param {string} shortCode
   * @returns {Promise<Object>}
   */
  async getAnalyticsData(shortCode) {
    try {
      const document = await this.databases.getDocument(
        '666926460035dca8000d',
        '6669267e000a824e00b9',
        shortCode
      );

      return document;
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      return null;
    }
  }
}

export default AppwriteService;
