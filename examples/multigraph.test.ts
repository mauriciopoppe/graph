import Graph from '../src/'

/*
 * Example graph
 *
 *      a -> b -> c
 *          ^ ^
 *         1| |2
 *          | |
 *      d -> e
 *
 */
test('multigraph', () => {
  const graph = new Graph({ multigraph: true })

  // getters & setters

  // @param NodeId {string} required
  // @param [value] {any}
  graph.setNode('a')
  graph.setNode('b')
  graph.setNode('c')
  graph.setNode('d')
  graph.setNode('e')

  // @param NodeId {string}
  // @param NodeId {string}
  // @param [value] {any}
  // @param name {string} required in multigraphs
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  graph.setEdge('d', 'e')
  graph.setEdge('e', 'b', 'first', 'first')
  graph.setEdge('e', 'b', 'second', 'second')

  // node b's incident edges
  expect([...graph.inEdges('b')].length).toEqual(3)
  // predecessors are still 'a' and 'e'
  expect([...graph.predecessors('b')].length).toEqual(2)
  // all edges incident to b
  expect([...graph.nodeEdges('b')].length).toEqual(4)
})
