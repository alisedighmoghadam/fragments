// src/routes/api/get.js
const { createSuccessResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {
  const expand = req.query.expand == 1 ? true : false;
  logger.info(`Getting list of fragments for id: ${req.user} with expand of ${req.query.expand}`);

  try {
    const data = { fragments: await Fragment.byUser(req.user, expand) };

    res.status(200).json(createSuccessResponse(data));
  } catch (err) {
    logger.error(err, 'Error getting fragments');
    res.status(500).json({ status: 'error', message: 'Unable to fetch fragments' });
  }
};
