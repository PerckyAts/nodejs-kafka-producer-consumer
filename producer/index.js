import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Kafka from 'node-rdkafka';

const app = express();
const port = 3000;

// Adresse IP autorisée
const allowedIpAddresses = ['127.0.0.1', '62.4.5.195', '172.19.0.225'];
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(cors());

// Middleware pour l'authentification basée sur l'adresse IP
const authenticate = (req, res, next) => {
  const clientIpAddress = getRealIpAddress(req);
  
  if (allowedIpAddresses.includes(clientIpAddress)) {
    return next();
  } else {
    return res.status(401).send('Unauthorized');
  }
};

const getRealIpAddress = (req) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = xForwardedFor ? xForwardedFor.split(',')[0] : req.connection.remoteAddress;
  return ipAddress.replace('::ffff:', ''); // Supprimer '::ffff:' si présent
};

// Appliquer le middleware d'authentification seulement à l'endpoint /produce
app.use('/produce', authenticate);

// Kafka Producer
const producerStream = Kafka.Producer.createWriteStream({
  'metadata.broker.list': 'ntx-message-queue.hive404.com:9092'
}, {}, {
  topic: 'test'
});

producerStream.on('error', (err) => {
  console.error('Error in our Kafka producer stream');
  console.error(err);
});

function queueMessage(message) {
  const uniqueId = message.id;

  const event = { first_player_name: message.first_player_name, 
                  id: uniqueId,
                  second_player_name:message.second_player_name,
                  status:message.status,
                  date: message.date,
                  acccuracy:message.acccuracy,
                  users_id:message.users_id,
                  match_key:message.match_key,
                };
  const success = producerStream.write(JSON.stringify(event));
  if (success) {
    console.log(`Message queued with ID ${uniqueId}: ${JSON.stringify(event.first_player_name)} vs ${JSON.stringify(event.second_player_name)}`);
  } else {
    console.log('Too many messages in the queue already..');
  }
}

app.post('/produce', (req, res) => {
  console.log('produce on message queue');
  console.log("req.body", req.body);
  const message = req.body;

  if (!message) {
    return res.status(400).send('Bad Request: Message is required in the request body.');
  }

  console.log('Message from front-end:', message);
  queueMessage(message);
  res.send('Message produced successfully!');
});

app.listen(port, () => {
  console.log(`Server is running at http://192.168.92.168:${port}`);
});
