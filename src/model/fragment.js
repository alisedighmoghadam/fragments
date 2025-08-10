// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
  getAllOwnerIds,
} = require('./data');
const logger = require('../logger');

const supportedConversions = {
  'text/plain': ['text/plain'],
  'text/markdown': ['text/markdown', 'text/html', 'text/plain'],
  'text/html': ['text/html', 'text/plain'],
  'text/csv': ['text/csv', 'text/plain', 'application/json'],
  'application/json': ['application/json', 'text/plain'],
  'application/yaml': ['application/yaml', 'text/plain'],
  'image/png': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
  'image/jpeg': ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  'image/webp': ['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/avif'],
  'image/avif': ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'],
  'image/gif': ['image/gif', 'image/png', 'image/jpeg', 'image/webp', 'image/avif'],
};

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!(ownerId && type)) {
      logger.error(`Missing entry for ownerId=${ownerId} or type=${type}`);
      throw new Error(`Missing entry for ownerId or type`);
    }

    if (typeof size !== 'number') {
      throw new Error('Size must be a number');
    } else if (size < 0) {
      throw new Error('Size cannot be negative');
    }

    if (!Fragment.isSupportedType(type)) {
      throw new Error('Type not supported');
    }

    this.id = id ? id : randomUUID();
    this.ownerId = ownerId;

    this.created = created ?? new Date().toISOString();
    this.updated = updated ?? this.created;

    this.type = type;
    this.size = size;
    this._obj = {
      id: this.id,
      ownerId: this.ownerId,
      created: this.created,
      updated: this.updated,
      type: this.type,
      size: this.size,
    };
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    const fragmentsMetaData = await listFragments(ownerId, expand);

    if (!expand) {
      return fragmentsMetaData;
    }

    return await Promise.all(
      fragmentsMetaData.map(async (meta) => {
        const data = await readFragmentData(ownerId, meta.id);
        const fragment = new Fragment(meta);
        if (data) await fragment.setData(data);
        return fragment;
      })
    );
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    // TIP: make sure you properly re-create a full Fragment instance after getting from db.

    const result = await readFragment(ownerId, id);
    if (!result) return null;
    const data = await readFragmentData(ownerId, id);
    var fragment = new Fragment(result);

    if (data) {
      await fragment.setData(data);
    }

    return Promise.resolve(fragment);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {
    deleteFragment(ownerId, id);
    return Promise.resolve();
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  async save() {
    this.updated = new Date().toISOString();
    this._obj.updated = this.updated;
    await writeFragment(this._obj);
    await writeFragmentData(this.ownerId, this.id, this._buffer);
    return Promise.resolve();
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    const data = await readFragmentData(this.ownerId, this.id);
    return data;
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    // TIP: make sure you update the metadata whenever you change the data, so they match
    if (!data) {
      throw new Error('Buffer entry is required');
    }
    this.size = data.length;
    this._obj.size = this.size;
    this._buffer = data;
    this.updated = new Date().toISOString();
    this._obj.updated = this.updated;
    await writeFragmentData(this.ownerId, this.id, this._buffer);
    return Promise.resolve();
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return (
      this.mimeType.startsWith('text') ||
      ['application/json', 'application/yaml'].includes(this.mimeType)
    );
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    const mimeType = this.mimeType;
    return supportedConversions[mimeType] || [];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    const { type } = contentType.parse(value);
    if (supportedConversions[type]) {
      return true;
    }
    return false;
  }

  static async getAllFragments() {
    const ownerIds = await getAllOwnerIds();
    const result = {};

    for (const ownerId of ownerIds) {
      const fragments = await this.byUser(ownerId, true);

      // Convert each Fragment instance into plain object with data
      const fragmentObjects = await Promise.all(
        fragments.map(async (f) => {
          const dataBuffer = await f.getData();
          return {
            ...f._obj,
            data: dataBuffer
              ? f.isText
                ? dataBuffer.toString()
                : dataBuffer.toString('base64')
              : null,
          };
        })
      );

      result[ownerId] = fragmentObjects;
    }

    return result;
  }
}

module.exports.Fragment = Fragment;
