import Graph from '../src/'

/*
 * Example graph
 *
 *      a --> b --> c
 *            ^
 *            |
 *      d --> e
 *
 *  Also:
 *
 *      `b` is a children of `a`
 *      `e` is a children of `d`
 */

test('composite', () => {
  const graph = new Graph({ compound: true })

  graph.setPath(['a', 'b', 'c'])
  graph.setPath(['d', 'e', 'b'])

  graph.setParent('b', 'a')
  graph.setParent('e', 'd')

  // parent getters
  expect(graph.parent('b')).toEqual('a')
  expect(graph.parent('e')).toEqual('d')

  // children getters
  expect([...graph.children('a')].length).toEqual(1)
  expect([...graph.children('d')].length).toEqual(1)
})
