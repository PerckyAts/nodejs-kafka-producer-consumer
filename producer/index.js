import Kafka from 'node-rdkafka';
import eventType from '../eventType.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const stream = Kafka.Producer.createWriteStream({
  'metadata.broker.list': 'localhost:9092'
}, {}, {
  topic: 'test'
});

stream.on('error', (err) => {
  console.error('Error in our kafka stream');
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

// Function to take user input and queue the message
function promptUser() {
  rl.question('Enter the message to send: ', (message) => {
    queueMessage(message);
    rl.close();
  });
}

// Start by prompting the user for a message
promptUser();
