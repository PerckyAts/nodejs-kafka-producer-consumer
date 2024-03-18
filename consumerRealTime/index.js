// import Kafka from 'node-rdkafka';

// const consumer = new Kafka.KafkaConsumer({
//   'group.id': 'kafkarogella',
//   'metadata.broker.list': 'ntx-message-queue.hive404.com:9092',
// }, {});

// consumer.connect();

// consumer.on('ready', () => {
//   console.log('consumer ready..')
//   consumer.subscribe(['realTimeKafka']);
//   consumer.consume();
// }).on('data', function (data) {
//   try {
//     const decodedMessage = JSON.parse(data.value.toString()); 
//     console.log('received message:', decodedMessage);
//     // const substructedMessage = substructNoise(decodedMessage);
//     // produceResponse(JSON.stringify(substructedMessage));
//     // console.log('returned message:', substructedMessage);
//   } catch (error) {
//     console.error('Error decoding JSON message:', error);
//   }
// });

// // Fonction pour multiplier la valeur du bruit par 2
// function substructNoise(message) {
//   if (message && message.noise) {
//     message.noise -= 1;
//   }
//   return message;
// }

// // Fonction pour envoyer la réponse à un topic Kafka
// function produceResponse(message) {
//   const producer = new Kafka.Producer({
//     'metadata.broker.list': 'ntx-message-queue.hive404.com:9092'
//   });

//   producer.connect();

//   producer.on('ready', () => {
//     producer.produce(
//       'response', // Changer cela pour le topic de réponse désiré
//       null,
//       Buffer.from(message),
//       null,
//       Date.now()
//     );
//   });

//   producer.on('event.error', (err) => {
//     console.error('Error from producer:', err);
//   });
// }







/*Consommation données provenant d'Amazon*/
import http from 'http';
import path from 'path';
import Kafka from 'node-rdkafka';
import axios from 'axios'; // Import axios

// Removed the unused express variable

const server = http.createServer(); // Removed 'app' parameter

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafkaRealTimeAnalysis',
  'metadata.broker.list': 'ntx-message-queue.hive404.com:9092',
}, {});

let responseStream;
let messagesArray = [];

consumer.connect();

consumer.on('ready', () => {
  console.log('Consumer ready..');
  consumer.subscribe(['realTimeResponse']);
  consumer.consume();
}).on('data', function (data) {

  const message = JSON.parse(data.value.toString());
  const id = message.id;
  const winner = message.result;
  const accuracy = message.accuracy;

  const results = {
    "id": id,
    "accuracy": accuracy,
    "result": winner,
    "new_status": true,
  }

  const dataToUpdate = {
    "new_accuracy": accuracy,
    "new_result": winner,
    "new_status": true,
  }

  console.log("results:", results);

  messagesArray.push(message);

  if (responseStream) {
    responseStream.write(`data: ${message}\n\n`);
  }

  // Send the results to the specified endpoint
  
  // axios.put(`https://psia-tennis-front.dt-srv-195.ucorp.io/api/protoRealTimeAnalysis/update_protoRealTimeAnalysis/${id}`, dataToUpdate)//endpint prod
  axios.put(`http://0.0.0.0:8000/api/protoRealTimeAnalysis/update_protoRealTimeAnalysis/${id}`, dataToUpdate)//endpoint local
    .then(response => {
      console.log(`Successfully updated analysis for ID ${id}`);
    })
    .catch(error => {
      console.error(`Error updating analysis for ID ${id}:`, error.response.data.detail);
    });
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
