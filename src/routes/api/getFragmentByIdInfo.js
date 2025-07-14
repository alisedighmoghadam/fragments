const { createSuccessResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { id } = req.params;
  logger.info(`Getting fragment info with id: ${id} for user ${req.user}`);

  try {
    const data = { fragment: (await Fragment.byId(req.user, id))._obj };
    res.status(200).json(createSuccessResponse(data));
  } catch (err) {
    logger.error(err, `Error getting fragment info with id: ${id}, for user ${req.user}`);
    res.status(500).json({ status: 'error', message: 'Unable to fetch fragment' });
  }
};
