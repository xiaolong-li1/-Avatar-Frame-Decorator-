const amqp = require('amqplib');

const connect = async () => {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue('ai_tasks');
  return channel;
};

module.exports = connect;