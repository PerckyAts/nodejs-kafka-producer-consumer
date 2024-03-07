import Kafka from 'node-rdkafka';

const consumer = new Kafka.KafkaConsumer({
  'group.id': 'kafka',
  'metadata.broker.list': 'ntx-message-queue.hive404.com:9092',
}, {});

consumer.connect();

consumer.on('ready', () => {
  console.log('consumer ready..')
  consumer.subscribe(['test']);
  consumer.consume();
}).on('data', function (data) {
  try {
    const decodedMessage = JSON.parse(data.value.toString()); // Décode la chaîne JSON directement
    console.log('received message:', decodedMessage);
    const substructedMessage = substructNoise(decodedMessage);
    produceResponse(JSON.stringify(substructedMessage));
    console.log('returned message:', substructedMessage);
  } catch (error) {
    console.error('Error decoding JSON message:', error);
  }
});

// Fonction pour multiplier la valeur du bruit par 2
function substructNoise(message) {
  if (message && message.noise) {
    message.noise -= 1;
  }
  return message;
}

// Fonction pour envoyer la réponse à un topic Kafka
function produceResponse(message) {
  const producer = new Kafka.Producer({
    'metadata.broker.list': 'ntx-message-queue.hive404.com:9092'
  });

  producer.connect();

  producer.on('ready', () => {
    producer.produce(
      'response', // Changer cela pour le topic de réponse désiré
      null,
      Buffer.from(message),
      null,
      Date.now()
    );
  });

  producer.on('event.error', (err) => {
    console.error('Error from producer:', err);
  });
}