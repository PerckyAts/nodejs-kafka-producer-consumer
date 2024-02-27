import avro from 'avsc';

export default avro.Type.forSchema({
  type: 'record',
  fields: [
    {
      name: 'id',
      type: 'string',
    },
    {
      name: 'noise',
      type: 'string',
    }
  ]
});