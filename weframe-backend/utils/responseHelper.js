exports.successResponse = (res, data, message = '操作成功') => {
  res.json({ success: true, code: 200, message, data, timestamp: Date.now() });
};

exports.errorResponse = (res, code, message, error) => {
  res.status(code).json({ success: false, code, message, error, timestamp: Date.now() });
};