import Graph from '../../src/'

test('events', () => {
  // Graph inherits from EventEmitter and emits the events described in
  // https://mauriciopoppe.github.io/graph/modules/_index_.html#events
  const graph = new Graph()

  graph.on('setNode', (node, value) => {
    expect(node).toEqual('a')
    expect(value).toEqual(1)
  })

  graph.setNode('a', 1)
})
