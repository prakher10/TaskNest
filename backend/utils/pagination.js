/**
 * Build a pagination meta object and a Mongoose query slice.
 *
 * @param {object} query   - Express req.query
 * @param {number} total   - Total document count for the current filter
 * @returns {{ skip, limit, meta }}
 */
const paginate = (query, total) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);

  return {
    skip,
    limit,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = paginate;
