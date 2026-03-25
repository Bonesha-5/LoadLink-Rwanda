// Strips any keys not in the allowed list
// Prevents extra fields being injected into the request body
const allowOnly = (allowedFields) => (req, res, next) => {
  const body = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      body[field] = req.body[field];
    }
  });
  req.body = body;
  next();
};

export { allowOnly };
