const { createSuccessResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { id } = req.params;
  logger.info(`Getting all the fragments for all users`);

  try {
    const data = { fragment: await Fragment.getAllFragments() };
    res.status(200).json(createSuccessResponse(data));
  } catch (err) {
    logger.error(err, `Error getting fragment with id: ${id}, for user ${req.user}`);
    res.status(500).json({ status: 'error', message: 'Unable to fetch fragment' });
  }
};
