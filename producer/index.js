import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Kafka from 'node-rdkafka';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

const stream = Kafka.Producer.createWriteStream({
  'metadata.broker.list': '192.168.92.168:9092'
}, {}, {
  topic: 'test'
});

stream.on('error', (err) => {
  console.error('Error in our Kafka stream');
  console.error(err);
});

function generateUniqueId() {
  return uuidv4();
}

function queueMessage(message) {
  const uniqueId = generateUniqueId();
  const event = { noise: message, id: uniqueId };
  const success = stream.write(JSON.stringify(event)); // Utiliser JSON.stringify pour envoyer l'objet en tant que chaîne JSON
  if (success) {
    console.log(`Message queued with ID ${uniqueId}: ${JSON.stringify(event.noise)}`);
  } else {
    console.log('Too many messages in the queue already..');
  }
}

app.post('/submit', (req, res) => {
  console.log('submit on message queue');
  const message = req.body.message;
  console.log('Message from front-end:', message);
  queueMessage(message);
  res.send('Message sent successfully!');
});

app.listen(port, () => {
  console.log(`Server is running at http://192.168.92.168:${port}`);
});
