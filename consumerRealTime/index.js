// import Kafka from 'node-rdkafka';
// import http from 'http';
// import path from 'path';
// import axios from 'axios'; // Import axios

// const consumer = new Kafka.KafkaConsumer({
//   'group.id': 'kafkarogella',
//   'metadata.broker.list': 'ntx-message-queue.hive404.com:9092',
// }, {});

// consumer.connect();
// const server = http.createServer(); // Removed 'app' parameter

// const __dirname = path.dirname(new URL(import.meta.url).pathname);
// let responseStream;
// let messagesArray = [];

// consumer.connect();

// consumer.on('ready', () => {
//   console.log('Consumer ready..');
//   consumer.subscribe(['realTimeKafka']);
//   consumer.consume();
// }).on('data', function (data) {

//   const message = JSON.parse(data.value.toString());
//   const id = message.id;
//   const winner = message.result;
//   const accuracy = message.accuracy;

//   const results = {
//     "id": id,
//     "accuracy": accuracy,
//     "result": winner,
//     "new_status": true,
//   }

//   const dataToUpdate = {
//     "new_accuracy": accuracy,
//     "new_result": winner,
//     "new_status": true,
//   }

//   console.log("results:", results);

//   messagesArray.push(message);

//   if (responseStream) {
//     responseStream.write(`data: ${message}\n\n`);
//   }
//   axios.put(`http://0.0.0.0:8000/api/protoRealTimeAnalysis/update_protoRealTimeAnalysis/${id}`, dataToUpdate)//endpoint local
//   .then(response => {
//     console.log(`Successfully updated analysis for ID ${id}`);
//   })
//   .catch(error => {
//     console.error(`Error updating analysis for ID ${id}:`, error.response.data.detail);
//   });
// });

// const PORT = 3003;
// server.listen(PORT, () => {
// console.log(`Server listening on port ${PORT}`);
// });









// /*Consommation données provenant d'Amazon*/
import http from 'http';
import path from 'path';
import Kafka from 'node-rdkafka';
import axios from 'axios'; // Import axios

// // Removed the unused express variable

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
