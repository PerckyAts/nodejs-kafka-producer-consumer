import express from 'express';
import avro from 'avsc';
import http from 'http';
import path from 'path';
import Kafka from 'node-rdkafka';
import cors from 'cors';
import eventType from '../eventType.js';

const schema = avro.Type.forSchema({
  type: 'record',
  fields: [
    {
      name: 'noise',
      type: 'string',
    }
  ]
});
const app = express();
const server = http.createServer(app);

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': '192.168.92.168:9092',
}, {});

let responseStream;
let messagesArray = []; // Déclarer messagesArray comme variable globale pour stocker les messages

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test2.html'));
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

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
