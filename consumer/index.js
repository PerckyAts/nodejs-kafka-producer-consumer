import http from 'http';
import path from 'path';
import Kafka from 'node-rdkafka';
import axios from 'axios'; 
import express from 'express';
import dotenv from 'dotenv';
const app = express();
const port = 3006;

if (process.env.NODE_ENV) {
    dotenv.config({path: `./.env.${process.env.NODE_ENV}`});
} else {
    dotenv.config();
}
let urlPython=process.env.URL;

const server = http.createServer(); // Removed 'app' parameter

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const consumer = new Kafka.KafkaConsumer({
  'group.id': 'consumerPreMatchAnalysis',
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

  const message = JSON.parse(data.value.toString());
  const id = message.id;
  const winner = message.winner[0];
  const accuracy = message.winner[1];

  const results = {
    "id": id,
    "accuracy": accuracy,
    "result": winner,
    "new_status": true,
  }

  const dataToUpdate = {
    "new_accurracy": accuracy,
    "new_result": winner,
    "new_status": true,
  }

  console.log("results:", results);

  messagesArray.push(message);

  if (responseStream) {
    responseStream.write(`data: ${message}\n\n`);
  }

  // Send the results to the specified endpoint
  
  // axios.put(`https://psia-tennis-front.dt-srv-195.ucorp.io/api/analize/update_analyze/${id}`, dataToUpdate)//endpint prod
  // axios.put(`http://0.0.0.0:8000/api/analize/update_analyze/${id}`, dataToUpdate)//endpoint local
  axios.put(`${urlPython}api/analize/update_analyze/${id}`, dataToUpdate)//endpoint local
    .then(response => {
      console.log(`Successfully updated analysis for ID ${id}`);
    })
    .catch(error => {
      console.error(`Error updating analysis for ID ${id}:`, error.response.data.detail);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
