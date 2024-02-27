import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Kafka from 'node-rdkafka';
import eventType from '../eventType.js'; // Adjust the path based on your project structure

const app = express();
const port = 3000; // Adjust the port as needed

app.use(bodyParser.json()); // Use JSON middleware instead of urlencoded
app.use(express.static('public')); // Serve static files from the 'public' directory

// Enable CORS for all routes
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

function queueMessage(message) {
  const event = { noise: message };
  const success = stream.write(eventType.toBuffer(event));     
  if (success) {
    console.log(`Message queued: ${JSON.stringify(event.noise)}`);
  } else {
    console.log('Too many messages in the queue already..');
  }
}

app.post('/submit', (req, res) => {
  console.log('submit on message queue');
  const message = req.body.message; // Access the message from the request body
  console.log('Message from front-end:', message);
  queueMessage(message);
  res.send('Message sent successfully!');
});

app.listen(port, () => {
  console.log(`Server is running at http://192.168.92.168:${port}`);
});