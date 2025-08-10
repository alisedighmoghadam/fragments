const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const sharp = require('sharp');
const MarkdownIt = require('markdown-it');
const TurndownService = require('turndown');
const Papa = require('papaparse');
const yaml = require('js-yaml');

const extToPrimaryType = {
  txt: 'text/plain',
  md: 'text/markdown',
  html: 'text/html',
  csv: 'text/csv',
  json: 'application/json',
  yaml: 'application/yaml',
  yml: 'application/yaml',
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

// ---------- Image converters ----------
const toPng = async (buf) => sharp(buf).png().toBuffer();
const toJpeg = async (buf) => sharp(buf).jpeg().toBuffer();
const toWebp = async (buf) => sharp(buf).webp().toBuffer();
const toAvif = async (buf) => sharp(buf).avif().toBuffer();
const toGif = async (buf) => sharp(buf).gif().toBuffer();

// ---------- Text converters ----------
const mdParser = new MarkdownIt();
const turndown = new TurndownService();

const id = async (x) => x;
const mdToHtml = async (md) => mdParser.render(md);
const htmlToMd = async (html) => turndown.turndown(html);
const csvToJson = async (csv) => {
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return JSON.stringify(parsed.data);
};
const jsonToPlain = async (json) => {
  return typeof json === 'string' ? json : JSON.stringify(json);
};

const jsonToYaml = async (json) => yaml.dump(typeof json === 'string' ? JSON.parse(json) : json);

// ---------- Converter dictionary ----------
const converters = {
  'text/plain': { 'text/plain': id },
  'text/markdown': { 'text/markdown': id, 'text/html': mdToHtml, 'text/plain': id },
  'text/html': { 'text/html': id, 'text/markdown': htmlToMd, 'text/plain': htmlToMd },
  'text/csv': { 'text/csv': id, 'application/json': csvToJson, 'text/plain': id },
  'application/json': {
    'application/json': id,
    'text/plain': jsonToPlain,
    'application/yaml': jsonToYaml,
  },
  'application/yaml': { 'application/yaml': id, 'text/plain': id },
  'image/png': {
    'image/png': id,
    'image/jpeg': toJpeg,
    'image/webp': toWebp,
    'image/avif': toAvif,
    'image/gif': toGif,
  },
  'image/jpeg': {
    'image/png': toPng,
    'image/jpeg': id,
    'image/webp': toWebp,
    'image/avif': toAvif,
    'image/gif': toGif,
  },
  'image/webp': {
    'image/png': toPng,
    'image/jpeg': toJpeg,
    'image/webp': id,
    'image/avif': toAvif,
    'image/gif': toGif,
  },
  'image/avif': {
    'image/png': toPng,
    'image/jpeg': toJpeg,
    'image/webp': toWebp,
    'image/avif': id,
    'image/gif': toGif,
  },
  'image/gif': {
    'image/png': toPng,
    'image/jpeg': toJpeg,
    'image/webp': toWebp,
    'image/avif': toAvif,
    'image/gif': id,
  },
};

async function convert(input, fromMime, toMime) {
  const from = converters[fromMime];
  if (!from) throw new Error(`Unsupported source type: ${fromMime}`);
  const fn = from[toMime];
  if (!fn) throw new Error(`Cannot convert ${fromMime} -> ${toMime}`);
  return fn(input);
}

module.exports = async (req, res) => {
  const { id, ext } = req.params;
  const ownerId = req.user;

  try {
    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      return res.status(404).json({ status: 'error', message: 'Fragment not found' });
    }

    const targetMime = extToPrimaryType[ext];
    if (!targetMime) {
      return res.status(400).json({ status: 'error', message: 'Unsupported extension' });
    }

    if (!fragment.formats.includes(targetMime)) {
      return res
        .status(415)
        .json({ status: 'error', message: `Cannot convert this format to .${ext}` });
    }

    logger.info(`Converting fragment=${fragment.id} from ${fragment.mimeType} to ${targetMime}`);

    // If already the same type
    if (fragment.mimeType === targetMime) {
      res.setHeader('Content-Type', fragment.type);
      const data = await fragment.getData();
      return res.status(200).send(data.toString('utf8'));
    }
    const data = await fragment.getData();
    console.log(fragment.isText ? data.toString('utf8') : data);
    // Try conversion
    const converted = await convert(
      fragment.isText ? data.toString('utf8') : data,
      fragment.mimeType,
      targetMime
    );
    console.log(converted);
    res.setHeader('Content-Type', targetMime);
    return res.status(200).send(converted);
  } catch (err) {
    logger.error(err, `Error processing fragment ${id} with extension ${ext}`);
    return res.status(500).json({ status: 'error', message: 'Conversion failed' });
  }
};
