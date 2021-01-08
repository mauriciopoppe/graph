import Graph from '../src/index'

describe('Graph', () => {
  let g: Graph

  beforeEach(() => {
    g = new Graph()
  })

  describe('initial state', () => {
    it('has no nodes', () => {
      expect(g.nodeCount()).toEqual(0)
    })

    it('has no edges', () => {
      expect(g.edgeCount()).toEqual(0)
    })

    it('defaults to a simple directed graph', () => {
      expect(g.isDirected()).toEqual(true)
      expect(g.isCompound()).toEqual(false)
      expect(g.isMultigraph()).toEqual(false)
    })

    it('can be set to undirected', () => {
      g = new Graph({ directed: false })
      expect(g.isDirected()).toEqual(false)
      expect(g.isCompound()).toEqual(false)
      expect(g.isMultigraph()).toEqual(false)
    })

    it('can be set to a compound graph', () => {
      g = new Graph({ compound: true })
      expect(g.isDirected()).toEqual(true)
      expect(g.isCompound()).toEqual(true)
      expect(g.isMultigraph()).toEqual(false)
    })

    it('can be set to a multigraph', () => {
      g = new Graph({ multigraph: true })
      expect(g.isDirected()).toEqual(true)
      expect(g.isCompound()).toEqual(false)
      expect(g.isMultigraph()).toEqual(true)
    })
  })

  describe('nodes', () => {
    it('is empty if there are no nodes in the graph', () => {
      expect(Array.from(g.nodes())).toEqual([])
    })

    it('returns the ids of the nodes in the graph', () => {
      g.setNode('a')
      g.setNode('b')
      expect([...g.nodes()]).toEqual(['a', 'b'])
    })
  })

  describe('sources', () => {
    it('returns nodes in the graph that have no in-edges', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setNode('d')
      expect([...g.sources()]).toEqual(['a', 'd'])
    })
  })

  describe('sinks', () => {
    it('returns nodes in the graph that have no out-edges', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setNode('d')
      expect([...g.sinks()]).toEqual(['c', 'd'])
    })
  })

  describe('setNode', () => {
    it("creates the node if it isn't part of the graph", () => {
      g.setNode('a')
      expect(g.hasNode('a')).toEqual(true)
      expect(g.node('a')).toEqual(undefined)
      expect(g.nodeCount()).toEqual(1)
    })

    it('can set a value for the node', () => {
      g.setNode('a', 'foo')
      expect(g.node('a')).toEqual('foo')
    })

    it('is idempotent', () => {
      g.setNode('a', 'foo')
      g.setNode('a', 'foo')
      expect(g.node('a')).toEqual('foo')
      expect(g.nodeCount()).toEqual(1)
    })

    it('uses the stringified form of the id', () => {
      g.setNode('1')
      expect(g.hasNode('1')).toEqual(true)
      expect(g.nodeCount()).toEqual(1)
    })

    it('is chainable', () => {
      expect(g.setNode('a')).toEqual(g)
    })
  })

  describe('removeNode', () => {
    it('does nothing if the node is not in the graph', () => {
      expect(g.nodeCount()).toEqual(0)
      g.removeNode('a')
      expect(g.nodeCount()).toEqual(0)
      expect(g.hasNode('a')).toEqual(false)
    })

    it("removes the node if it's in the graph", () => {
      g.setNode('a')
      g.removeNode('a')
      expect(g.nodeCount()).toEqual(0)
      expect(g.hasNode('a')).toEqual(false)
    })

    it('is idempotent', () => {
      g.setNode('a')
      g.removeNode('a')
      g.removeNode('a')
      expect(g.nodeCount()).toEqual(0)
      expect(g.hasNode('a')).toEqual(false)
    })

    it('removes edges incident to the node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.removeNode('b')
      expect(g.edgeCount()).toEqual(0)
    })

    it('removes parent / child relationships for the node', () => {
      g = new Graph({ compound: true })
      g.setParent('c', 'b')
      g.setParent('b', 'a')
      g.removeNode('b')
      expect(g.parent('b')).toEqual(undefined)
      expect(g.parent('c')).toEqual(undefined)
      expect([...g.children('b')]).toEqual([])
    })
  })

  describe('setParent', () => {
    beforeEach(() => {
      g = new Graph({ compound: true })
    })

    it('throws if the graph is not compound', () => {
      expect(() => {
        new Graph().setParent('a', 'b')
      }).toThrow()
    })

    it('creates the parent if it does not exist', () => {
      g.setNode('a')
      g.setParent('a', 'parent')
      expect(g.hasNode('parent')).toEqual(true)
      expect(g.parent('a')).toEqual('parent')
    })

    it('creates the child if it does not exist', () => {
      g.setNode('parent')
      g.setParent('a', 'parent')
      expect(g.hasNode('a')).toEqual(true)
      expect(g.parent('a')).toEqual('parent')
    })

    it('has the parent as undefined if it has never been invoked', () => {
      g.setNode('a')
      expect(g.parent('a')).toEqual(undefined)
    })

    it('moves the node from the previous parent', () => {
      g.setParent('a', 'first')
      g.setParent('a', 'second')

      expect(g.parent('a')).toEqual('second')
      expect([...g.children('first')]).toEqual([])
      expect([...g.children('second')]).toEqual(['a'])
    })

    it('removes the parent if the parent is undefined', () => {
      g.setParent('a', 'parent')
      g.setParent('a', undefined)
      expect(g.parent('a')).toEqual(undefined)
      expect([...g.children()]).toEqual(['parent', 'a'])
    })

    it('removes the parent if no parent was specified', () => {
      g.setParent('a', 'parent')
      g.setParent('a')
      expect(g.parent('a')).toEqual(undefined)
      expect([...g.children()]).toEqual(['parent', 'a'])
    })

    it('is idempotent to remove a parent', () => {
      g.setParent('a', 'parent')
      g.setParent('a')
      g.setParent('a')
      expect(g.parent('a')).toEqual(undefined)
      expect([...g.children()]).toEqual(['parent', 'a'])
    })

    it('preserves the tree invariant', () => {
      g.setParent('c', 'b')
      g.setParent('b', 'a')
      expect(() => {
        g.setParent('a', 'c')
      }).toThrow()
    })

    it('is chainable', () => {
      expect(g.setParent('a', 'parent')).toEqual(g)
    })
  })

  describe('parent', () => {
    beforeEach(() => {
      g = new Graph({ compound: true })
    })

    it('returns undefined if the graph is not compound', () => {
      expect(new Graph({ compound: false }).parent('a')).toEqual(undefined)
    })

    it('returns undefined if the node is not in the graph', () => {
      expect(g.parent('a')).toEqual(undefined)
    })

    it('defaults to undefined for new nodes', () => {
      g.setNode('a')
      expect(g.parent('a')).toEqual(undefined)
    })
  })

  describe('children', () => {
    beforeEach(() => {
      g = new Graph({ compound: true })
    })

    it('returns an empty list if the node is not in the graph', () => {
      expect([...g.children('a')]).toEqual([])
    })

    it('defaults ot an empty list for new nodes', () => {
      g.setNode('a')
      expect([...g.children('a')]).toEqual([])
    })

    it('returns undefined for a non-compound graph with the node', () => {
      g = new Graph()
      expect([...g.children('a')]).toEqual([])
    })

    it('returns an empty list for a non-compound graph with the node', () => {
      g = new Graph()
      g.setNode('a')
      expect([...g.children('a')]).toEqual([])
    })

    it('returns children for the node', () => {
      g.setParent('a', 'parent')
      g.setParent('b', 'parent')
      expect([...g.children('parent')]).toEqual(['a', 'b'])
    })

    it('returns all nodes without a parent when the parent is not set', () => {
      g.setNode('a')
      g.setNode('b')
      g.setNode('c')
      g.setNode('parent')
      g.setParent('a', 'parent')
      expect([...g.children()]).toEqual(['b', 'c', 'parent'])
      expect([...g.children(undefined)]).toEqual(['b', 'c', 'parent'])
    })
  })

  describe('predecessors', () => {
    it('returns an empty list for a node that is not in the graph', () => {
      expect([...g.predecessors('a')]).toEqual([])
    })

    it('returns the predecessors of a node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect([...g.predecessors('a')]).toEqual(['a'])
      expect([...g.predecessors('b')]).toEqual(['a'])
      expect([...g.predecessors('c')]).toEqual(['b'])
    })
  })

  describe('successors', () => {
    it('returns an empty list for a node that is not in the graph', () => {
      expect([...g.successors('a')]).toEqual([])
    })

    it('returns the predecessors of a node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect([...g.successors('a')]).toEqual(['b', 'a'])
      expect([...g.successors('b')]).toEqual(['c'])
      expect([...g.successors('c')]).toEqual([])
    })
  })

  describe('neighbors', () => {
    it('returns an empty list for a node that is not in the graph', () => {
      expect([...g.neighbors('a')]).toEqual([])
    })

    it('returns the neighbors of a node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      g.setEdge('a', 'a')
      expect([...g.neighbors('a')]).toEqual(['a', 'b'])
      expect([...g.neighbors('b')]).toEqual(['a', 'c'])
      expect([...g.neighbors('c')]).toEqual(['b'])
    })
  })

  describe('isLeaf', () => {
    it('return false for connectd node in undirected graph', () => {
      g = new Graph({ directed: false })
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.isLeaf('b')).toEqual(false)
    })

    it('returns true for an unconnected node in undirected graph', () => {
      g = new Graph({ directed: false })
      g.setNode('a')
      expect(g.isLeaf('a')).toEqual(true)
    })

    it('return true for unconnected node in directed graph', () => {
      g.setNode('a')
      expect(g.isLeaf('a')).toEqual(true)
    })

    it('returns false for predecessor node in dircted graph', () => {
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.isLeaf('a')).toEqual(false)
    })

    it('returns true for successor node in directed graph', () => {
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.isLeaf('b')).toEqual(true)
    })
  })

  describe('edges', () => {
    it('is empty if there are no edges in the graph', () => {
      expect([...g.edges()]).toEqual([])
    })

    it('returns the keys for edges in the graph', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      const edges = [...g.edges()]
      expect(edges).toEqual([
        { v: 'a', w: 'b' },
        { v: 'b', w: 'c' },
      ])
    })
  })

  describe('setPath', () => {
    it('creates a path of multiple edges', () => {
      g.setPath(['a', 'b', 'c'])
      expect(g.hasEdge('a', 'b')).toEqual(true)
      expect(g.hasEdge('b', 'c')).toEqual(true)
    })

    it('can set a value for all the edges', () => {
      g.setPath(['a', 'b', 'c'], 'foo')
      expect(g.edge('a', 'b')).toEqual('foo')
      expect(g.edge('b', 'c')).toEqual('foo')
    })

    it('is chainable', () => {
      expect(g.setPath(['a', 'b', 'c'])).toEqual(g)
    })
  })

  describe('setEdge', () => {
    it("creates the edge if it isn't part of the graph", () => {
      g.setNode('a')
      g.setNode('b')
      g.setEdge('a', 'b')
      expect(g.edge('a', 'b')).toEqual(undefined)
      expect(g.hasEdge('a', 'b')).toEqual(true)
      expect(g.hasEdge({ v: 'a', w: 'b' })).toEqual(true)
      expect(g.edgeCount()).toEqual(1)
    })

    it('creates the nodes for the edge if they are not part of the graph', () => {
      g.setEdge('a', 'b')
      expect(g.hasNode('a')).toEqual(true)
      expect(g.hasNode('b')).toEqual(true)
      expect(g.nodeCount()).toEqual(2)
    })

    it('changes the value for an edge if it is already in the graph', () => {
      g.setEdge('a', 'b', 'foo')
      g.setEdge('a', 'b', 'bar')
      expect(g.edge('a', 'b')).toEqual('bar')
      expect(g.edgeCount()).toEqual(1)
    })

    it('deletes the value for the edge if the value is undefined', () => {
      g.setEdge('a', 'b', 'foo')
      g.setEdge('a', 'b', undefined)
      expect(g.edge('a', 'b')).toEqual(undefined)
      expect(g.hasEdge('a', 'b')).toEqual(true)
    })

    it('throws if a multi-edge edge is attempted to be created', () => {
      expect(() => {
        g.setEdge('a', 'b', undefined, 'name')
      }).toThrow()
    })

    it('can take an edge object as he first parameter', () => {
      g.setEdge({ v: 'a', w: 'b' }, 'value')
      expect(g.edge('a', 'b')).toEqual('value')
    })

    it('treats edges in opposite directions as distinct in a digraph', () => {
      g.setEdge('a', 'b')
      expect(g.hasEdge('a', 'b')).toEqual(true)
      expect(g.hasEdge('b', 'a')).toEqual(false)
    })

    it('is chainable', () => {
      expect(g.setEdge('a', 'b')).toEqual(g)
    })

    describe('undirected', () => {
      beforeEach(() => {
        g = new Graph({ directed: false })
      })

      it('handles undirected graph edges', () => {
        g.setEdge('a', 'b', 'foo')
        expect(g.edge('a', 'b')).toEqual('foo')
        expect(g.edge('b', 'a')).toEqual('foo')
        expect(g.hasEdge('a', 'b')).toEqual(true)
        expect(g.hasEdge('b', 'a')).toEqual(true)
      })
    })

    describe('multiedge', () => {
      beforeEach(() => {
        g = new Graph({ multigraph: true })
      })

      it('creates multiedge edges', () => {
        g.setEdge('a', 'b', undefined, 'name')
        expect(g.hasEdge('a', 'b')).toEqual(false)
        expect(g.hasEdge('a', 'b', 'name')).toEqual(true)
      })

      it('changes the value for a multi-edge if it is already in the graph', () => {
        g.setEdge('a', 'b', 'value', 'name')
        g.setEdge('a', 'b', undefined, 'name')
        expect(g.edge('a', 'b', 'name')).toEqual(undefined)
        expect(g.hasEdge('a', 'b', 'name')).toEqual(true)
      })

      it('can take a multi-edge object as the first parameter', () => {
        g.setEdge({ v: 'a', w: 'b', name: 'name' }, 'value')
        expect(g.edge('a', 'b', 'name')).toEqual('value')
      })
    })
  })

  describe('edge', () => {
    it("returns undefined if the edge isn't part of the graph", () => {
      expect(g.edge('a', 'b')).toEqual(undefined)
      expect(g.edge({ v: 'a', w: 'b' })).toEqual(undefined)
      expect(g.edge('a', 'b', 'foo')).toEqual(undefined)
    })

    it('returns the value of the edge if it is part of the graph', () => {
      g.setEdge('a', 'b', { foo: 'bar' })
      expect(g.edge('a', 'b')).toEqual({ foo: 'bar' })
      expect(g.edge({ v: 'a', w: 'b' })).toEqual({ foo: 'bar' })
      expect(g.edge('b', 'a')).toEqual(undefined)
    })

    it('returns the value of a multi-edge if it is part of the graph', () => {
      g = new Graph({ multigraph: true })
      g.setEdge('a', 'b', { foo: 'bar' }, 'foo')
      expect(g.edge('a', 'b', 'foo')).toEqual({ foo: 'bar' })
      expect(g.edge('a', 'b')).toEqual(undefined)
    })

    it('returns an edge in either direction in an undirected graph', () => {
      g = new Graph({ directed: false })
      g.setEdge('a', 'b', { foo: 'bar' })
      expect(g.edge('a', 'b')).toEqual({ foo: 'bar' })
      expect(g.edge('b', 'a')).toEqual({ foo: 'bar' })
    })
  })

  describe('removeEdge', () => {
    it('has no effect if the edge is not in the graph', () => {
      g.removeEdge('a', 'b')
      expect(g.hasEdge('a', 'b')).toEqual(false)
      expect(g.edgeCount()).toEqual(0)
    })

    it('can remove an edge by edgeObj', () => {
      g = new Graph({ multigraph: true })
      g.setEdge({ v: 'a', w: 'b', name: 'foo' })
      g.removeEdge({ v: 'a', w: 'b', name: 'foo' })
      expect(g.hasEdge('a', 'b', 'foo')).toEqual(false)
      expect(g.edgeCount()).toEqual(0)
    })

    it('correctly removes neighbors', () => {
      g.setEdge('a', 'b')
      g.removeEdge('a', 'b')
      expect([...g.successors('a')]).toEqual([])
      expect([...g.neighbors('a')]).toEqual([])
      expect([...g.predecessors('b')]).toEqual([])
      expect([...g.neighbors('b')]).toEqual([])
    })

    it('correctly decrements neighbors counts', () => {
      g = new Graph({ multigraph: true })
      g.setEdge('a', 'b')
      g.setEdge({ v: 'a', w: 'b', name: 'foo' })
      g.removeEdge('a', 'b')
      expect(g.hasEdge('a', 'b', 'foo')).toEqual(true)
      expect([...g.successors('a')]).toEqual(['b'])
      expect([...g.neighbors('a')]).toEqual(['b'])
      expect([...g.predecessors('b')]).toEqual(['a'])
      expect([...g.neighbors('b')]).toEqual(['a'])
    })

    it('works with undirected graphs', () => {
      g = new Graph({ directed: false })
      g.setEdge('h', 'g')
      g.removeEdge('g', 'h')
      expect(g.edgeCount()).toEqual(0)
      expect([...g.neighbors('g')]).toEqual([])
      expect([...g.neighbors('h')]).toEqual([])
    })
  })

  describe('inEdges', () => {
    it('returns an empty list for a node that is not in the graph', () => {
      expect([...g.inEdges('a')]).toEqual([])
    })

    it('returns the edges that point at the specified node', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect([...g.inEdges('a')]).toEqual([])
      expect([...g.inEdges('b')]).toEqual([{ v: 'a', w: 'b' }])
      expect([...g.inEdges('c')]).toEqual([{ v: 'b', w: 'c' }])
    })

    it('works for multigraphs', () => {
      g = new Graph({ multigraph: true })
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'bar')
      g.setEdge('a', 'b', undefined, 'foo')
      expect([...g.inEdges('a')]).toEqual([])
      expect([...g.inEdges('b')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'a', w: 'b', name: 'bar' },
        { v: 'a', w: 'b', name: 'foo' },
      ])
    })

    it('can return only edges from a specified node', () => {
      g = new Graph({ multigraph: true })
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'foo')
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect([...g.inEdges('a', 'b')]).toEqual([])
      expect([...g.inEdges('b', 'a')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'a', w: 'b', name: 'foo' },
      ])
    })
  })

  describe('outEdges', () => {
    it('returns an empty list for a node that is not in the graph', () => {
      expect([...g.outEdges('a')]).toEqual([])
    })

    it('returns all edges that this node points at', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect([...g.outEdges('a')]).toEqual([{ v: 'a', w: 'b' }])
      expect([...g.outEdges('b')]).toEqual([{ v: 'b', w: 'c' }])
      expect([...g.outEdges('c')]).toEqual([])
    })

    it('works for multigraphs', () => {
      g = new Graph({ multigraph: true })
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'bar')
      g.setEdge('a', 'b', undefined, 'foo')
      expect([...g.outEdges('a')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'a', w: 'b', name: 'bar' },
        { v: 'a', w: 'b', name: 'foo' },
      ])
    })

    it('can return only edges to a specified node', () => {
      g = new Graph({ multigraph: true })
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'foo')
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect([...g.outEdges('a', 'b')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'a', w: 'b', name: 'foo' },
      ])
      expect([...g.outEdges('b', 'a')]).toEqual([])
    })
  })

  describe('nodeEdges', () => {
    it('returns an empty list for a node that is not in the graph', () => {
      expect([...g.nodeEdges('a')]).toEqual([])
    })

    it('returns all edges that this node points at', () => {
      g.setEdge('a', 'b')
      g.setEdge('b', 'c')
      expect([...g.nodeEdges('a')]).toEqual([{ v: 'a', w: 'b' }])
      expect([...g.nodeEdges('b')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'b', w: 'c' },
      ])
      expect([...g.nodeEdges('c')]).toEqual([{ v: 'b', w: 'c' }])
    })

    it('works for multigraphs', () => {
      g = new Graph({ multigraph: true })
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'bar')
      g.setEdge('a', 'b', undefined, 'foo')
      expect([...g.nodeEdges('a')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'a', w: 'b', name: 'bar' },
        { v: 'a', w: 'b', name: 'foo' },
      ])
      expect([...g.nodeEdges('b')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'a', w: 'b', name: 'bar' },
        { v: 'a', w: 'b', name: 'foo' },
      ])
    })

    it('can return only edges to a specified node', () => {
      g = new Graph({ multigraph: true })
      g.setEdge('a', 'b')
      g.setEdge('a', 'b', undefined, 'foo')
      g.setEdge('a', 'c')
      g.setEdge('b', 'c')
      g.setEdge('z', 'a')
      g.setEdge('z', 'b')
      expect([...g.nodeEdges('a', 'b')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'a', w: 'b', name: 'foo' },
      ])
      expect([...g.nodeEdges('b', 'a')]).toEqual([
        { v: 'a', w: 'b' },
        { v: 'a', w: 'b', name: 'foo' },
      ])
    })
  })

  describe('events', () => {
    it('emits the setNode event', () => {
      const handler = jest.fn()
      g.on('setNode', handler)
      g.setNode('a', 'b')
      expect(handler.mock.calls.length).toEqual(1)
      expect(handler.mock.calls[0][0]).toEqual('a')
      expect(handler.mock.calls[0][1]).toEqual('b')
    })

    it('emits the setNode event on update', () => {
      const handler = jest.fn()
      g.setNode('a', 'b')
      g.on('setNode', handler)
      g.setNode('a', 'c')
      expect(handler.mock.calls.length).toEqual(1)
      expect(handler.mock.calls[0][0]).toEqual('a')
      expect(handler.mock.calls[0][1]).toEqual('c')
      expect(handler.mock.calls[0][2]).toEqual(true)
    })

    it('emits the removeNode event', () => {
      const handler = jest.fn()
      g.setNode('a', 'b')
      g.on('removeNode', handler)
      g.removeNode('a')
      expect(handler.mock.calls.length).toEqual(1)
      expect(handler.mock.calls[0][0]).toEqual('a')
    })

    it('emits the setEdge event', () => {
      const handler = jest.fn()
      g.on('setEdge', handler)
      g.setEdge('a', 'b')
      expect(handler.mock.calls.length).toEqual(1)
      expect(handler.mock.calls[0][0]).toEqual({ v: 'a', w: 'b' })
      expect(handler.mock.calls[0][1]).toEqual(undefined)
    })

    it('emits the setEdge event', () => {
      const handler = jest.fn()
      g.setEdge('a', 'b', 'foo')
      g.on('setEdge', handler)
      g.setEdge('a', 'b', 'bar')
      expect(handler.mock.calls.length).toEqual(1)
      expect(handler.mock.calls[0][0]).toEqual({ v: 'a', w: 'b' })
      expect(handler.mock.calls[0][1]).toEqual('bar')
      expect(handler.mock.calls[0][2]).toEqual(true)
    })

    it('emits the removeEdge event', () => {
      const handler = jest.fn()
      g.setEdge('a', 'b', 'c')
      g.on('removeEdge', handler)
      g.removeEdge({ v: 'a', w: 'b' })
      expect(handler.mock.calls.length).toEqual(1)
      expect(handler.mock.calls[0][0]).toEqual({ v: 'a', w: 'b' })
    })
  })
})
