// src/routes/api/get.js
const { createSuccessResponse } = require('../../response');
/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // TODO: this is just a placeholder. To get something working, return an empty array...
  const data = { fragments: [] };
  res.status(200).json(createSuccessResponse(data));
  // res.status(200).json({
  //   status: 'ok',
  //   // TODO: change me
  //   fragments: [],
  // });
};
