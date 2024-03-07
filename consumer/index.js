import express from 'express';
import http from 'http';
import path from 'path';
import Kafka from 'node-rdkafka';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka-percky',
  'metadata.broker.list': 'ntx-message-queue.hive404.com:9092',
}, {});

let responseStream;
let messagesArray = [];

consumer.connect();

consumer.on('ready', () => {
  console.log('Consumer ready..');
  consumer.subscribe(['response']);
  consumer.consume();
}).on('data', function (data) {
  const message = data.value.toString();
  console.log(`Received message: ${message}`);

  messagesArray.push(message);

  if (responseStream) {
    responseStream.write(`data: ${message}\n\n`);
  }
});

app.use(cors());

app.use(express.static(__dirname));

app.get('../', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  responseStream = res;

  req.on('close', () => {
    responseStream = null;
  });
});

app.get('/getMessages', (req, res) => {
  res.json({ messages: messagesArray });
});

app.get('/submit', (req, res) => {
  const message = req.query.message;
  produceResponse({ noise: message });
  res.send('Message sent successfully!');
});

function produceResponse(message) {
  const producer = new Kafka.Producer({
    'metadata.broker.list': 'ntx-message-queue.hive404.com:9092'
  });

  producer.connect();

  producer.on('ready', () => {
    producer.produce(
      'response',
      null,
      Buffer.from(JSON.stringify(message)),
      null,
      Date.now()
    );
  });
  

  producer.on('event.error', (err) => {
    console.error('Error from producer:', err);
  });
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
