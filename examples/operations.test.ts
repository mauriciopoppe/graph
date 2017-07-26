import Graph from '../src/'

/*
 * Example graph
 *
 *      a --> b --> c
 *            ^
 *            |
 *      d --> e
 *
 */

test('operations', () => {
  const graph = new Graph()

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

  // `node` gets the node value
  expect(graph.node('a')).toEqual(undefined)
  // `edge` gets the edge value
  expect(graph.edge('a', 'b')).toEqual(undefined)

  // number of nodes & edges
  expect(graph.nodeCount()).toEqual(5)
  expect(graph.edgeCount()).toEqual(4)

  // existence
  expect(graph.hasNode('a')).toEqual(true)
  expect(graph.hasNode('z')).toEqual(false)
  expect(graph.hasEdge('a', 'b')).toEqual(true)
  expect(graph.hasEdge('b', 'a')).toEqual(false)

  // iterate over the nodes
  for (const node of graph.nodes()) {
    // ['a', 'b', 'c', 'd', 'e']
    expect(typeof node).toEqual('string')
  }

  // iterate over the internal representation of edges
  for (const edge of graph.edges()) {
    // { v: string, w: string, name?: any }
    expect(typeof edge.v).toEqual('string')
    expect(typeof edge.w).toEqual('string')

    // NOTE: to get the vaue of the edge use `edge`
    expect(graph.edge(edge)).toEqual(undefined)
  }

  // inEdges, outEdges return an interator
  expect([...graph.inEdges('b')].length).toEqual(2)
  expect([...graph.outEdges('b')].length).toEqual(1)

  // predecessors, successors, neighbors return an iterator
  expect([...graph.predecessors('b')].length).toEqual(2)
  expect([...graph.successors('b')].length).toEqual(1)
  expect([...graph.neighbors('b')].length).toEqual(3)
})
