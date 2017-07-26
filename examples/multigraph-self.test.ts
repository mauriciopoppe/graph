import Graph from '../src/'

/*
 * Example graph
 *
 *      a -> b --> b --> b
 *            2 self loops
 *
 */
test('multigraph - self loop', () => {
  const graph = new Graph({ multigraph: true })

  // getters & setters

  // @param NodeId {string} required
  // @param [value] {any}
  graph.setNode('a')
  graph.setNode('b')

  // @param NodeId {string}
  // @param NodeId {string}
  // @param [value] {any}
  // @param name {string} required in multigraphs
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'b', 'first', 'first')
  graph.setEdge('b', 'b', 'second', 'second')

  // node b's incident edges
  expect([...graph.inEdges('b')].length).toEqual(3)
  // predecessors are 'a' and 'b'
  expect([...graph.predecessors('b')].length).toEqual(2)
})
