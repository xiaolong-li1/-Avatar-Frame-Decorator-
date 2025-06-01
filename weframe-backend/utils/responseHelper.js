// 成功响应
exports.successResponse = (res, data, message = 'Success') => {
  return res.status(200).json({
    success: true,
    data,
    message
  });
};

// 错误响应
exports.errorResponse = (res, statusCode = 500, message = 'Error', error = null) => {
  // 确保 statusCode 是数字
  const code = typeof statusCode === 'number' ? statusCode : 500;
  
  return res.status(code).json({
    success: false,
    message,
    error
  });
};