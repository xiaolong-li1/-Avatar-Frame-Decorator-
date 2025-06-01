const amqp = require('amqplib');
const connect = require('../config/rabbitmq');
const aiService = require('../services/aiService');

const startWorker = async () => {
  const channel = await connect();
  channel.consume('ai_tasks', async (msg) => {
    const { taskId, imageUrl, scaleFactor } = JSON.parse(msg.content.toString());
    try {
      const result = await aiService.superResolution(imageUrl, scaleFactor);
      // 处理结果，更新数据库等
      channel.ack(msg);
    } catch (error) {
      console.error(error);
      channel.nack(msg);
    }
  });
};

startWorker();