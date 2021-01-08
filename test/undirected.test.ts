import Graph from '../src/'

/*
 * Example graph
 *
 *      a -- b -- c
 *           |
 *      d -- e
 *
 */

test('undirected', () => {
  const graph = new Graph({ directed: false })

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
  // @param [name] {string} valid only in multigraphs
  graph.setEdge('a', 'b')
  graph.setEdge('b', 'c')
  graph.setEdge('d', 'e')
  graph.setEdge('e', 'b')

  // existence (edges)
  expect(graph.hasEdge('a', 'b')).toEqual(true)
  expect(graph.hasEdge('b', 'a')).toEqual(true)

  // NOTE: for adjacent edges in as undirected graph use `nodeEdges`
  expect([...graph.nodeEdges('b')].length).toEqual(3)

  // NOTE: for adjacent nodes in an undirected graph use `neighbors`
  expect([...graph.neighbors('b')].length).toEqual(3)
})
