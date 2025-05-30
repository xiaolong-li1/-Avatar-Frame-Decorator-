/**
 * 生成成功响应
 * @param {Object} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} code - 状态码
 * @returns {Object} 响应对象
 */
const successResponse = (data = {}, message = '操作成功', code = 200) => {
  return {
    success: true,
    code,
    message,
    data,
    timestamp: Date.now()
  };
};

/**
 * 生成错误响应
 * @param {string} message - 错误消息
 * @param {number} code - 错误码
 * @param {string} error - 详细错误信息
 * @returns {Object} 错误响应对象
 */
const errorResponse = (message = '操作失败', code = 400, error = undefined) => {
  return {
    success: false,
    code,
    message,
    error,
    timestamp: Date.now()
  };
};

module.exports = {
  successResponse,
  errorResponse
}; 